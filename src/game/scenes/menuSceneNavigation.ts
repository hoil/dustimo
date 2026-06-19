import type { Scene } from "phaser";

import { EventBus } from "../EventBus";

export const BOTTOM_MENU_SCENE_SELECTED_EVENT = "bottom-menu-scene-selected";

export const setupBottomMenuSceneNavigation = (scene: Scene) => {
    const handleSceneSelected = (sceneKey: string) => {
        if (sceneKey === scene.scene.key) {
            return;
        }

        scene.scene.start(sceneKey);
    };

    EventBus.on(BOTTOM_MENU_SCENE_SELECTED_EVENT, handleSceneSelected);
    scene.events.once("shutdown", () => {
        EventBus.off(BOTTOM_MENU_SCENE_SELECTED_EVENT, handleSceneSelected);
    });
};
