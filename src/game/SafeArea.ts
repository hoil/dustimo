import type { GameObjects, Scene } from "phaser";

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
let isDebugSafeAreaEnabled = false;

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

const createSafeAreaOverlay = (scene: Scene) => {
    const centerX = SAFE_AREA_CENTER_X;
    const centerY = SAFE_AREA_CENTER_Y;
    const safeWidth = SAFE_AREA_WIDTH;
    const safeHeight = SAFE_AREA_HEIGHT;
    const maxWidth = safeHeight * MAX_GAME_ASPECT;
    const maxHeight = safeWidth / MIN_GAME_ASPECT;
    const wideOnlyWidth = (maxWidth - safeWidth) / 2;
    const tallOnlyHeight = (maxHeight - safeHeight) / 2;
    const overlay = scene.add
        .container(0, 0)
        .setDepth(Number.MAX_SAFE_INTEGER)
        .setAlpha(0.35);

    overlay.add(
        scene.add.rectangle(centerX, centerY, maxWidth, maxHeight, 0xff0000)
    );

    overlay.add(
        scene.add.rectangle(
            centerX - safeWidth / 2 - wideOnlyWidth / 2,
            centerY,
            wideOnlyWidth,
            safeHeight,
            0x0066ff
        )
    );

    overlay.add(
        scene.add.rectangle(
            centerX + safeWidth / 2 + wideOnlyWidth / 2,
            centerY,
            wideOnlyWidth,
            safeHeight,
            0x0066ff
        )
    );

    overlay.add(
        scene.add.rectangle(
            centerX,
            centerY - safeHeight / 2 - tallOnlyHeight / 2,
            safeWidth,
            tallOnlyHeight,
            0xffdd00
        )
    );

    overlay.add(
        scene.add.rectangle(
            centerX,
            centerY + safeHeight / 2 + tallOnlyHeight / 2,
            safeWidth,
            tallOnlyHeight,
            0xffdd00
        )
    );

    overlay.add(
        scene.add.rectangle(centerX, centerY, safeWidth, safeHeight, 0x00aa44)
    );

    return overlay;
};

export const useSafeAreaDebugOverlay = (scene: Scene) => {
    let safeAreaOverlay: GameObjects.Container | null = null;

    const setSafeAreaOverlayVisible = (isVisible: boolean) => {
        isDebugSafeAreaEnabled = isVisible;

        if (isVisible && !safeAreaOverlay) {
            safeAreaOverlay = createSafeAreaOverlay(scene);
        }

        safeAreaOverlay?.setVisible(isVisible);
        safeAreaOverlay?.setDepth(Number.MAX_SAFE_INTEGER);
    };

    EventBus.on("debug-safe-area-changed", setSafeAreaOverlayVisible);
    setSafeAreaOverlayVisible(isDebugSafeAreaEnabled);

    scene.events.once("shutdown", () => {
        EventBus.off("debug-safe-area-changed", setSafeAreaOverlayVisible);
        safeAreaOverlay = null;
    });
};
