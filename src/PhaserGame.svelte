<script context="module" lang="ts">

    import type { Game, Scene } from "phaser";

    export type TPhaserRef = {
        game: Game | null,
        scene: Scene | null
    };

</script>

<script lang="ts">

    import { onMount } from "svelte";
    import StartGame from "./game/main";
    import { EventBus } from './game/EventBus';

    export let phaserRef: TPhaserRef = {
        game: null,
        scene: null
    };

    export let currentActiveScene: (scene: Scene) => void | undefined;
    export let gameWidth = 1080;
    export let gameHeight = 1920;

    onMount(() => {

        const game = StartGame("game-container", gameWidth, gameHeight);
        phaserRef = { ...phaserRef, game };

        EventBus.on('current-scene-ready', (scene_instance: Scene) => {

            phaserRef = { ...phaserRef, scene: scene_instance };

            if(currentActiveScene)
            {
                
                currentActiveScene(scene_instance);
                
            }

        });

    });

</script>

<div id="game-container"></div>

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