import type { Scene } from "phaser";

import { EventBus } from "./EventBus";

export const SAFE_AREA_WIDTH = 1080;
export const SAFE_AREA_HEIGHT = 1920;
export const SAFE_AREA_CENTER_X = SAFE_AREA_WIDTH / 2;
export const SAFE_AREA_CENTER_Y = SAFE_AREA_HEIGHT / 2;
export const MIN_GAME_ASPECT = 9 / 21;
export const MAX_GAME_ASPECT = 3 / 4;
export const FULL_AREA_WIDTH = SAFE_AREA_HEIGHT * MAX_GAME_ASPECT;
export const FULL_AREA_HEIGHT = SAFE_AREA_WIDTH / MIN_GAME_ASPECT;

let isDebugFullAreaEnabled = false;

type SizeLike = {
    width: number;
    height: number;
};

export const getSafeAreaOrigin = ({ width, height }: SizeLike) => ({
    x: (width - SAFE_AREA_WIDTH) / 2,
    y: (height - SAFE_AREA_HEIGHT) / 2,
});

const applyDefaultSafeAreaCamera = (scene: Scene) => {
    const origin = getSafeAreaOrigin(scene.scale);

    scene.cameras.main.setZoom(1);
    scene.cameras.main.setScroll(-origin.x, -origin.y);
};

const applyFullAreaCamera = (scene: Scene) => {
    const zoom = Math.min(
        scene.scale.width / FULL_AREA_WIDTH,
        scene.scale.height / FULL_AREA_HEIGHT
    );

    scene.cameras.main.setZoom(zoom);
    scene.cameras.main.centerOn(SAFE_AREA_CENTER_X, SAFE_AREA_CENTER_Y);
};

export const applySafeAreaCamera = (scene: Scene) => {
    if (isDebugFullAreaEnabled) {
        applyFullAreaCamera(scene);
        return;
    }

    applyDefaultSafeAreaCamera(scene);
};

export const useSafeAreaCamera = (scene: Scene) => {
    const handleResize = () => {
        applySafeAreaCamera(scene);
    };

    const handleDebugFullAreaChanged = (isEnabled: boolean) => {
        isDebugFullAreaEnabled = isEnabled;
        applySafeAreaCamera(scene);
    };

    applySafeAreaCamera(scene);
    scene.scale.on("resize", handleResize);
    EventBus.on("debug-full-area-changed", handleDebugFullAreaChanged);
    scene.events.once("shutdown", () => {
        scene.scale.off("resize", handleResize);
        EventBus.off("debug-full-area-changed", handleDebugFullAreaChanged);
    });
};
