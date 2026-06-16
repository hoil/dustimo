import { type GameObjects, Scene } from "phaser";

import { EventBus } from "../EventBus";

const SAFE_AREA_WIDTH = 1080;
const SAFE_AREA_HEIGHT = 1920;
const MIN_GAME_ASPECT = 9 / 21;
const MAX_GAME_ASPECT = 3 / 4;

export class MainMenu extends Scene {
    background!: GameObjects.Rectangle;
    logo!: GameObjects.Image;
    title!: GameObjects.Text;
    logoTween: Phaser.Tweens.Tween | null = null;

    constructor() {
        super("MainMenu");
    }

    create() {
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        this.createResolutionGuide(centerX, centerY);

        this.logo = this.add.image(centerX, centerY - 90, "logo").setDepth(100);

        this.title = this.add
            .text(centerX, centerY + 90, "Main Menu", {
                fontFamily: "Arial Black",
                fontSize: 38,
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 8,
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100);

        EventBus.emit("current-scene-ready", this);
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

        this.scene.start("Game");
    }

    moveLogo(vueCallback: ({ x, y }: { x: number; y: number }) => void) {
        if (this.logoTween) {
            if (this.logoTween.isPlaying()) {
                this.logoTween.pause();
            } else {
                this.logoTween.play();
            }
        } else {
            const centerX = this.scale.width / 2;
            const centerY = this.scale.height / 2;
            const logoHalfWidth = this.logo.displayWidth / 2;
            const logoHalfHeight = this.logo.displayHeight / 2;
            const safeAreaMaxX = centerX + SAFE_AREA_WIDTH / 2 - logoHalfWidth;
            const safeAreaMinY =
                centerY - SAFE_AREA_HEIGHT / 2 + logoHalfHeight;

            this.logoTween = this.tweens.add({
                targets: this.logo,
                x: {
                    value: safeAreaMaxX,
                    duration: 3000,
                    ease: "Back.easeInOut",
                },
                y: {
                    value: safeAreaMinY,
                    duration: 1500,
                    ease: "Sine.easeOut",
                },
                yoyo: true,
                repeat: -1,
                onUpdate: () => {
                    if (vueCallback) {
                        vueCallback({
                            x: Math.floor(this.logo.x),
                            y: Math.floor(this.logo.y),
                        });
                    }
                },
            });
        }
    }
}
