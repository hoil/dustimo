import { Boot } from "./scenes/Boot";
import { IntroLoadingScene } from "./scenes/IntroLoadingScene";
import { MainMenu } from "./scenes/MainMenu";
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
    scene: [Boot, IntroLoadingScene, MainMenu],
};

const StartGame = (parent: string, width = 1080, height = 1920) => {
    return new Game({ ...config, parent, width, height });
};

export default StartGame;
