import { Math as PhaserMath, type GameObjects, Scene } from "phaser";

import { EventBus } from "../EventBus";
import { FIELD_BACKGROUND_TEXTURE_KEY } from "../preloadAssets";
import { startBackgroundMusic } from "../backgroundMusic";
import type { PlantedFarmBean } from "../../lib/beans";
import {
    SAFE_AREA_CENTER_X,
    SAFE_AREA_CENTER_Y,
    SAFE_AREA_HEIGHT,
    SAFE_AREA_WIDTH,
    useSafeAreaCamera,
    useSafeAreaDebugOverlay,
} from "../SafeArea";

type LogoPositionCallback = ({ x, y }: { x: number; y: number }) => void;

type FarmGroupCorner =
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";
type FarmPlantSlot = {
    id: string;
    x: number;
    y: number;
    isLocked: boolean;
    button: GameObjects.Container;
    buttonCircle: GameObjects.Arc;
    buttonLabel: GameObjects.Text;
    plantedBeanImage: GameObjects.Image | null;
    plantedBeanIdleTween: Phaser.Tweens.Tween | null;
};

type FarmPlantBeanPayload = {
    slotId: string;
    bean: PlantedFarmBean["bean"];
};

const FARM_GROUP_WIDTH = 300;
const FARM_GROUP_HEIGHT = 300;
const FARM_GROUP_HORIZONTAL_GAP = 160;
const FARM_GROUP_VERTICAL_GAP = 220;
const FARM_GROUP_DEPTH = 20;
const UNLOCKED_FARM_GROUP_INDEX = 0;
const FARM_PLANT_BUTTON_SIZE = 78;
const FARM_PLANT_BUTTON_INSET = 64;
const FARM_PLANTED_BEAN_SIZE = 126;
const FARM_PLANTED_BEAN_VERTICAL_OFFSET = FARM_PLANTED_BEAN_SIZE * 0.75;
const FARM_PLANTED_BEAN_IDLE_SCALE_X_MULTIPLIER = 0.95;
const FARM_PLANTED_BEAN_IDLE_SCALE_Y_MULTIPLIER = 1.05;
const FARM_PLANTED_BEAN_IDLE_DURATION = 900;
const FARM_SEED_BUTTON_SIZE = 96;
const FARM_LOCK_OVERLAY_WIDTH = FARM_GROUP_WIDTH + 96;
const FARM_LOCK_OVERLAY_HEIGHT = FARM_GROUP_HEIGHT + 96;
const FARM_LOCK_OVERLAY_DEPTH = 80;
const FIELD_BACKGROUND_DISPLAY_WIDTH = 1440;

const farmGroupCorners: FarmGroupCorner[] = [
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right",
];

export class FarmScene extends Scene {
    fieldBackground!: GameObjects.Image;
    horizontalLogo!: GameObjects.Image;
    logoTween: Phaser.Tweens.Tween | null = null;
    logoMoveCallback: LogoPositionCallback | null = null;
    farmPlantSlots = new Map<string, FarmPlantSlot>();
    isPlantPanelOpen = false;

    constructor() {
        super("FarmScene");
    }

    create() {
        useSafeAreaCamera(this);
        startBackgroundMusic(this);
        this.createFieldBackground();
        this.createFarmGroups();
        useSafeAreaDebugOverlay(this);

        // this.createLogo();
        this.events.once("shutdown", () => {
            EventBus.off("farm-plant-bean", this.handleFarmPlantBean, this);
            EventBus.off(
                "farm-planted-beans-changed",
                this.restorePlantedFarmBeans,
                this
            );
            EventBus.off(
                "farm-plant-panel-open-changed",
                this.handlePlantPanelOpenChanged,
                this
            );
            this.stopAllPlantedBeanIdleAnimations();
        });
        EventBus.on("farm-plant-bean", this.handleFarmPlantBean, this);
        EventBus.on(
            "farm-planted-beans-changed",
            this.restorePlantedFarmBeans,
            this
        );
        EventBus.on(
            "farm-plant-panel-open-changed",
            this.handlePlantPanelOpenChanged,
            this
        );

        EventBus.emit("current-scene-ready", this);
    }

    createFieldBackground() {
        this.fieldBackground = this.add
            .image(
                SAFE_AREA_CENTER_X,
                SAFE_AREA_CENTER_Y,
                FIELD_BACKGROUND_TEXTURE_KEY
            )
            .setOrigin(0.5)
            .setDepth(-100);

        this.fitFieldBackgroundToFixedWidth();
    }

