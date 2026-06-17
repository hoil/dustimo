import { Math as PhaserMath, type GameObjects, Scene } from "phaser";

import { EventBus } from "../EventBus";
import {
    MAX_GAME_ASPECT,
    MIN_GAME_ASPECT,
    SAFE_AREA_CENTER_X,
    SAFE_AREA_CENTER_Y,
    SAFE_AREA_HEIGHT,
    SAFE_AREA_WIDTH,
    useSafeAreaCamera,
} from "../SafeArea";

type LogoPositionCallback = ({ x, y }: { x: number; y: number }) => void;

export class MainMenu extends Scene {
    horizontalLogo!: GameObjects.Image;
    safeAreaOverlay: GameObjects.Container | null = null;
    logoTween: Phaser.Tweens.Tween | null = null;
    logoMoveCallback: LogoPositionCallback | null = null;

    constructor() {
        super("MainMenu");
    }

    create() {
        useSafeAreaCamera(this);

        this.createLogo();

        EventBus.on(
            "debug-safe-area-changed",
            this.setSafeAreaOverlayVisible,
            this
        );
        this.events.once("shutdown", () => {
            EventBus.off(
                "debug-safe-area-changed",
                this.setSafeAreaOverlayVisible,
                this
            );
        });

        EventBus.emit("current-scene-ready", this);
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

    createSafeAreaOverlay() {
        const centerX = SAFE_AREA_CENTER_X;
        const centerY = SAFE_AREA_CENTER_Y;
        const safeWidth = SAFE_AREA_WIDTH;
        const safeHeight = SAFE_AREA_HEIGHT;
        const maxWidth = safeHeight * MAX_GAME_ASPECT;
        const maxHeight = safeWidth / MIN_GAME_ASPECT;
        const wideOnlyWidth = (maxWidth - safeWidth) / 2;
        const tallOnlyHeight = (maxHeight - safeHeight) / 2;

        this.safeAreaOverlay = this.add
            .container(0, 0)
            .setDepth(1000)
            .setAlpha(0.35);

        this.safeAreaOverlay.add(
            this.add.rectangle(centerX, centerY, maxWidth, maxHeight, 0xff0000)
        );

        this.safeAreaOverlay.add(
            this.add.rectangle(
                centerX - safeWidth / 2 - wideOnlyWidth / 2,
                centerY,
                wideOnlyWidth,
                safeHeight,
                0x0066ff
            )
        );

        this.safeAreaOverlay.add(
            this.add.rectangle(
                centerX + safeWidth / 2 + wideOnlyWidth / 2,
                centerY,
                wideOnlyWidth,
                safeHeight,
                0x0066ff
            )
        );

        this.safeAreaOverlay.add(
            this.add.rectangle(
                centerX,
                centerY - safeHeight / 2 - tallOnlyHeight / 2,
                safeWidth,
                tallOnlyHeight,
                0xffdd00
            )
        );

        this.safeAreaOverlay.add(
            this.add.rectangle(
                centerX,
                centerY + safeHeight / 2 + tallOnlyHeight / 2,
                safeWidth,
                tallOnlyHeight,
                0xffdd00
            )
        );

        this.safeAreaOverlay.add(
            this.add.rectangle(
                centerX,
                centerY,
                safeWidth,
                safeHeight,
                0x00aa44
            )
        );
    }

    setSafeAreaOverlayVisible(isVisible: boolean) {
        if (isVisible && !this.safeAreaOverlay) {
            this.createSafeAreaOverlay();
        }

        this.safeAreaOverlay?.setVisible(isVisible);
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
