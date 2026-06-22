import type { Scene } from "phaser";

import { BACKGROUND_MUSIC_KEY } from "./preloadAssets";

const BACKGROUND_MUSIC_VOLUME = 0.45;

export const startBackgroundMusic = (scene: Scene) => {
    if (!scene.cache.audio.exists(BACKGROUND_MUSIC_KEY)) {
        return false;
    }

    const existingMusic = scene.sound.get(BACKGROUND_MUSIC_KEY);

    if (existingMusic) {
        if (!existingMusic.isPlaying) {
            existingMusic.play({
                loop: true,
                volume: BACKGROUND_MUSIC_VOLUME,
            });
        }

        return true;
    }

    const music = scene.sound.add(BACKGROUND_MUSIC_KEY, {
        loop: true,
        volume: BACKGROUND_MUSIC_VOLUME,
    });

    music.play();

    return true;
};