import { type GameObjects, Scene } from "phaser";

import { EventBus } from "../EventBus";
import {
    SAFE_AREA_CENTER_X,
    getSafeAreaOrigin,
    useSafeAreaCamera,
    useSafeAreaDebugOverlay
} from "../SafeArea";
import { ROSTER_BACKGROUND_TEXTURE_KEY } from "../preloadAssets";
import type { BeanDefinition } from "../../lib/beans";
import { ROSTER_PREVIEW_HEIGHT } from "../../lib/rosterLayout";

const SELECTED_BEAN_PREVIEW_SIZE = 180;
const SELECTED_BEAN_PREVIEW_FOOT_Y = ROSTER_PREVIEW_HEIGHT / 2 + SELECTED_BEAN_PREVIEW_SIZE / 2;
const SELECTED_BEAN_IDLE_SCALE_X_MULTIPLIER = 0.95;
const SELECTED_BEAN_IDLE_SCALE_Y_MULTIPLIER = 1.05;
const SELECTED_BEAN_IDLE_DURATION = 900;

export class RosterScene extends Scene {
    private rosterBackground!: GameObjects.Image;
    private selectedBeanImage: GameObjects.Image | null = null;
    private selectedBeanIdleTween: Phaser.Tweens.Tween | null = null;

    constructor() {
        super("RosterScene");
    }

    create() {
        useSafeAreaCamera(this);
        this.cameras.main.setBackgroundColor("#7d63d8");
        this.createRosterBackground();
        this.createSelectedBeanImage();
        useSafeAreaDebugOverlay(this);

        this.events.once("shutdown", () => {
            this.scale.off("resize", this.resizeRosterBackground, this);
            EventBus.off("roster-selected-bean-changed", this.handleSelectedBeanChange, this);
            this.stopSelectedBeanIdleAnimation();
        });
        this.scale.on("resize", this.resizeRosterBackground, this);
        EventBus.on("roster-selected-bean-changed", this.handleSelectedBeanChange, this);

        EventBus.emit("current-scene-ready", this);
    }

    private createRosterBackground() {
        this.rosterBackground = this.add
            .image(0, 0, ROSTER_BACKGROUND_TEXTURE_KEY)
            .setOrigin(0.5)
            .setDepth(-100);

        this.resizeRosterBackground();
    }

    private createSelectedBeanImage() {
        this.selectedBeanImage = this.add
            .image(SAFE_AREA_CENTER_X, SELECTED_BEAN_PREVIEW_FOOT_Y, "__DEFAULT")
            .setOrigin(0.5, 1)
            .setDisplaySize(SELECTED_BEAN_PREVIEW_SIZE, SELECTED_BEAN_PREVIEW_SIZE)
            .setDepth(10)
            .setVisible(false);
    }

    private handleSelectedBeanChange(bean: BeanDefinition | null) {
        if (!this.selectedBeanImage) {
            return;
        }

        if (!bean || !this.textures.exists(bean.textureKey)) {
            this.stopSelectedBeanIdleAnimation();
            this.selectedBeanImage.setVisible(false);
            return;
        }

        this.selectedBeanImage
            .setTexture(bean.textureKey)
            .setPosition(SAFE_AREA_CENTER_X, SELECTED_BEAN_PREVIEW_FOOT_Y)
            .setDisplaySize(SELECTED_BEAN_PREVIEW_SIZE, SELECTED_BEAN_PREVIEW_SIZE)
            .setVisible(true);
        this.startSelectedBeanIdleAnimation();
    }

    private startSelectedBeanIdleAnimation() {
        if (!this.selectedBeanImage) {
            return;
        }

        this.stopSelectedBeanIdleAnimation();

        const baseScaleX = this.selectedBeanImage.scaleX;
        const baseScaleY = this.selectedBeanImage.scaleY;

        this.selectedBeanIdleTween = this.tweens.add({
            targets: this.selectedBeanImage,
            scaleX: baseScaleX * SELECTED_BEAN_IDLE_SCALE_X_MULTIPLIER,
            scaleY: baseScaleY * SELECTED_BEAN_IDLE_SCALE_Y_MULTIPLIER,
            duration: SELECTED_BEAN_IDLE_DURATION,
            ease: "Sine.easeInOut",
            yoyo: true,
            repeat: -1,
            onStop: () => {
                this.selectedBeanImage?.setScale(baseScaleX, baseScaleY);
            }
        });
    }

    private stopSelectedBeanIdleAnimation() {
        if (!this.selectedBeanIdleTween) {
            return;
        }

        this.selectedBeanIdleTween.stop();
        this.selectedBeanIdleTween.remove();
        this.selectedBeanIdleTween = null;
    }

    private resizeRosterBackground() {
        if (!this.rosterBackground) {
            return;
        }

        const defaultAreaOrigin = getSafeAreaOrigin(this.scale);
        const frameLeft = -defaultAreaOrigin.x;
        const frameTop = -defaultAreaOrigin.y;
        const frameRight = frameLeft + this.scale.width;
        const previewBottom = ROSTER_PREVIEW_HEIGHT;
        const backgroundCenterX = SAFE_AREA_CENTER_X;
        const backgroundCenterY = ROSTER_PREVIEW_HEIGHT / 2 + 150;
        const frameWidth = this.scale.width;
        const textureFrame = this.textures.getFrame(ROSTER_BACKGROUND_TEXTURE_KEY);
        const requiredHalfWidth = Math.max(
            backgroundCenterX - frameLeft,
            frameRight - backgroundCenterX
        );
        const requiredHalfHeight = Math.max(
            backgroundCenterY - frameTop,
            previewBottom - backgroundCenterY
        );
        const scale = Math.max(
            (requiredHalfWidth * 2) / textureFrame.width,
            (requiredHalfHeight * 2) / textureFrame.height
        );
        const displayWidth = textureFrame.width * scale;
        const displayHeight = textureFrame.height * scale;

        this.rosterBackground
            .setPosition(backgroundCenterX, backgroundCenterY)
            .setDisplaySize(displayWidth, displayHeight);
    }
}
