import type { Scene } from "phaser";

export const SAFE_AREA_WIDTH = 1080;
export const SAFE_AREA_HEIGHT = 1920;
export const SAFE_AREA_CENTER_X = SAFE_AREA_WIDTH / 2;
export const SAFE_AREA_CENTER_Y = SAFE_AREA_HEIGHT / 2;
export const MIN_GAME_ASPECT = 9 / 21;
export const MAX_GAME_ASPECT = 3 / 4;

type SizeLike = {
    width: number;
    height: number;
};

export const getSafeAreaOrigin = ({ width, height }: SizeLike) => ({
    x: (width - SAFE_AREA_WIDTH) / 2,
    y: (height - SAFE_AREA_HEIGHT) / 2,
});

export const applySafeAreaCamera = (scene: Scene) => {
    const origin = getSafeAreaOrigin(scene.scale);

    scene.cameras.main.setScroll(-origin.x, -origin.y);
};

export const useSafeAreaCamera = (scene: Scene) => {
    const handleResize = () => {
        applySafeAreaCamera(scene);
    };

    applySafeAreaCamera(scene);
    scene.scale.on("resize", handleResize);
    scene.events.once("shutdown", () => {
        scene.scale.off("resize", handleResize);
    });
};
