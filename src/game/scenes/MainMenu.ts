import { Math as PhaserMath, type GameObjects, Scene } from "phaser";

import { EventBus } from "../EventBus";

const SAFE_AREA_WIDTH = 1080;
const SAFE_AREA_HEIGHT = 1920;
const MIN_GAME_ASPECT = 9 / 21;
const MAX_GAME_ASPECT = 3 / 4;

type LogoPositionCallback = ({ x, y }: { x: number; y: number }) => void;

export class MainMenu extends Scene {
    background!: GameObjects.Rectangle;
    horizontalLogo!: GameObjects.Image;
    verticalLogo!: GameObjects.Image;
    logoTween: Phaser.Tweens.Tween | null = null;
    logoMoveCallback: LogoPositionCallback | null = null;

    constructor() {
        super("MainMenu");
    }

    create() {
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        this.createResolutionGuide(centerX, centerY);
        this.createSafeAreaLogoGuides(centerX, centerY);

        EventBus.emit("current-scene-ready", this);
    }

    createSafeAreaLogoGuides(centerX: number, centerY: number) {
        const logoFrame = this.textures.getFrame("logo");
        const logoHeightRatio = logoFrame.height / logoFrame.width;

        this.horizontalLogo = this.add
            .image(centerX, centerY, "logo")
            .setOrigin(0.5)
            .setDepth(100)
            .setDisplaySize(SAFE_AREA_WIDTH, SAFE_AREA_WIDTH * logoHeightRatio);

        this.verticalLogo = this.add
            .image(centerX, centerY, "logo")
            .setOrigin(0.5)
            .setAngle(90)
            .setDepth(101)
            .setDisplaySize(
                SAFE_AREA_HEIGHT,
                SAFE_AREA_HEIGHT * logoHeightRatio
            );
    }

    createResolutionGuide(centerX: number, centerY: number) {
        const safeWidth = SAFE_AREA_WIDTH;
        const safeHeight = SAFE_AREA_HEIGHT;
        const maxWidth = safeHeight * MAX_GAME_ASPECT;
        const maxHeight = safeWidth / MIN_GAME_ASPECT;
        const wideOnlyWidth = (maxWidth - safeWidth) / 2;
        const tallOnlyHeight = (maxHeight - safeHeight) / 2;

        this.background = this.add
            .rectangle(centerX, centerY, maxWidth, maxHeight, 0xff0000)
            .setDepth(0);

        this.add
            .rectangle(
                centerX - safeWidth / 2 - wideOnlyWidth / 2,
                centerY,
                wideOnlyWidth,
                safeHeight,
                0x0066ff
            )
            .setDepth(1);

        this.add
            .rectangle(
                centerX + safeWidth / 2 + wideOnlyWidth / 2,
                centerY,
                wideOnlyWidth,
                safeHeight,
                0x0066ff
            )
            .setDepth(1);

        this.add
            .rectangle(
                centerX,
                centerY - safeHeight / 2 - tallOnlyHeight / 2,
                safeWidth,
                tallOnlyHeight,
                0xffdd00
            )
            .setDepth(2);

        this.add
            .rectangle(
                centerX,
                centerY + safeHeight / 2 + tallOnlyHeight / 2,
                safeWidth,
                tallOnlyHeight,
                0xffdd00
            )
            .setDepth(2);

        this.add
            .rectangle(centerX, centerY, safeWidth, safeHeight, 0x00aa44)
            .setDepth(3);
    }

    changeScene() {
        if (this.logoTween) {
            this.logoTween.stop();
            this.logoTween = null;
        }

        this.logoMoveCallback = null;

        this.scene.start("Game");
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
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;
        const logoHalfWidth = this.horizontalLogo.displayWidth / 2;
        const logoHalfHeight = this.horizontalLogo.displayHeight / 2;
        const minX = centerX - SAFE_AREA_WIDTH / 2 + logoHalfWidth;
        const maxX = centerX + SAFE_AREA_WIDTH / 2 - logoHalfWidth;
        const minY = centerY - SAFE_AREA_HEIGHT / 2 + logoHalfHeight;
        const maxY = centerY + SAFE_AREA_HEIGHT / 2 - logoHalfHeight;

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
