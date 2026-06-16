<script lang="ts">

    import { onMount } from "svelte";
    import { Math as PhaserMath, type Scene } from "phaser";
    import type { MainMenu } from "../game/scenes/MainMenu";
    import PhaserGame, { type TPhaserRef } from "../PhaserGame.svelte";

    const MIN_GAME_ASPECT = 9 / 21;
    const MAX_GAME_ASPECT = 3 / 4;
    const SAFE_GAME_WIDTH = 1080;
    const SAFE_GAME_HEIGHT = 1920;
    const MAX_GAME_HEIGHT = SAFE_GAME_WIDTH / MIN_GAME_ASPECT;

    const toPixelValue = (value: number) => `${Math.round(value)}px`;
    const lerp = (from: number, to: number, progress: number) => from + ((to - from) * progress);

    // The sprite can only be moved in the MainMenu Scene
    let canMoveSprite = false;
    let isGameFrameReady = false;
    let gameFrameStyle = "";
    let gameSize = { width: SAFE_GAME_WIDTH, height: SAFE_GAME_HEIGHT };

    //  References to the PhaserGame component (game and scene are exposed)
    let phaserRef: TPhaserRef = { game: null, scene: null};
    const spritePosition = { x: 0, y: 0 };
    let spriteCount = 0;

    const calculateInitialGameFrame = () => {

        const viewport = window.visualViewport;
        const viewportWidth = Math.max(1, viewport?.width ?? window.innerWidth);
        const viewportHeight = Math.max(1, viewport?.height ?? window.innerHeight);
        const viewportAspect = viewportWidth / viewportHeight;
        const gameAspect = Math.min(MAX_GAME_ASPECT, Math.max(MIN_GAME_ASPECT, viewportAspect));
        const aspectProgress = (gameAspect - MIN_GAME_ASPECT) / (MAX_GAME_ASPECT - MIN_GAME_ASPECT);
        const gameHeight = lerp(MAX_GAME_HEIGHT, SAFE_GAME_HEIGHT, aspectProgress);
        const gameWidth = gameHeight * gameAspect;
        let frameWidth = viewportWidth;
        let frameHeight = viewportHeight;

        if (viewportAspect > MAX_GAME_ASPECT)
        {
            frameHeight = viewportHeight;
            frameWidth = frameHeight * MAX_GAME_ASPECT;
        }
        else if (viewportAspect < MIN_GAME_ASPECT)
        {
            frameWidth = viewportWidth;
            frameHeight = frameWidth / MIN_GAME_ASPECT;
        }

        const roundedFrameWidth = Math.round(frameWidth);
        const roundedFrameHeight = Math.round(frameHeight);

        return {
            frameStyle: [
                `width: ${roundedFrameWidth}px`,
                `height: ${roundedFrameHeight}px`,
                `--ui-safe-padding: ${toPixelValue(frameWidth * 0.041)}`,
                `--ui-panel-padding-y: ${toPixelValue(frameWidth * 0.026)}`,
                `--ui-panel-padding-x: ${toPixelValue(frameWidth * 0.031)}`,
                `--ui-panel-radius: ${toPixelValue(frameWidth * 0.031)}`,
                `--ui-control-gap: ${toPixelValue(frameWidth * 0.012)}`,
                `--ui-sprite-gap: ${toPixelValue(frameWidth * 0.021)}`,
                `--ui-pre-margin-top: ${toPixelValue(frameWidth * 0.01)}`,
                `--ui-font-size: ${toPixelValue(frameWidth * 0.033)}`,
                `--ui-button-width: ${toPixelValue(frameWidth * 0.28)}`,
                `--ui-button-padding: ${toPixelValue(frameWidth * 0.018)}`,
                `--ui-button-font-size: ${toPixelValue(frameWidth * 0.026)}`,
                `--ui-button-radius: ${toPixelValue(frameWidth * 0.008)}`,
                `--ui-border-width: ${toPixelValue(Math.max(1, frameWidth * 0.0026))}`
            ].join('; '),
            gameSize: {
                width: Math.round(gameWidth),
                height: Math.round(gameHeight)
            }
        };

    }

    onMount(() => {

        const initialGameFrame = calculateInitialGameFrame();

        gameFrameStyle = initialGameFrame.frameStyle;
        gameSize = initialGameFrame.gameSize;
        isGameFrameReady = true;

    });

    const changeScene = () => {

        const scene = phaserRef.scene as MainMenu;

        if (scene)
        {

            // Call the changeScene method defined in the `MainMenu`, `Game` and `GameOver` Scenes
            scene.changeScene();

        }

    }
    
    const moveSprite = () => {

        const scene = phaserRef.scene as MainMenu;

        if (scene)
        {

            // Get the update logo position
            (scene as MainMenu).moveLogo(({ x, y }) => {

                spritePosition.x = x;
                spritePosition.y = y;

            });

        }

    }

    const addSprite = () => {

        const scene = phaserRef.scene as Scene;

        if (!scene)
        {
            console.warn('Cannot add sprite: Phaser scene is not ready yet.');
            return;
        }

        // Add more stars
        const x = PhaserMath.Between(64, scene.scale.width - 64);
        const y = PhaserMath.Between(64, scene.scale.height - 64);

        //  `add.sprite` is a Phaser GameObjectFactory method and it returns a Sprite Game Object instance
        const star = scene.add.sprite(x, y, 'star')
            .setDepth(200)
            .setScale(1.5);

        spriteCount += 1;

        //  ... which you can then act upon. Here we create a Phaser Tween to fade the star sprite in and out.
        //  You could, of course, do this from within the Phaser Scene code, but this is just an example
        //  showing that Phaser objects and systems can be acted upon from outside of Phaser itself.
        scene.add.tween({
            targets: star,
            duration: 500 + Math.random() * 1000,
            alpha: 0,
            yoyo: true,
            repeat: -1
        });
    }

    // Event emitted from the PhaserGame component
    const currentScene = (scene: Scene) => {

        canMoveSprite = (scene.scene.key !== "MainMenu");

    }
    
