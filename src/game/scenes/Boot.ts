import { Scene } from 'phaser';

import { EventBus } from "../EventBus";

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    preload ()
    {
        this.load.audio("pop", "/assets/sounds/pop.mp3");
    }

    create ()
    {
        EventBus.emit("current-scene-ready", this);
    }
}