    createFarmGroups() {
        const leftFarmGroupX =
            (SAFE_AREA_WIDTH -
                FARM_GROUP_WIDTH * 2 -
                FARM_GROUP_HORIZONTAL_GAP) /
                2 +
            FARM_GROUP_WIDTH / 2;
        const rightFarmGroupX =
            leftFarmGroupX + FARM_GROUP_WIDTH + FARM_GROUP_HORIZONTAL_GAP;
        const topFarmGroupY =
            (SAFE_AREA_HEIGHT -
                FARM_GROUP_HEIGHT * 2 -
                FARM_GROUP_VERTICAL_GAP) /
                2 +
            FARM_GROUP_HEIGHT / 2 -
            100;
        const bottomFarmGroupY =
            topFarmGroupY + FARM_GROUP_HEIGHT + FARM_GROUP_VERTICAL_GAP;
        const farmGroupPositions = [
            {
                x: leftFarmGroupX,
                y: topFarmGroupY,
            },
            {
                x: rightFarmGroupX,
                y: topFarmGroupY,
            },
            {
                x: leftFarmGroupX,
                y: bottomFarmGroupY,
            },
            {
                x: rightFarmGroupX,
                y: bottomFarmGroupY,
            },
        ];

        farmGroupPositions.forEach((position, farmGroupIndex) => {
            const isLockedFarmGroup = farmGroupIndex !== UNLOCKED_FARM_GROUP_INDEX;
            const farmGroup = this.add
                .container(position.x, position.y)
                .setDepth(FARM_GROUP_DEPTH);

            farmGroupCorners.forEach((corner) => {
                this.createFarmPlantButton(
                    farmGroup,
                    farmGroupIndex,
                    corner,
                    isLockedFarmGroup
                );
            });
            this.createFarmSeedButton(farmGroup, farmGroupIndex, isLockedFarmGroup);

            if (isLockedFarmGroup) {
                this.createFarmLockOverlay(farmGroup);
            }
        });
    }

    createFarmSeedButton(
        farmGroup: GameObjects.Container,
        farmGroupIndex: number,
        isLockedFarmGroup: boolean
    ) {
        const buttonRadius = FARM_SEED_BUTTON_SIZE / 2;
        const seedSlotId = `farm-${farmGroupIndex + 1}-seed`;
        const buttonContainer = this.add.container(0, 0);
        const buttonCircle = this.add
            .circle(0, 0, buttonRadius, 0xffdf3d, 0.98)
            .setStrokeStyle(8, 0x9a6a00, 1);
        const buttonLabel = this.add
            .text(0, -4, "+", {
                color: "#6d470c",
                fontFamily: "TmoneyRoundWind, Arial, sans-serif",
                fontSize: "88px",
                fontStyle: "bold",
            })
            .setOrigin(0.5);
        const requestSeedSlot = () => {
            EventBus.emit("farm-seed-slot-requested", seedSlotId);
        };

        if (!isLockedFarmGroup) {
            buttonCircle
                .setInteractive({ useHandCursor: true })
                .on("pointerup", requestSeedSlot);
            buttonLabel
                .setInteractive({ useHandCursor: true })
                .on("pointerup", requestSeedSlot);
        } else {
            buttonContainer.setAlpha(0.45);
        }

        buttonContainer.add([buttonCircle, buttonLabel]);
        farmGroup.add(buttonContainer);
    }

