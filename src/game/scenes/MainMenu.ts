import { Math as PhaserMath, type GameObjects, Scene } from "phaser";

import { EventBus } from "../EventBus";
import {
    SAFE_AREA_CENTER_X,
    SAFE_AREA_CENTER_Y,
    SAFE_AREA_HEIGHT,
    SAFE_AREA_WIDTH,
    useSafeAreaCamera,
    useSafeAreaDebugOverlay,
} from "../SafeArea";
import { setupBottomMenuSceneNavigation } from "./menuSceneNavigation";

type LogoPositionCallback = ({ x, y }: { x: number; y: number }) => void;

export class MainMenu extends Scene {
    fieldBackground!: GameObjects.Image;
    horizontalLogo!: GameObjects.Image;
    logoTween: Phaser.Tweens.Tween | null = null;
    logoMoveCallback: LogoPositionCallback | null = null;

    constructor() {
        super("MainMenu");
    }

    preload() {
        this.load.image("field-background", "/assets/field/bg.png");
    }

    create() {
        useSafeAreaCamera(this);
        this.createFieldBackground();
        setupBottomMenuSceneNavigation(this);
        useSafeAreaDebugOverlay(this);

        // this.createLogo();
        this.events.once("shutdown", () => {
            this.scale.off("resize", this.resizeFieldBackground, this);
        });
        this.scale.on("resize", this.resizeFieldBackground, this);

        EventBus.emit("current-scene-ready", this);
    }

    createFieldBackground() {
        this.fieldBackground = this.add
            .image(SAFE_AREA_CENTER_X, SAFE_AREA_CENTER_Y, "field-background")
            .setOrigin(0.5)
            .setDepth(-100);

        this.resizeFieldBackground();
    }

    resizeFieldBackground() {
        if (!this.fieldBackground) {
            return;
        }

        const textureFrame = this.textures.getFrame("field-background");
        const imageAspect = textureFrame.width / textureFrame.height;
        const targetWidth = this.scale.width;
        const targetHeight = this.scale.height;
        const targetAspect = targetWidth / targetHeight;

        if (imageAspect > targetAspect) {
            this.fieldBackground.setDisplaySize(
                targetHeight * imageAspect,
                targetHeight
            );
            return;
        }

        this.fieldBackground.setDisplaySize(
            targetWidth,
            targetWidth / imageAspect
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
