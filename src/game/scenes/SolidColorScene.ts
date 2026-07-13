import { Scene } from "phaser";

import { EventBus } from "../EventBus";
import { useSafeAreaCamera, useSafeAreaDebugOverlay } from "../SafeArea";

export class SolidColorScene extends Scene {
    private readonly backgroundColor: string;

    constructor(sceneKey: string, backgroundColor: string) {
        super(sceneKey);
        this.backgroundColor = backgroundColor;
    }

    create() {
        useSafeAreaCamera(this);
        this.cameras.main.setBackgroundColor(this.backgroundColor);
        useSafeAreaDebugOverlay(this);
        EventBus.emit("current-scene-ready", this);
    }
}

export class PlazaScene extends SolidColorScene {
    constructor() {
        super("PlazaScene", "#4b8fd8");
    }
}

export class ShopScene extends SolidColorScene {
    constructor() {
        super("ShopScene", "#d89a3d");
    }
}