</script>

<div id="app">
    <div class="game-frame" style={gameFrameStyle}>
        {#if isGameFrameReady}
            <PhaserGame
                bind:phaserRef={phaserRef}
                currentActiveScene={currentScene}
                gameWidth={gameSize.width}
                gameHeight={gameSize.height}
            />

            <div class="dom-ui-layer">
                <div class="dom-ui-safe-area">
                    <div class="hud-panel">
                        <div class="spritePosition">
                            Sprite Position:
                            <pre>{JSON.stringify(spritePosition, null, 2)}</pre>
                        </div>
                        <div class="spritePosition">
                            Added Sprites: {spriteCount}
                        </div>
                    </div>

                    <div class="control-panel">
                        <button class="button" on:click={changeScene}>Change Scene</button>
                        <button class="button" disabled={canMoveSprite} on:click={moveSprite}>Toggle Movement</button>
                        <button class="button" on:click={addSprite}>Add New Sprite</button>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    #app {
        --safe-area-top: env(safe-area-inset-top, 0px);
        --safe-area-right: env(safe-area-inset-right, 0px);
        --safe-area-bottom: env(safe-area-inset-bottom, 0px);
        --safe-area-left: env(safe-area-inset-left, 0px);

        width: 100vw;
        height: 100dvh;
        overflow: hidden;
        display: flex;
        justify-content: center;
        align-items: center;
        background: #000000;
    }

    .game-frame {
        position: relative;
        flex: 0 0 auto;
        width: 100vw;
        height: 100dvh;
        overflow: hidden;
        background: #000000;
    }

    .dom-ui-layer {
        position: absolute;
        inset: 0;
        z-index: 10;
        pointer-events: none;
    }

    .dom-ui-safe-area {
        position: absolute;
        inset: var(--safe-area-top) var(--safe-area-right) var(--safe-area-bottom) var(--safe-area-left);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: var(--ui-safe-padding);
        padding: var(--ui-safe-padding);
        pointer-events: none;
    }

    .hud-panel,
    .control-panel {
        pointer-events: auto;
    }

    .hud-panel {
        width: fit-content;
        max-width: 100%;
        padding: var(--ui-panel-padding-y) var(--ui-panel-padding-x);
        border: var(--ui-border-width) solid rgba(255, 255, 255, 0.2);
        border-radius: var(--ui-panel-radius);
        background: rgba(0, 0, 0, 0.45);
        backdrop-filter: blur(4px);
    }

    .control-panel {
        display: flex;
        flex-wrap: nowrap;
        justify-content: center;
        gap: var(--ui-control-gap);
    }
    
    .spritePosition {
        margin: 0;
        font-size: var(--ui-font-size);
    }

    .spritePosition + .spritePosition {
        margin-top: var(--ui-sprite-gap);
    }

    .spritePosition pre {
        margin: var(--ui-pre-margin-top) 0 0;
    }

    .button {
        width: var(--ui-button-width);
        flex: 0 0 var(--ui-button-width);
        padding: var(--ui-button-padding);
        background-color: #000000;
        color: rgba(255, 255, 255, 0.87);
        border: var(--ui-border-width) solid rgba(255, 255, 255, 0.87);
        border-radius: var(--ui-button-radius);
        font-size: var(--ui-button-font-size);
        white-space: nowrap;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
            border: var(--ui-border-width) solid #0ec3c9;
            color: #0ec3c9;
        }

        &:active {
            background-color: #0ec3c9;
        }

        /* Disabled styles */
        &:disabled {
            cursor: not-allowed;
            border: var(--ui-border-width) solid rgba(255, 255, 255, 0.3);
            color: rgba(255, 255, 255, 0.3);
        }
    }
</style>
