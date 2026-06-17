<script context="module" lang="ts">

    import type { Game, Scene } from "phaser";

    export type TPhaserRef = {
        game: Game | null,
        scene: Scene | null
    };

</script>

<script lang="ts">

    import { onMount, tick } from "svelte";
    import StartGame from "./game/main";
    import { EventBus } from './game/EventBus';

    export let phaserRef: TPhaserRef = {
        game: null,
        scene: null
    };

    export let currentActiveScene: (scene: Scene) => void | undefined;
    export let gameWidth = 1080;
    export let gameHeight = 1920;

    let game: Game | null = null;
    let gameContainer: HTMLDivElement;
    let resizeObserver: ResizeObserver | null = null;
    let refreshAnimationFrameIds: number[] = [];
    let refreshTimeoutIds: number[] = [];

    const runScaleRefresh = () => {

        game?.scale.refresh();

    };

    const clearScheduledScaleRefresh = () => {

        refreshAnimationFrameIds.forEach(cancelAnimationFrame);
        refreshAnimationFrameIds = [];
        refreshTimeoutIds.forEach(clearTimeout);
        refreshTimeoutIds = [];

    };

    const refreshScale = () => {

        if (!game)
        {

            return;

        }

        clearScheduledScaleRefresh();

        const firstFrameId = requestAnimationFrame(() => {

            runScaleRefresh();

            const secondFrameId = requestAnimationFrame(runScaleRefresh);
            refreshAnimationFrameIds = refreshAnimationFrameIds.filter((id) => id !== firstFrameId);
            refreshAnimationFrameIds.push(secondFrameId);

        });

        const firstTimeoutId = window.setTimeout(runScaleRefresh, 50);
        const secondTimeoutId = window.setTimeout(runScaleRefresh, 120);

        refreshAnimationFrameIds.push(firstFrameId);
        refreshTimeoutIds.push(firstTimeoutId, secondTimeoutId);

    };

    $: if (game)
    {

        const width = Math.round(gameWidth);
        const height = Math.round(gameHeight);

        tick().then(() => {

            if (!game)
            {

                return;

            }

            if (game.scale.width !== width || game.scale.height !== height)
            {

                game.scale.setGameSize(width, height);
                refreshScale();

            }
            else
            {

                refreshScale();

            }

        });

    }

    onMount(() => {

        game = StartGame("game-container", gameWidth, gameHeight);
        phaserRef = { ...phaserRef, game };

        const handleCurrentSceneReady = (scene_instance: Scene) => {

            phaserRef = { ...phaserRef, scene: scene_instance };

            if(currentActiveScene)
            {
                
                currentActiveScene(scene_instance);
                
            }

        };

        EventBus.on('current-scene-ready', handleCurrentSceneReady);

        resizeObserver = new ResizeObserver(refreshScale);
        resizeObserver.observe(gameContainer);

        return () => {

            clearScheduledScaleRefresh();
            resizeObserver?.disconnect();
            EventBus.off('current-scene-ready', handleCurrentSceneReady);
            game?.destroy(true);
            game = null;

        };

    });

</script>

<div id="game-container" bind:this={gameContainer}></div>

<style>
    #game-container {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
    }

    #game-container :global(canvas) {
        display: block;
    }
</style>