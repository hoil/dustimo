<script lang="ts">

    import { onMount } from "svelte";
    import type { Scene } from "phaser";
    import PhaserGame from "../PhaserGame.svelte";
    import { EventBus } from "../game/EventBus";
    import {
        FULL_AREA_HEIGHT,
        FULL_AREA_WIDTH,
        MAX_GAME_ASPECT,
        MIN_GAME_ASPECT,
        SAFE_AREA_HEIGHT,
        SAFE_AREA_WIDTH
    } from "../game/SafeArea";

    const toPixelValue = (value: number) => `${Math.round(value)}px`;
    type PerformanceMemory = {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
    };

    type PerformanceWithMemory = Performance & {
        memory?: PerformanceMemory;
    };

    let isGameFrameReady = false;
    let gameFrameStyle = "";
    let gameSize = { width: SAFE_AREA_WIDTH, height: SAFE_AREA_HEIGHT };
    let appElement: HTMLDivElement;
    let isDebugPopupOpen = false;
    let isFpsDebugEnabled = false;
    let isMemoryDebugEnabled = false;
    let isSafeAreaDebugEnabled = false;
    let isFullAreaDebugEnabled = false;
    let debugFpsText = "FPS: -";
    let debugMemoryText = "Memory: -";
    const mockDebugItems = Array.from({ length: 10 }, (_, index) => `mock 항목 ${index + 1}`);
    $: isDebugStatusPanelVisible = isFpsDebugEnabled || isMemoryDebugEnabled;
    $: EventBus.emit("debug-safe-area-changed", isSafeAreaDebugEnabled);
    $: EventBus.emit("debug-full-area-changed", isFullAreaDebugEnabled);

    const parsePixelValue = (value: string) => Number.parseFloat(value) || 0;

    const getViewportSafeAreaInsets = () => {

        if (!appElement)
        {

            return { top: 0, right: 0, bottom: 0, left: 0 };

        }

        const style = getComputedStyle(appElement);

        return {
            top: parsePixelValue(style.getPropertyValue("--safe-area-top")),
            right: parsePixelValue(style.getPropertyValue("--safe-area-right")),
            bottom: parsePixelValue(style.getPropertyValue("--safe-area-bottom")),
            left: parsePixelValue(style.getPropertyValue("--safe-area-left"))
        };

    };

    const calculateGameFrame = () => {

        const appBounds = appElement?.getBoundingClientRect();
        const viewportWidth = Math.max(1, appBounds?.width ?? window.innerWidth);
        const viewportHeight = Math.max(1, appBounds?.height ?? window.innerHeight);
        const viewportAspect = viewportWidth / viewportHeight;
        const gameAspect = Math.min(MAX_GAME_ASPECT, Math.max(MIN_GAME_ASPECT, viewportAspect));
        const safeAspect = SAFE_AREA_WIDTH / SAFE_AREA_HEIGHT;
        let gameWidth = isFullAreaDebugEnabled ? FULL_AREA_WIDTH : SAFE_AREA_WIDTH;
        let gameHeight = isFullAreaDebugEnabled ? FULL_AREA_HEIGHT : SAFE_AREA_HEIGHT;
        let frameWidth = viewportWidth;
        let frameHeight = viewportHeight;

        if (isFullAreaDebugEnabled)
        {
            const fullAreaAspect = FULL_AREA_WIDTH / FULL_AREA_HEIGHT;

            if (viewportAspect > fullAreaAspect)
            {
                frameHeight = viewportHeight;
                frameWidth = frameHeight * fullAreaAspect;
            }
            else
            {
                frameWidth = viewportWidth;
                frameHeight = frameWidth / fullAreaAspect;
            }
        }
        else if (gameAspect > safeAspect)
        {
            gameHeight = SAFE_AREA_HEIGHT;
            gameWidth = gameHeight * gameAspect;
        }
        else if (gameAspect < safeAspect)
        {
            gameWidth = SAFE_AREA_WIDTH;
            gameHeight = gameWidth / gameAspect;
        }

        if (!isFullAreaDebugEnabled && viewportAspect > MAX_GAME_ASPECT)
        {
            frameHeight = viewportHeight;
            frameWidth = frameHeight * MAX_GAME_ASPECT;
        }
        else if (!isFullAreaDebugEnabled && viewportAspect < MIN_GAME_ASPECT)
        {
            frameWidth = viewportWidth;
            frameHeight = frameWidth / MIN_GAME_ASPECT;
        }

        const roundedFrameWidth = Math.round(frameWidth);
        const roundedFrameHeight = Math.round(frameHeight);
        const domCoordinateScale = Math.min(frameWidth / gameWidth, frameHeight / gameHeight);
        const domFrameOffsetX = (gameWidth - SAFE_AREA_WIDTH) / 2;
        const domFrameOffsetY = (gameHeight - SAFE_AREA_HEIGHT) / 2;
        const safeAreaInsets = getViewportSafeAreaInsets();
        const toLogicalInset = (value: number) => `${value / domCoordinateScale}px`;

        return {
            frameStyle: [
                `width: ${roundedFrameWidth}px`,
                `height: ${roundedFrameHeight}px`,
                `--dom-coordinate-scale: ${domCoordinateScale}`,
                `--dom-frame-left: ${-domFrameOffsetX}px`,
                `--dom-frame-top: ${-domFrameOffsetY}px`,
                `--dom-frame-right: ${SAFE_AREA_WIDTH + domFrameOffsetX}px`,
                `--dom-frame-bottom: ${SAFE_AREA_HEIGHT + domFrameOffsetY}px`,
                `--dom-frame-width: ${gameWidth}px`,
                `--dom-frame-height: ${gameHeight}px`,
                `--dom-safe-top: ${toLogicalInset(safeAreaInsets.top)}`,
                `--dom-safe-right: ${toLogicalInset(safeAreaInsets.right)}`,
                `--dom-safe-bottom: ${toLogicalInset(safeAreaInsets.bottom)}`,
                `--dom-safe-left: ${toLogicalInset(safeAreaInsets.left)}`,
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

    const updateGameFrame = () => {

        const gameFrame = calculateGameFrame();

        gameFrameStyle = gameFrame.frameStyle;
        gameSize = gameFrame.gameSize;
        isGameFrameReady = true;

    };

    onMount(() => {

        let animationFrameId: number | null = null;
        let fpsAnimationFrameId: number | null = null;
        let debugUpdateIntervalId: number | null = null;
        let fpsFrameCount = 0;
        let fpsLastUpdateTime = performance.now();

        const updateFpsFrameCount = () => {

            fpsFrameCount += 1;
            fpsAnimationFrameId = requestAnimationFrame(updateFpsFrameCount);

        };

        const updateDebugStatus = () => {

            const now = performance.now();
            const elapsedSeconds = Math.max(0.001, (now - fpsLastUpdateTime) / 1000);
            const fps = fpsFrameCount / elapsedSeconds;
            const memory = (performance as PerformanceWithMemory).memory;

            debugFpsText = `FPS: ${Math.round(fps)}`;
            debugMemoryText = memory
                ? `Memory: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(1)} MB / ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(1)} MB`
                : "Memory: unsupported";

            fpsFrameCount = 0;
            fpsLastUpdateTime = now;

        };

        const scheduleGameFrameUpdate = () => {

            if (animationFrameId !== null)
            {

                cancelAnimationFrame(animationFrameId);

            }

            animationFrameId = requestAnimationFrame(() => {

                animationFrameId = null;
                updateGameFrame();

            });

        };

        updateGameFrame();
        fpsAnimationFrameId = requestAnimationFrame(updateFpsFrameCount);
        debugUpdateIntervalId = window.setInterval(updateDebugStatus, 500);

        window.addEventListener("resize", scheduleGameFrameUpdate);
        window.visualViewport?.addEventListener("resize", scheduleGameFrameUpdate);

        return () => {

            if (animationFrameId !== null)
            {

                cancelAnimationFrame(animationFrameId);

            }

            if (fpsAnimationFrameId !== null)
            {

                cancelAnimationFrame(fpsAnimationFrameId);

            }

            if (debugUpdateIntervalId !== null)
            {

                clearInterval(debugUpdateIntervalId);

            }

            window.removeEventListener("resize", scheduleGameFrameUpdate);
            window.visualViewport?.removeEventListener("resize", scheduleGameFrameUpdate);

        };

    });

    // Event emitted from the PhaserGame component
    const currentScene = (_scene: Scene) => {

        EventBus.emit("debug-safe-area-changed", isSafeAreaDebugEnabled);
        EventBus.emit("debug-full-area-changed", isFullAreaDebugEnabled);

    };
    
</script>

<div id="app" bind:this={appElement}>
    <div class="game-frame" style={gameFrameStyle}>
        {#if isGameFrameReady}
            <PhaserGame
                currentActiveScene={currentScene}
                gameWidth={gameSize.width}
                gameHeight={gameSize.height}
            />

            <div class="dom-coordinate-layer">
                {#if isDebugStatusPanelVisible}
                    <div class="debug-status-panel" aria-live="polite">
                        {#if isFpsDebugEnabled}
                            <div>{debugFpsText}</div>
                        {/if}
                        {#if isMemoryDebugEnabled}
                            <div>{debugMemoryText}</div>
                        {/if}
                    </div>
                {/if}

                <button
                    class="debug-open-button"
                    type="button"
                    on:click={() => isDebugPopupOpen = true}
                >
                    debug
                </button>

                {#if isDebugPopupOpen}
                    <div class="debug-popup" role="dialog" aria-label="debug menu">
                        <div class="debug-popup-header">
                            <strong>Debug</strong>
                            <button
                                class="debug-close-button"
                                type="button"
                                aria-label="close debug menu"
                                on:click={() => isDebugPopupOpen = false}
                            >
                                ×
                            </button>
                        </div>

                        <div class="debug-popup-list">
                            <label class="debug-checkbox-item">
                                <input type="checkbox" bind:checked={isFpsDebugEnabled} />
                                <span>초당 프레임</span>
                            </label>
                            <label class="debug-checkbox-item">
                                <input type="checkbox" bind:checked={isMemoryDebugEnabled} />
                                <span>메모리 사용량</span>
                            </label>
                            <label class="debug-checkbox-item">
                                <input type="checkbox" bind:checked={isSafeAreaDebugEnabled} />
                                <span>safe area 보기</span>
                            </label>
                            <label class="debug-checkbox-item">
                                <input
                                    type="checkbox"
                                    checked={isFullAreaDebugEnabled}
                                    on:change={(event) => {
                                        isFullAreaDebugEnabled = event.currentTarget.checked;
                                        updateGameFrame();
                                    }}
                                />
                                <span>full area 보기</span>
                            </label>
                            {#each mockDebugItems as item}
                                <label class="debug-checkbox-item">
                                    <input type="checkbox" />
                                    <span>{item}</span>
                                </label>
                            {/each}
                        </div>
                    </div>
                {/if}
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

        position: fixed;
        left: 0;
        top: 0;
        width: 100vw;
        height: 100vh;
        height: 100dvh;
        /* height: calc(100dvh + var(--safe-area-bottom)); */
        overflow: hidden;
        display: flex;
        justify-content: center;
        align-items: center;
        background: #cdbfff;
    }

    .game-frame {
        position: relative;
        flex: 0 0 auto;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #ff86fb;
    }

    .dom-coordinate-layer {
        position: absolute;
        left: 50%;
        top: 50%;
        z-index: 20;
        width: 1080px;
        height: 1920px;
        transform: translate(-50%, -50%) scale(var(--dom-coordinate-scale));
        transform-origin: center;
        pointer-events: none;
    }

    .debug-status-panel {
        position: absolute;
        left: 50%;
        top: calc(var(--dom-frame-top) + var(--dom-safe-top) + 32px);
        z-index: 3;
        transform: translateX(-50%);
        min-width: 360px;
        padding: 14px 22px;
        border: 3px solid rgba(255, 255, 255, 0.85);
        border-radius: 14px;
        background: rgba(0, 0, 0, 0.72);
        color: #ffffff;
        font-family: monospace;
        font-size: 28px;
        line-height: 1.35;
        text-align: center;
        pointer-events: none;
    }

    .debug-open-button {
        position: absolute;
        left: calc(var(--dom-frame-left) + var(--dom-safe-left));
        top: 50%;
        z-index: 1;
        transform: translateY(-50%);
        margin: 0;
        padding: 16px 20px;
        border: 2px solid #ff0000;
        background: #ffffff;
        color: #ff0000;
        font-size: 28px;
        font-weight: 700;
        text-decoration: underline;
        cursor: pointer;
        pointer-events: auto;
    }

    .debug-popup {
        position: absolute;
        left: calc(var(--dom-frame-left) + var(--dom-safe-left) + 60px);
        top: calc(var(--dom-frame-top) + var(--dom-safe-top) + 60px);
        z-index: 2;
        display: flex;
        flex-direction: column;
        width: calc(var(--dom-frame-width) - var(--dom-safe-left) - var(--dom-safe-right) - 120px);
        height: calc(var(--dom-frame-height) - var(--dom-safe-top) - var(--dom-safe-bottom) - 120px);
        border: 4px solid rgba(255, 255, 255, 0.9);
        border-radius: 16px;
        background: rgba(0, 0, 0, 0.88);
        color: #ffffff;
        overflow: hidden;
        pointer-events: auto;
    }

    .debug-popup-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 2px solid rgba(255, 255, 255, 0.25);
        font-size: 32px;
    }

    .debug-close-button {
        margin: 0;
        padding: 0 16px;
        border: 2px solid rgba(255, 255, 255, 0.6);
        background: transparent;
        color: #ffffff;
        font-size: 40px;
        line-height: 1.2;
        cursor: pointer;
    }

    .debug-popup-list {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        padding: 16px 24px 24px;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
    }

    .debug-checkbox-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 0;
        font-size: 48px;
    }

    .debug-checkbox-item input {
        width: 48px;
        height: 48px;
        margin: 0;
    }
</style>
