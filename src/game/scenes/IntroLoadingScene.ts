import { Scene } from "phaser";

import { EventBus } from "../EventBus";

const INTRO_LOADING_STEP_DURATION = 1000;
const INTRO_LOADING_PROGRESS_STEPS = [1 / 3, 2 / 3, 1];

export class IntroLoadingScene extends Scene {
    private loadingProgress = { value: 0 };

    constructor() {
        super("IntroLoadingScene");
    }

    create() {
        this.cameras.main.setBackgroundColor("#100f0f");
        EventBus.emit("game-loading-progress", 0);
        this.playIntroLoadingProgress();
    }

    private async playIntroLoadingProgress() {
        for (const progress of INTRO_LOADING_PROGRESS_STEPS) {
            await this.tweenLoadingProgress(progress);
        }

        EventBus.emit("game-loading-progress", 1);
        this.scene.start("FarmScene");
    }

    private tweenLoadingProgress(targetProgress: number) {
        return new Promise<void>((resolve) => {
            this.tweens.add({
                targets: this.loadingProgress,
                value: targetProgress,
                duration: INTRO_LOADING_STEP_DURATION,
                ease: "Sine.easeInOut",
                onUpdate: () => {
                    EventBus.emit(
                        "game-loading-progress",
                        this.loadingProgress.value
                    );
                },
                onComplete: () => {
                    EventBus.emit("game-loading-progress", targetProgress);
                    resolve();
                },
            });
        });
    }
}
