import { type GameObjects, Scene } from "phaser";

import { EventBus } from "../EventBus";
import {
    SAFE_AREA_CENTER_X,
    getSafeAreaOrigin,
    useSafeAreaCamera,
    useSafeAreaDebugOverlay
} from "../SafeArea";
import { ROSTER_BACKGROUND_TEXTURE_KEY } from "../preloadAssets";
import { ROSTER_PREVIEW_HEIGHT } from "../../lib/rosterLayout";

export class RosterScene extends Scene {
    private rosterBackground!: GameObjects.Image;

    constructor() {
        super("RosterScene");
    }

    create() {
        useSafeAreaCamera(this);
        this.cameras.main.setBackgroundColor("#7d63d8");
        this.createRosterBackground();
        useSafeAreaDebugOverlay(this);

        this.events.once("shutdown", () => {
            this.scale.off("resize", this.resizeRosterBackground, this);
        });
        this.scale.on("resize", this.resizeRosterBackground, this);

        EventBus.emit("current-scene-ready", this);
    }

    private createRosterBackground() {
        this.rosterBackground = this.add
            .image(0, 0, ROSTER_BACKGROUND_TEXTURE_KEY)
            .setOrigin(0.5)
            .setDepth(-100);

        this.resizeRosterBackground();
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
