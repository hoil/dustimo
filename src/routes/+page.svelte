<script lang="ts">

    import { onMount } from "svelte";
    import type { Scene } from "phaser";
    import PhaserGame, { type TPhaserRef } from "../PhaserGame.svelte";
    import { EventBus } from "../game/EventBus";
    import {
        clearGameStorage,
        getOrCreateGameUid,
        hasSeenGameTutorial,
        markGameTutorialSeen
    } from "../lib/gameStorage";
    import { SAFE_AREA_HEIGHT, SAFE_AREA_WIDTH } from "../game/SafeArea";
    import {
        bottomMenuItems,
        defaultReturnTab,
        getTabLabel,
        getTabSceneKey,
        isNonShopTabKey,
        shopTabKey,
        type MainTabKey
    } from "../lib/navigation";
    import { calculateGameFrame } from "../lib/gameFrame";
    import { copyTextWithFallback } from "../lib/clipboard";
    import BottomMenu from "../lib/components/BottomMenu.svelte";
    import DebugPanel from "../lib/components/DebugPanel.svelte";
    import StartScreen from "../lib/components/StartScreen.svelte";
    import LoadingOverlay from "../lib/components/LoadingOverlay.svelte";
    import RosterPanel from "../lib/components/RosterPanel.svelte";
    import TutorialOverlay from "../lib/components/TutorialOverlay.svelte";
    import LoginToast from "../lib/components/LoginToast.svelte";
    import TestPopup from "../lib/components/TestPopup.svelte";
    import {
        createInitialPopupQueue,
        type InitialPopupDefinition
    } from "../lib/initialPopups";

    type PerformanceMemory = {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
    };

    type PerformanceWithMemory = Performance & {
        memory?: PerformanceMemory;
    };

    let activeMainTab: MainTabKey = "farm";
    let lastActiveNonShopTab: MainTabKey = defaultReturnTab;
    let pressedBottomMenuTab: MainTabKey | null = null;
    let phaserRef: TPhaserRef = {
        game: null,
        scene: null
    };

    const getReturnTabLabel = () => {

        return getTabLabel(lastActiveNonShopTab);

    };

    $: isShopTabActive = activeMainTab === shopTabKey;
    $: returnTabLabel = getReturnTabLabel();
    $: if (isNonShopTabKey(activeMainTab))
    {

        lastActiveNonShopTab = activeMainTab;

    }

    const LOADING_PROGRESS_READY_DISPLAY_LIMIT = 0.95;
    const LOADING_COMPLETE_TWEEN_DURATION = 450;
    const tutorialMessage = "안녕하세요! 저는 튜토리얼콩이에요. 튜토리얼 대본을 완성하면 다시 돌아올게요. 안녕히계세요!";

    let isGameFrameReady = false;
    let gameFrameStyle = "";
    let gameSize = { width: SAFE_AREA_WIDTH, height: SAFE_AREA_HEIGHT };
    let appElement: HTMLDivElement;
    let isFpsDebugEnabled = false;
    let isMemoryDebugEnabled = false;
    let isSafeAreaDebugEnabled = false;
    let isFullAreaDebugEnabled = false;
    let isTutorialOverlayVisible = false;
    let initialPopupQueue: InitialPopupDefinition[] = [];
    let activeInitialPopup: InitialPopupDefinition | null = null;
    let isInitialPopupFlowActive = false;
    let hasGameStarted = false;
    let isLoadingOverlayVisible = false;
    let loadingProgress = 0;
    let domLoadingProgress = 0;
    let phaserLoadingProgress = 0;
    let isDomLoadingComplete = false;
    let isPhaserLoadingComplete = false;
    let hasIntroStartRequested = false;
    let loadingProgressTweenFrameId: number | null = null;
    let gameUid = "";
    let uidCopyFeedback = "";
    let uidCopyFeedbackTimeoutId: number | null = null;
    let loginToastHash = "";
    let loginToastKey = 0;
    let loginToastHideTimeoutId: number | null = null;
    let debugFpsText = "FPS: -";
    let debugMemoryText = "Memory: -";
    $: EventBus.emit("debug-safe-area-changed", isSafeAreaDebugEnabled);
    $: EventBus.emit("debug-full-area-changed", isFullAreaDebugEnabled);
    $: activeInitialPopup = initialPopupQueue[0] ?? null;
    $: isInitialPopupFlowActive = initialPopupQueue.length > 0;

    const updateGameFrame = () => {

        const bounds = appElement?.getBoundingClientRect();

        if (!bounds || (bounds.width === 0 && bounds.height === 0))
        {

            return;

        }

        const gameFrame = calculateGameFrame(appElement, isFullAreaDebugEnabled);

        gameFrameStyle = gameFrame.frameStyle;
        gameSize = gameFrame.gameSize;
        isGameFrameReady = true;

    };

    const handleFullAreaChange = (value: boolean) => {

        isFullAreaDebugEnabled = value;
        updateGameFrame();

    };

    const showLoginToast = (hash: string) => {

        if (loginToastHideTimeoutId !== null)
        {

            clearTimeout(loginToastHideTimeoutId);

        }

        loginToastKey += 1;
        loginToastHash = hash;
        loginToastHideTimeoutId = window.setTimeout(() => {

            loginToastHash = "";
            loginToastHideTimeoutId = null;

        }, 2600);

    };

    const setUidCopyFeedback = (message: string) => {

        if (uidCopyFeedbackTimeoutId !== null)
        {

            clearTimeout(uidCopyFeedbackTimeoutId);

        }

        uidCopyFeedback = message;
        uidCopyFeedbackTimeoutId = window.setTimeout(() => {

            uidCopyFeedback = "";
            uidCopyFeedbackTimeoutId = null;

        }, 1600);

    };

    const copyGameUid = async () => {

        const uid = gameUid || getOrCreateGameUid();

        gameUid = uid;

        const isCopied = await copyTextWithFallback(uid);

        setUidCopyFeedback(isCopied ? "복사됨" : "복사 실패");

    };

    const playPhaserPopSound = () => {

        const soundManager = phaserRef.game?.sound ?? phaserRef.scene?.sound;

        if (!soundManager)
        {

            return false;

        }

        try
        {

            return soundManager.play("pop");

        }
        catch
        {

            return false;

        }

    };

    const playPopSound = () => {

        playPhaserPopSound();

    };

    const clampProgress = (progress: number) => {

        return Math.min(1, Math.max(0, progress));

    };

    const updateCombinedLoadingProgress = () => {

        if (hasIntroStartRequested)
        {

            return;

        }

        loadingProgress = Math.min(
            LOADING_PROGRESS_READY_DISPLAY_LIMIT,
            clampProgress((domLoadingProgress + phaserLoadingProgress) / 2)
        );

    };

    const cancelLoadingProgressTween = () => {

        if (loadingProgressTweenFrameId !== null)
        {

            cancelAnimationFrame(loadingProgressTweenFrameId);
            loadingProgressTweenFrameId = null;

        }

    };

    const tweenLoadingProgressToComplete = (onComplete: () => void) => {

        cancelLoadingProgressTween();

        const startProgress = loadingProgress;
        const startTime = performance.now();

        const updateProgress = (currentTime: number) => {

            const elapsedTime = currentTime - startTime;
            const tweenProgress = clampProgress(elapsedTime / LOADING_COMPLETE_TWEEN_DURATION);
            const easedProgress = 1 - Math.pow(1 - tweenProgress, 3);

            loadingProgress = startProgress + (1 - startProgress) * easedProgress;

            if (tweenProgress < 1)
            {

                loadingProgressTweenFrameId = requestAnimationFrame(updateProgress);
                return;

            }

            loadingProgressTweenFrameId = null;
            loadingProgress = 1;
            onComplete();

        };

        loadingProgressTweenFrameId = requestAnimationFrame(updateProgress);

    };

    const requestIntroStartIfReady = () => {

        if (
            !isLoadingOverlayVisible ||
            hasIntroStartRequested ||
            !isDomLoadingComplete ||
            !isPhaserLoadingComplete
        )
        {

            return;

        }

        hasIntroStartRequested = true;
        tweenLoadingProgressToComplete(() => {

            EventBus.emit("intro-loading-start-game");

        });

    };

    const resetIntroLoadingState = () => {

        cancelLoadingProgressTween();
        domLoadingProgress = 0;
        phaserLoadingProgress = 0;
        isDomLoadingComplete = false;
        isPhaserLoadingComplete = false;
        hasIntroStartRequested = false;
        loadingProgress = 0;

    };

    const handleDomLoadingProgress = (progress: number) => {

        domLoadingProgress = clampProgress(progress);
        updateCombinedLoadingProgress();

    };

    const handleDomLoadingComplete = () => {

        domLoadingProgress = 1;
        isDomLoadingComplete = true;
        updateCombinedLoadingProgress();
        requestIntroStartIfReady();

    };

    const handlePhaserLoadingProgress = (progress: number) => {

        phaserLoadingProgress = clampProgress(progress);
        updateCombinedLoadingProgress();

    };

    const handlePhaserLoadingComplete = () => {

        phaserLoadingProgress = 1;
        isPhaserLoadingComplete = true;
        updateCombinedLoadingProgress();
        requestIntroStartIfReady();

    };

    const startIntroLoadingScene = () => {

        const currentScene = phaserRef.scene;

        if (!currentScene || currentScene.scene.key !== "Boot")
        {

            return;

        }

        currentScene.scene.start("IntroLoadingScene");

    };

    const startInitialPopupFlow = () => {

        initialPopupQueue = createInitialPopupQueue();

    };

    const closeActiveInitialPopup = () => {

        initialPopupQueue = initialPopupQueue.slice(1);

    };

    const startGuestPlay = () => {
        const uid = gameUid || getOrCreateGameUid();

        gameUid = uid;
        showLoginToast(uid);

        if (!hasSeenGameTutorial(uid))
        {

            isTutorialOverlayVisible = true;
            markGameTutorialSeen(uid);

        }

        resetIntroLoadingState();
        isLoadingOverlayVisible = true;
        startInitialPopupFlow();
        hasGameStarted = true;
        startIntroLoadingScene();

    };

    const startGuestPlayWithSound = () => {

        playPopSound();
        startGuestPlay();

    };

    const startLoginPlay = () => {

        window.alert("로그인 담당 콩이 아직 출근 전이에요.");

    };

    const startLoginPlayWithSound = () => {

        playPopSound();
        startLoginPlay();

    };

    const selectMainTab = (tabKey: MainTabKey) => {

        if (tabKey === shopTabKey && activeMainTab !== shopTabKey)
        {

            lastActiveNonShopTab = activeMainTab;

        }

        activeMainTab = tabKey;
        syncPhaserSceneWithTab(tabKey);

    };

    const selectMainTabWithSound = (tabKey: MainTabKey) => {

        playPopSound();
        selectMainTab(tabKey);

    };

    const pressBottomMenuButton = (tabKey: MainTabKey) => {

        pressedBottomMenuTab = tabKey;

    };

    const releaseBottomMenuButton = (tabKey: MainTabKey) => {

        if (pressedBottomMenuTab === tabKey)
        {

            pressedBottomMenuTab = null;

        }

    };

    const returnFromShopTab = () => {

        selectMainTab(lastActiveNonShopTab);

    };

    const returnFromShopTabWithSound = () => {

        playPopSound();
        returnFromShopTab();

    };

    const syncPhaserSceneWithTab = (tabKey: MainTabKey) => {

        const targetSceneKey = getTabSceneKey(tabKey);
        const currentScene = phaserRef.scene;

        if (!currentScene || currentScene.scene.key === targetSceneKey)
        {

            return;

        }

        currentScene.scene.start(targetSceneKey);

    };

    const closeTutorialOverlay = () => {

        isTutorialOverlayVisible = false;

    };

    const resetGameAccount = () => {

        clearGameStorage();
        window.location.reload();

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

        gameUid = getOrCreateGameUid();

        scheduleGameFrameUpdate();

        const resizeObserver = new ResizeObserver(scheduleGameFrameUpdate);

        resizeObserver.observe(appElement);

        fpsAnimationFrameId = requestAnimationFrame(updateFpsFrameCount);
        debugUpdateIntervalId = window.setInterval(updateDebugStatus, 500);
        EventBus.on("phaser-loading-progress", handlePhaserLoadingProgress);
        EventBus.on("phaser-loading-complete", handlePhaserLoadingComplete);

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

            if (loginToastHideTimeoutId !== null)
            {

                clearTimeout(loginToastHideTimeoutId);

            }

            if (uidCopyFeedbackTimeoutId !== null)
            {

                clearTimeout(uidCopyFeedbackTimeoutId);

            }

            cancelLoadingProgressTween();

            window.removeEventListener("resize", scheduleGameFrameUpdate);
            window.visualViewport?.removeEventListener("resize", scheduleGameFrameUpdate);
            resizeObserver.disconnect();
            EventBus.off("phaser-loading-progress", handlePhaserLoadingProgress);
            EventBus.off("phaser-loading-complete", handlePhaserLoadingComplete);

        };

    });

    // Event emitted from the PhaserGame component
    const currentScene = (scene: Scene) => {

        EventBus.emit("debug-safe-area-changed", isSafeAreaDebugEnabled);
        EventBus.emit("debug-full-area-changed", isFullAreaDebugEnabled);

        if (scene.scene.key === "Boot")
        {

            if (hasGameStarted)
            {

                startIntroLoadingScene();

            }

            return;

        }

        loadingProgress = 1;
        isLoadingOverlayVisible = false;

    };

