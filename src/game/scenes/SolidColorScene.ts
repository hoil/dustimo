import { Scene } from "phaser";

import { useSafeAreaCamera } from "../SafeArea";
import { setupBottomMenuSceneNavigation } from "./menuSceneNavigation";

export class SolidColorScene extends Scene {
    private readonly backgroundColor: string;

    constructor(sceneKey: string, backgroundColor: string) {
        super(sceneKey);
        this.backgroundColor = backgroundColor;
    }

    create() {
        useSafeAreaCamera(this);
        this.cameras.main.setBackgroundColor(this.backgroundColor);
        setupBottomMenuSceneNavigation(this);
    }
}

export class CompanionScene extends SolidColorScene {
    constructor() {
        super("CompanionScene", "#7d63d8");
    }
}

export class BattleScene extends SolidColorScene {
    constructor() {
        super("BattleScene", "#c64b4b");
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
