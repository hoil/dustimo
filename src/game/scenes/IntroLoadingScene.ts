import { Scene } from "phaser";

import { EventBus } from "../EventBus";

export class IntroLoadingScene extends Scene {
    private isPhaserLoadingComplete = false;
    private isSceneCreated = false;
    private isStartRequested = false;

    constructor() {
        super("IntroLoadingScene");
    }

    init() {
        this.isPhaserLoadingComplete = false;
        this.isSceneCreated = false;
        this.isStartRequested = false;
        EventBus.once("intro-loading-start-game", this.handleStartGameRequest, this);
    }

    preload() {
        EventBus.emit("phaser-loading-progress", 0);

        this.load.image("field-background", "/assets/farm/bg.png");
        this.load.on("progress", this.handlePhaserLoadingProgress, this);
        this.load.once("complete", this.handlePhaserLoadingComplete, this);
    }

    create() {
        this.cameras.main.setBackgroundColor("#100f0f");
        this.isSceneCreated = true;
        this.events.once("shutdown", this.cleanupEventListeners, this);
        this.tryStartGame();
    }

    private handlePhaserLoadingProgress(progress: number) {
        EventBus.emit("phaser-loading-progress", progress);
    }

    private handlePhaserLoadingComplete() {
        this.isPhaserLoadingComplete = true;
        this.load.off("progress", this.handlePhaserLoadingProgress, this);
        EventBus.emit("phaser-loading-progress", 1);
        EventBus.emit("phaser-loading-complete");
        this.tryStartGame();
    }

    private handleStartGameRequest() {
        this.isStartRequested = true;
        this.tryStartGame();
    }

    private tryStartGame() {
        if (!this.isSceneCreated || !this.isPhaserLoadingComplete || !this.isStartRequested) {
            return;
        }

        this.scene.start("FarmScene");
    }

    private cleanupEventListeners() {
        this.load.off("progress", this.handlePhaserLoadingProgress, this);
        EventBus.off("intro-loading-start-game", this.handleStartGameRequest, this);
    }
}
