import { Boot } from "./scenes/Boot";
import { FarmScene } from "./scenes/FarmScene";
import { IntroLoadingScene } from "./scenes/IntroLoadingScene";
import {
    BattleScene,
    PlazaScene,
    RosterScene,
    ShopScene,
} from "./scenes/SolidColorScene";
import { AUTO, Game, Scale } from "phaser";

// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 1080,
    height: 1920,
    parent: "game-container",
    backgroundColor: "#3232ff",
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH,
    },
    scene: [
        Boot,
        IntroLoadingScene,
        FarmScene,
        RosterScene,
        BattleScene,
        PlazaScene,
        ShopScene,
    ],
};

const StartGame = (parent: string, width = 1080, height = 1920) => {
    return new Game({ ...config, parent, width, height });
};

export default StartGame;
