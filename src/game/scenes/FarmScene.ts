import { Math as PhaserMath, type GameObjects, Scene } from "phaser";

import { EventBus } from "../EventBus";
import { FIELD_BACKGROUND_TEXTURE_KEY } from "../preloadAssets";
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
    button: GameObjects.Container;
    buttonCircle: GameObjects.Arc;
    buttonLabel: GameObjects.Text;
    plantedBeanImage: GameObjects.Image | null;
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
const FARM_PLANT_BUTTON_SIZE = 78;
const FARM_PLANT_BUTTON_INSET = 64;
const FARM_PLANTED_BEAN_SIZE = 126;
const FARM_SEED_BUTTON_SIZE = 96;
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
            const farmGroup = this.add
                .container(position.x, position.y)
                .setDepth(FARM_GROUP_DEPTH);

            farmGroupCorners.forEach((corner) => {
                this.createFarmPlantButton(farmGroup, farmGroupIndex, corner);
            });
            this.createFarmSeedButton(farmGroup, farmGroupIndex);
        });
    }

    createFarmSeedButton(
        farmGroup: GameObjects.Container,
        farmGroupIndex: number
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

        buttonCircle
            .setInteractive({ useHandCursor: true })
            .on("pointerup", requestSeedSlot);
        buttonLabel
            .setInteractive({ useHandCursor: true })
            .on("pointerup", requestSeedSlot);
        buttonContainer.add([buttonCircle, buttonLabel]);
        farmGroup.add(buttonContainer);
    }

    createFarmPlantButton(
        farmGroup: GameObjects.Container,
        farmGroupIndex: number,
        corner: FarmGroupCorner
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

        buttonCircle
            .setInteractive({ useHandCursor: true })
            .on("pointerup", requestPlantSlot);
        buttonLabel
            .setInteractive({ useHandCursor: true })
            .on("pointerup", requestPlantSlot);
        buttonContainer.add([buttonCircle, buttonLabel]);

        this.farmPlantSlots.set(slotId, {
            id: slotId,
            x: farmGroup.x + buttonX,
            y: farmGroup.y + buttonY,
            button: buttonContainer,
            buttonCircle,
            buttonLabel,
            plantedBeanImage: null,
        });

        farmGroup.add(buttonContainer);
    }

    handlePlantPanelOpenChanged(isOpen: boolean) {
        this.isPlantPanelOpen = isOpen;

        this.farmPlantSlots.forEach((slot) => {
            this.updateFarmPlantSlotInteractivity(slot);
        });
    }

    updateFarmPlantSlotInteractivity(slot: FarmPlantSlot) {
        if (slot.plantedBeanImage || this.isPlantPanelOpen) {
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
        slot.plantedBeanImage?.destroy();
        slot.plantedBeanImage = this.add
            .image(
                slot.x,
                slot.y + FARM_PLANTED_BEAN_SIZE / 4,
                payload.bean.textureKey
            )
            .setOrigin(0.5, 1)
            .setCrop(0, 0, textureFrame.width, textureFrame.height / 2)
            .setDisplaySize(FARM_PLANTED_BEAN_SIZE, FARM_PLANTED_BEAN_SIZE)
            .setDepth(FARM_GROUP_DEPTH + 2);
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