    createFarmPlantButton(
        farmGroup: GameObjects.Container,
        farmGroupIndex: number,
        corner: FarmGroupCorner,
        isLockedFarmGroup: boolean
    ) {
        const horizontalDirection = corner.endsWith("right") ? 1 : -1;
        const verticalDirection = corner.startsWith("bottom") ? 1 : -1;
        const buttonX =
            horizontalDirection *
            (FARM_GROUP_WIDTH / 2 - FARM_PLANT_BUTTON_INSET);
        const buttonY =
            verticalDirection *
            (FARM_GROUP_HEIGHT / 2 - FARM_PLANT_BUTTON_INSET);
        const buttonRadius = FARM_PLANT_BUTTON_SIZE / 2;
        const slotId = `farm-${farmGroupIndex + 1}-${corner}`;
        const buttonContainer = this.add.container(buttonX, buttonY);
        const buttonCircle = this.add
            .circle(0, 0, buttonRadius, 0xfff2bb, 0.96)
            .setStrokeStyle(6, 0x7f560f, 1);
        const buttonLabel = this.add
            .text(0, -3, "+", {
                color: "#6d470c",
                fontFamily: "TmoneyRoundWind, Arial, sans-serif",
                fontSize: "72px",
                fontStyle: "bold",
            })
            .setOrigin(0.5);
        const requestPlantSlot = () => {
            EventBus.emit("farm-plant-slot-requested", slotId);
        };

        if (!isLockedFarmGroup) {
            buttonCircle
                .setInteractive({ useHandCursor: true })
                .on("pointerup", requestPlantSlot);
            buttonLabel
                .setInteractive({ useHandCursor: true })
                .on("pointerup", requestPlantSlot);
        } else {
            buttonContainer.setAlpha(0.45);
        }

        buttonContainer.add([buttonCircle, buttonLabel]);

        this.farmPlantSlots.set(slotId, {
            id: slotId,
            x: farmGroup.x + buttonX,
            y: farmGroup.y + buttonY,
            isLocked: isLockedFarmGroup,
            button: buttonContainer,
            buttonCircle,
            buttonLabel,
            plantedBeanImage: null,
            plantedBeanIdleTween: null,
        });

        farmGroup.add(buttonContainer);
    }

    createFarmLockOverlay(farmGroup: GameObjects.Container) {
        const lockFilter = this.add
            .rectangle(
                0,
                0,
                FARM_LOCK_OVERLAY_WIDTH,
                FARM_LOCK_OVERLAY_HEIGHT,
                0x101010,
                0.46
            )
            .setStrokeStyle(8, 0xffffff, 0.26)
            .setDepth(FARM_LOCK_OVERLAY_DEPTH);
        const lockIcon = this.add
            .text(0, -12, "🔒", {
                fontFamily: "Arial, sans-serif",
                fontSize: "104px",
            })
            .setOrigin(0.5)
            .setDepth(FARM_LOCK_OVERLAY_DEPTH + 1);
        const lockLabel = this.add
            .text(0, 92, "잠김", {
                color: "#ffffff",
                fontFamily: "TmoneyRoundWind, Arial, sans-serif",
                fontSize: "34px",
                fontStyle: "bold",
            })
            .setOrigin(0.5)
            .setDepth(FARM_LOCK_OVERLAY_DEPTH + 1);

        farmGroup.add([lockFilter, lockIcon, lockLabel]);
    }

    handlePlantPanelOpenChanged(isOpen: boolean) {
        this.isPlantPanelOpen = isOpen;

        this.farmPlantSlots.forEach((slot) => {
            this.updateFarmPlantSlotInteractivity(slot);
        });
    }

    updateFarmPlantSlotInteractivity(slot: FarmPlantSlot) {
        if (slot.isLocked || slot.plantedBeanImage || this.isPlantPanelOpen) {
            slot.buttonCircle.disableInteractive();
            slot.buttonLabel.disableInteractive();
            return;
        }

        slot.buttonCircle.setInteractive({ useHandCursor: true });
        slot.buttonLabel.setInteractive({ useHandCursor: true });
    }

    handleFarmPlantBean(payload: FarmPlantBeanPayload) {
        this.renderPlantedFarmBean(payload);
    }

    restorePlantedFarmBeans(plantedBeans: PlantedFarmBean[]) {
        plantedBeans.forEach((plantedBean) => {
            this.renderPlantedFarmBean(plantedBean);
        });
    }

    renderPlantedFarmBean(payload: FarmPlantBeanPayload) {
        const slot = this.farmPlantSlots.get(payload.slotId);

        if (!slot || !this.textures.exists(payload.bean.textureKey)) {
            return;
        }

        const textureFrame = this.textures.getFrame(payload.bean.textureKey);

        slot.button.setVisible(false);
        this.updateFarmPlantSlotInteractivity(slot);
        this.stopPlantedBeanIdleAnimation(slot);
        slot.plantedBeanImage?.destroy();
        slot.plantedBeanImage = this.add
            .image(
                slot.x,
                slot.y + FARM_PLANTED_BEAN_VERTICAL_OFFSET,
                payload.bean.textureKey
            )
            .setOrigin(0.5, 1)
            .setCrop(0, 0, textureFrame.width, textureFrame.height / 2)
            .setDisplaySize(FARM_PLANTED_BEAN_SIZE, FARM_PLANTED_BEAN_SIZE)
            .setDepth(FARM_GROUP_DEPTH + 2);
        this.startPlantedBeanIdleAnimation(slot);
    }