</script>

<div id="app" bind:this={appElement}>
    <div class="game-frame" style={gameFrameStyle}>
        {#if isGameFrameReady}
            <PhaserGame
                bind:phaserRef
                currentActiveScene={currentScene}
                gameWidth={gameSize.width}
                gameHeight={gameSize.height}
            />
        {/if}

        {#if isGameFrameReady && hasGameStarted}
            <div class="dom-coordinate-layer">
                {#if !isShopTabActive}
                    {#if activeMainTab === "roster"}
                        <RosterPanel />
                    {/if}

                    <BottomMenu
                        items={bottomMenuItems}
                        activeTab={activeMainTab}
                        pressedTab={pressedBottomMenuTab}
                        onSelect={selectMainTabWithSound}
                        onPress={pressBottomMenuButton}
                        onRelease={releaseBottomMenuButton}
                    />
                {/if}

                {#if isShopTabActive}
                    <button
                        class="shop-return-button"
                        type="button"
                        aria-label={`${returnTabLabel} 탭으로 돌아가기`}
                        onclick={returnFromShopTabWithSound}
                    >
                        돌아가기
                    </button>
                {/if}

                <DebugPanel
                    bind:isFpsDebugEnabled
                    bind:isMemoryDebugEnabled
                    bind:isSafeAreaDebugEnabled
                    isFullAreaDebugEnabled={isFullAreaDebugEnabled}
                    {debugFpsText}
                    {debugMemoryText}
                    {gameUid}
                    {uidCopyFeedback}
                    onFullAreaChange={handleFullAreaChange}
                    onCopyUid={copyGameUid}
                    onResetAccount={resetGameAccount}
                />
            </div>
        {/if}

        {#if isGameFrameReady && !hasGameStarted}
            <StartScreen
                onGuestPlay={startGuestPlayWithSound}
                onLoginPlay={startLoginPlayWithSound}
            />
        {/if}

        {#if isLoadingOverlayVisible}
            <LoadingOverlay
                progress={loadingProgress}
                onDomProgress={handleDomLoadingProgress}
                onDomComplete={handleDomLoadingComplete}
            />
        {/if}

        {#if isGameFrameReady && hasGameStarted && activeInitialPopup?.key === "test-popup" && !isLoadingOverlayVisible}
            <TestPopup onClose={closeActiveInitialPopup} />
        {/if}

        {#if isGameFrameReady && hasGameStarted && isTutorialOverlayVisible && !isLoadingOverlayVisible && !isInitialPopupFlowActive}
            <TutorialOverlay message={tutorialMessage} onClose={closeTutorialOverlay} />
        {/if}

        {#if loginToastHash}
            <LoginToast hash={loginToastHash} toastKey={loginToastKey} />
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
        /* background: #cdbfff; */
        background: #fff;
    }

    .game-frame {
        position: relative;
        flex: 0 0 auto;
        width: 100%;
        height: 100%;
        overflow: hidden;
        /* background: #ff86fb; */
        background: #fff;
    }

    :global(.dom-coordinate-layer) {
        position: absolute;
        left: 50%;
        top: 50%;
        z-index: 20;
        width: 1080px;
        height: 1920px;
        transform: translate(-50%, -50%) scale(var(--dom-coordinate-scale, 1));
        transform-origin: center;
        pointer-events: none;
    }

    .shop-return-button {
        position: absolute;
        right: calc(1080px - var(--dom-ui-right, 1080px) + 48px);
        bottom: calc(1920px - var(--dom-ui-bottom, 1920px) + 48px);
        z-index: 2;
        min-width: 220px;
        min-height: 92px;
        padding: 0 42px;
        border: 6px solid #8e5c04;
        border-radius: 999px;
        background: rgba(255, 251, 231, 0.96);
        box-shadow: 0 14px 24px rgba(0, 0, 0, 0.22);
        color: #4c3300;
        font-family: "TmoneyRoundWind", sans-serif;
        font-size: 34px;
        font-weight: 800;
        line-height: 1;
        cursor: pointer;
        pointer-events: auto;
        touch-action: manipulation;
    }
</style>
