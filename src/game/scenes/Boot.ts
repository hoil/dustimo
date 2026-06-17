import { Scene } from 'phaser';

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    preload ()
    {
        // IntroLoadingScene uses DOM loading UI, so no Phaser assets are required here yet.
    }

    create ()
    {
        this.scene.start('IntroLoadingScene');
    }
}