    startPlantedBeanIdleAnimation(slot: FarmPlantSlot) {
        const plantedBeanImage = slot.plantedBeanImage;

        if (!plantedBeanImage) {
            return;
        }

        this.stopPlantedBeanIdleAnimation(slot);

        const baseScaleX = plantedBeanImage.scaleX;
        const baseScaleY = plantedBeanImage.scaleY;

        slot.plantedBeanIdleTween = this.tweens.add({
            targets: plantedBeanImage,
            scaleX: baseScaleX * FARM_PLANTED_BEAN_IDLE_SCALE_X_MULTIPLIER,
            scaleY: baseScaleY * FARM_PLANTED_BEAN_IDLE_SCALE_Y_MULTIPLIER,
            duration: FARM_PLANTED_BEAN_IDLE_DURATION,
            ease: "Sine.easeInOut",
            yoyo: true,
            repeat: -1,
            onStop: () => {
                plantedBeanImage.setScale(baseScaleX, baseScaleY);
            },
        });
    }

    stopPlantedBeanIdleAnimation(slot: FarmPlantSlot) {
        if (!slot.plantedBeanIdleTween) {
            return;
        }

        slot.plantedBeanIdleTween.stop();
        slot.plantedBeanIdleTween.remove();
        slot.plantedBeanIdleTween = null;
    }

    stopAllPlantedBeanIdleAnimations() {
        this.farmPlantSlots.forEach((slot) => {
            this.stopPlantedBeanIdleAnimation(slot);
        });
    }

    fitFieldBackgroundToFixedWidth() {
        if (!this.fieldBackground) {
            return;
        }

        const textureFrame = this.textures.getFrame(
            FIELD_BACKGROUND_TEXTURE_KEY
        );
        const imageAspect = textureFrame.width / textureFrame.height;

        this.fieldBackground.setDisplaySize(
            FIELD_BACKGROUND_DISPLAY_WIDTH,
            FIELD_BACKGROUND_DISPLAY_WIDTH / imageAspect
        );
    }

    createLogo() {
        const logoFrame = this.textures.getFrame("logo");
        const logoHeightRatio = logoFrame.height / logoFrame.width;

        this.horizontalLogo = this.add
            .image(SAFE_AREA_CENTER_X, SAFE_AREA_CENTER_Y, "logo")
            .setOrigin(0.5)
            .setDepth(100)
            .setDisplaySize(SAFE_AREA_WIDTH, SAFE_AREA_WIDTH * logoHeightRatio);
    }

    moveLogo(vueCallback: LogoPositionCallback) {
        this.logoMoveCallback = vueCallback;

        if (this.logoTween) {
            if (this.logoTween.isPlaying()) {
                this.logoTween.pause();
            } else {
                this.logoTween.play();
            }
        } else {
            this.startLogoRoam();
        }
    }

    startLogoRoam() {
        const { minX, maxX, minY, maxY } = this.getLogoSafeBounds();
        const targetX = PhaserMath.Between(Math.ceil(minX), Math.floor(maxX));
        const targetY = PhaserMath.Between(Math.ceil(minY), Math.floor(maxY));

        this.logoTween = this.tweens.add({
            targets: this.horizontalLogo,
            x: targetX,
            y: targetY,
            duration: PhaserMath.Between(1200, 2200),
            ease: "Sine.easeInOut",
            onUpdate: () => {
                this.emitLogoPosition();
            },
            onComplete: () => {
                this.logoTween = null;

                if (this.logoMoveCallback) {
                    this.startLogoRoam();
                }
            },
        });
    }

    getLogoSafeBounds() {
        const logoHalfWidth = this.horizontalLogo.displayWidth / 2;
        const logoHalfHeight = this.horizontalLogo.displayHeight / 2;
        const minX = logoHalfWidth;
        const maxX = SAFE_AREA_WIDTH - logoHalfWidth;
        const minY = logoHalfHeight;
        const maxY = SAFE_AREA_HEIGHT - logoHalfHeight;

        return {
            minX: Math.min(minX, maxX),
            maxX: Math.max(minX, maxX),
            minY: Math.min(minY, maxY),
            maxY: Math.max(minY, maxY),
        };
    }

    emitLogoPosition() {
        if (!this.logoMoveCallback) {
            return;
        }

        this.logoMoveCallback({
            x: Math.floor(this.horizontalLogo.x),
            y: Math.floor(this.horizontalLogo.y),
        });
    }
}
