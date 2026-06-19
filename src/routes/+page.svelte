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

    type MainTabKey = "roster" | "farm" | "battle" | "plaza" | "shop";

    const bottomMenuItems = [
        { label: "동료", tabKey: "roster" },
        { label: "재배", tabKey: "farm" },
        { label: "전투", tabKey: "battle" },
        { label: "광장", tabKey: "plaza" },
        { label: "상점", tabKey: "shop" }
    ] satisfies { label: string; tabKey: MainTabKey }[];

    const mainTabLabels: Record<MainTabKey, string> = {
        roster: "동료",
        farm: "재배",
        battle: "전투",
        plaza: "광장",
        shop: "상점"
    };

    const tabSceneKeys: Record<MainTabKey, string> = {
        roster: "RosterScene",
        farm: "FarmScene",
        battle: "BattleScene",
        plaza: "PlazaScene",
        shop: "ShopScene"
    };

    const defaultReturnTab: MainTabKey = "farm";
    const shopTabKey: MainTabKey = "shop";
    const nonShopTabKeys: MainTabKey[] = [
        "roster",
        "farm",
        "battle",
        "plaza"
    ];

    const isNonShopTabKey = (tabKey: MainTabKey) => {

        return nonShopTabKeys.includes(tabKey);

    };

    const getTabLabel = (tabKey: MainTabKey) => {

        return mainTabLabels[tabKey];

    };

    const getReturnTabLabel = () => {

        return getTabLabel(lastActiveNonShopTab);

    };

    const getTabSceneKey = (tabKey: MainTabKey) => {

        return tabSceneKeys[tabKey];

    };

    let activeMainTab: MainTabKey = "farm";
    let lastActiveNonShopTab: MainTabKey = defaultReturnTab;
    let phaserRef: TPhaserRef = {
        game: null,
        scene: null
    };

    $: isShopTabActive = activeMainTab === shopTabKey;
    $: returnTabLabel = getReturnTabLabel();
    $: if (isNonShopTabKey(activeMainTab))
    {

        lastActiveNonShopTab = activeMainTab;

    }

    const tutorialMessage = "안녕하세요! 저는 튜토리얼콩이에요. 튜토리얼 대본을 완성하면 다시 돌아올게요. 안녕히계세요!";
    const tutorialTypingIntervalMs = 80;

    let isGameFrameReady = false;
    let gameFrameStyle = "";
    let gameSize = { width: SAFE_AREA_WIDTH, height: SAFE_AREA_HEIGHT };
    let appElement: HTMLDivElement;
    let isDebugPopupOpen = false;
    let isFpsDebugEnabled = false;
    let isMemoryDebugEnabled = false;
    let isSafeAreaDebugEnabled = false;
    let isFullAreaDebugEnabled = false;
    let isAccountResetConfirmOpen = false;
    let isTutorialOverlayVisible = false;
    let hasGameStarted = false;
    let isLoadingOverlayVisible = false;
    let loadingProgress = 0;
    let gameUid = "";
    let uidCopyFeedback = "";
    let uidCopyFeedbackTimeoutId: number | null = null;
    let loginToastHash = "";
    let loginToastKey = 0;
    let loginToastHideTimeoutId: number | null = null;
    let tutorialTypedMessage = "";
    let tutorialTypingIntervalId: number | null = null;
    let debugFpsText = "FPS: -";
    let debugMemoryText = "Memory: -";
    $: isDebugStatusPanelVisible = isFpsDebugEnabled || isMemoryDebugEnabled;
    $: loadingPercent = Math.round(loadingProgress * 100);
    $: loadingBarWidth = `${loadingPercent}%`;
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
        const logicalSafeTop = safeAreaInsets.top / domCoordinateScale;
        const logicalSafeRight = safeAreaInsets.right / domCoordinateScale;
        const logicalSafeBottom = safeAreaInsets.bottom / domCoordinateScale;
        const logicalSafeLeft = safeAreaInsets.left / domCoordinateScale;
        const domFrameLeft = -domFrameOffsetX;
        const domFrameTop = -domFrameOffsetY;
        const domFrameRight = SAFE_AREA_WIDTH + domFrameOffsetX;
        const domFrameBottom = SAFE_AREA_HEIGHT + domFrameOffsetY;
        const domUiLeft = domFrameLeft + logicalSafeLeft;
        const domUiTop = domFrameTop + logicalSafeTop;
        const domUiRight = domFrameRight - logicalSafeRight;
        const domUiBottom = domFrameBottom - logicalSafeBottom;
        const domUiWidth = Math.max(0, domUiRight - domUiLeft);
        const domUiHeight = Math.max(0, domUiBottom - domUiTop);
        const domUiCenterX = domUiLeft + domUiWidth / 2;
        const domUiCenterY = domUiTop + domUiHeight / 2;
        const toLogicalPixelValue = (value: number) => `${value}px`;

        return {
            frameStyle: [
                `width: ${roundedFrameWidth}px`,
                `height: ${roundedFrameHeight}px`,
                `--dom-coordinate-scale: ${domCoordinateScale}`,
                `--dom-frame-left: ${toLogicalPixelValue(domFrameLeft)}`,
                `--dom-frame-top: ${toLogicalPixelValue(domFrameTop)}`,
                `--dom-frame-right: ${toLogicalPixelValue(domFrameRight)}`,
                `--dom-frame-bottom: ${toLogicalPixelValue(domFrameBottom)}`,
                `--dom-frame-width: ${gameWidth}px`,
                `--dom-frame-height: ${gameHeight}px`,
                `--dom-safe-top: ${toLogicalPixelValue(logicalSafeTop)}`,
                `--dom-safe-right: ${toLogicalPixelValue(logicalSafeRight)}`,
                `--dom-safe-bottom: ${toLogicalPixelValue(logicalSafeBottom)}`,
                `--dom-safe-left: ${toLogicalPixelValue(logicalSafeLeft)}`,
                `--dom-ui-left: ${toLogicalPixelValue(domUiLeft)}`,
                `--dom-ui-top: ${toLogicalPixelValue(domUiTop)}`,
                `--dom-ui-right: ${toLogicalPixelValue(domUiRight)}`,
                `--dom-ui-bottom: ${toLogicalPixelValue(domUiBottom)}`,
                `--dom-ui-width: ${toLogicalPixelValue(domUiWidth)}`,
                `--dom-ui-height: ${toLogicalPixelValue(domUiHeight)}`,
                `--dom-ui-center-x: ${toLogicalPixelValue(domUiCenterX)}`,
                `--dom-ui-center-y: ${toLogicalPixelValue(domUiCenterY)}`,
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

        const bounds = appElement?.getBoundingClientRect();

        if (!bounds || (bounds.width === 0 && bounds.height === 0))
        {

            return;

        }

        const gameFrame = calculateGameFrame();

        gameFrameStyle = gameFrame.frameStyle;
        gameSize = gameFrame.gameSize;
        isGameFrameReady = true;

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

    const copyTextWithFallback = async (text: string) => {

        if (!text)
        {

            return false;

        }

        if (navigator.clipboard?.writeText && window.isSecureContext)
        {

            try
            {

                await navigator.clipboard.writeText(text);

                return true;

            }
            catch
            {

                // fallback below

            }

        }

        const textArea = document.createElement("textarea");

        textArea.value = text;
        textArea.readOnly = true;
        textArea.setAttribute("aria-hidden", "true");
        textArea.style.position = "fixed";
        textArea.style.left = "0";
        textArea.style.top = "0";
        textArea.style.width = "1px";
        textArea.style.height = "1px";
        textArea.style.padding = "0";
        textArea.style.border = "0";
        textArea.style.opacity = "0";
        textArea.style.fontSize = "16px";

        document.body.appendChild(textArea);
        textArea.focus({ preventScroll: true });
        textArea.select();
        textArea.setSelectionRange(0, text.length);

        try
        {

            return document.execCommand("copy");

        }
        catch
        {

            return false;

        }
        finally
        {

            textArea.remove();

        }

    };

    const copyGameUid = async () => {

        const uid = gameUid || getOrCreateGameUid();

        gameUid = uid;

        const isCopied = await copyTextWithFallback(uid);

        setUidCopyFeedback(isCopied ? "복사됨" : "복사 실패");

    };

    const clearTutorialTyping = () => {

        if (tutorialTypingIntervalId !== null)
        {

            clearInterval(tutorialTypingIntervalId);
            tutorialTypingIntervalId = null;

        }

    };

    const startTutorialTyping = () => {

        const characters = Array.from(tutorialMessage);
        let characterIndex = 0;

        clearTutorialTyping();
        tutorialTypedMessage = "";
        tutorialTypingIntervalId = window.setInterval(() => {

            tutorialTypedMessage += characters[characterIndex] ?? "";
            characterIndex += 1;

            if (characterIndex >= characters.length)
            {

                clearTutorialTyping();

            }

        }, tutorialTypingIntervalMs);

    };

    const startGuestPlay = () => {
        const uid = gameUid || getOrCreateGameUid();

        gameUid = uid;
        showLoginToast(uid);

        if (!hasSeenGameTutorial(uid))
        {

            isTutorialOverlayVisible = true;
            tutorialTypedMessage = "";
            markGameTutorialSeen(uid);

        }

        loadingProgress = 0;
        isLoadingOverlayVisible = true;
        hasGameStarted = true;

    };

    const startLoginPlay = () => {

        window.alert("로그인 담당 콩이 아직 출근 전이에요.");

    };

    const selectMainTab = (tabKey: MainTabKey) => {

        if (tabKey === shopTabKey && activeMainTab !== shopTabKey)
        {

            lastActiveNonShopTab = activeMainTab;

        }

        activeMainTab = tabKey;
        syncPhaserSceneWithTab(tabKey);

    };

    const returnFromShopTab = () => {

        selectMainTab(lastActiveNonShopTab);

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
        clearTutorialTyping();

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

        const handleGameLoadingProgress = (progress: number) => {

            loadingProgress = Math.min(1, Math.max(0, progress));

        };

        gameUid = getOrCreateGameUid();
        scheduleGameFrameUpdate();

        const resizeObserver = new ResizeObserver(scheduleGameFrameUpdate);

        resizeObserver.observe(appElement);

        fpsAnimationFrameId = requestAnimationFrame(updateFpsFrameCount);
        debugUpdateIntervalId = window.setInterval(updateDebugStatus, 500);
        EventBus.on("game-loading-progress", handleGameLoadingProgress);

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

            clearTutorialTyping();

            window.removeEventListener("resize", scheduleGameFrameUpdate);
            window.visualViewport?.removeEventListener("resize", scheduleGameFrameUpdate);
            resizeObserver.disconnect();
            EventBus.off("game-loading-progress", handleGameLoadingProgress);

        };

    });

    // Event emitted from the PhaserGame component
    const currentScene = (_scene: Scene) => {

        EventBus.emit("debug-safe-area-changed", isSafeAreaDebugEnabled);
        EventBus.emit("debug-full-area-changed", isFullAreaDebugEnabled);
        loadingProgress = 1;
        isLoadingOverlayVisible = false;

        if (isTutorialOverlayVisible)
        {

            startTutorialTyping();

        }

    };
    
</script>

<div id="app" bind:this={appElement}>
    <div class="game-frame" style={gameFrameStyle}>
        {#if isGameFrameReady && hasGameStarted}
            <PhaserGame
                bind:phaserRef
                currentActiveScene={currentScene}
                gameWidth={gameSize.width}
                gameHeight={gameSize.height}
            />

            <div class="dom-coordinate-layer">
                {#if !isShopTabActive}
                    <nav class="bottom-menu" aria-label="하단 메뉴">
                        <img
                            class="bottom-menu-frame"
                            src="/assets/common/bottomBar.png"
                            alt=""
                            width="1440"
                            height="236"
                            aria-hidden="true"
                        />
                        <div class="bottom-menu-buttons">
                            {#each bottomMenuItems as menuItem}
                                <button
                                    class={`bottom-menu-button ${activeMainTab === menuItem.tabKey ? "bottom-menu-button-active" : ""}`}
                                    type="button"
                                    aria-pressed={activeMainTab === menuItem.tabKey}
                                    on:click={() => selectMainTab(menuItem.tabKey)}
                                >
                                    {menuItem.label}
                                </button>
                            {/each}
                        </div>
                    </nav>
                {/if}

                {#if isShopTabActive}
                    <button
                        class="shop-return-button"
                        type="button"
                        aria-label={`${returnTabLabel} 탭으로 돌아가기`}
                        on:click={returnFromShopTab}
                    >
                        돌아가기
                    </button>
                {/if}

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
                        </div>

                        <div class="debug-popup-footer">
                            <div class="debug-uid-panel" aria-label="계정 uid">
                                <div class="debug-uid-label">uid</div>
                                <div class="debug-uid-value" title={gameUid}>{gameUid}</div>
                                <button
                                    class="debug-uid-copy-button"
                                    type="button"
                                    on:click={copyGameUid}
                                >
                                    {uidCopyFeedback || "복사"}
                                </button>
                            </div>
                            <button
                                class="account-reset-button"
                                type="button"
                                on:click={() => isAccountResetConfirmOpen = true}
                            >
                                계정초기화
                            </button>
                        </div>
                    </div>
                {/if}

                {#if isAccountResetConfirmOpen}
                    <div class="account-reset-confirm-backdrop" role="presentation">
                        <div class="account-reset-confirm-popup" role="dialog" aria-label="계정초기화 확인">
                            <div class="account-reset-confirm-message">
                                계정에 대한 모든 정보가 삭제됩니다. 정말 삭제하시겠습니까?
                            </div>
                            <div class="account-reset-confirm-actions">
                                <button
                                    class="account-reset-confirm-button"
                                    type="button"
                                    on:click={() => isAccountResetConfirmOpen = false}
                                >
                                    아니요
                                </button>
                                <button
                                    class="account-reset-confirm-button account-reset-confirm-danger-button"
                                    type="button"
                                    on:click={resetGameAccount}
                                >
                                    예
                                </button>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        {/if}

        {#if isGameFrameReady && !hasGameStarted}
            <div class="start-frame-background"></div>
            <div class="dom-coordinate-layer start-coordinate-layer">
                <div class="start-content">
                    <img class="start-logo" src="/assets/logo.png" alt="logo" width="1000" height="750" />
                    <img class="start-character" src="/assets/character.png" alt="" width="600" height="600" aria-hidden="true" />
                    <div class="start-buttons">
                        <button class="start-button" type="button" on:click={startGuestPlay}>
                            <span class="start-button-label">바로 플레이</span>
                        </button>
                        <button class="start-button start-button-secondary" type="button" on:click={startLoginPlay}>
                            <span class="start-button-label">로그인하고 플레이</span>
                        </button>
                    </div>
                </div>
                <div class="start-copyright">© 2026 Twile. All Rights Reserved.</div>
            </div>
        {/if}

        {#if isLoadingOverlayVisible}
            <div class="loading-frame-cover"></div>
            <div class="dom-coordinate-layer loading-coordinate-layer" aria-live="polite">
                <div class="loading-overlay">
                    <div class="loading-title">Loading</div>
                    <div class="loading-bar-track" aria-label="loading progress">
                        <div class="loading-bar-fill" style={`width: ${loadingBarWidth}`}></div>
                    </div>
                    <div class="loading-percent">{loadingPercent}%</div>
                </div>
            </div>
        {/if}

        {#if isGameFrameReady && hasGameStarted && isTutorialOverlayVisible && !isLoadingOverlayVisible}
            <div class="dom-coordinate-layer tutorial-coordinate-layer">
                <div class="tutorial-dim" aria-hidden="true"></div>
                <section class="tutorial-guide" aria-label="튜토리얼 안내">
                    <img
                        class="tutorial-bean"
                        src="/assets/tutorial_bean.png"
                        alt="튜토리얼콩"
                        width="400"
                        height="400"
                    />
                    <div class="tutorial-dialog" role="dialog" aria-label="튜토리얼콩 대화">
                        <div class="tutorial-dialog-text" aria-live="polite">{tutorialTypedMessage}</div>
                        <button class="tutorial-close-button" type="button" on:click={closeTutorialOverlay}>
                            확인
                        </button>
                    </div>
                </section>
            </div>
        {/if}

        {#if loginToastHash}
            <div class="dom-coordinate-layer login-toast-coordinate-layer" aria-live="polite">
                {#key loginToastKey}
                    <div class="login-toast" aria-label={`${loginToastHash} 계정으로 로그인되었습니다.`}>
                        <span class="login-toast-hash">{loginToastHash}</span>
                        <span class="login-toast-suffix">계정으로 로그인되었습니다.</span>
                    </div>
                {/key}
            </div>
        {/if}
    </div>
</div>

<style>
    @font-face {
        font-family: "TmoneyRoundWind";
        src: url("/assets/fonts/TmoneyRoundWind/TmoneyRoundWindRegular.woff") format("woff");
        font-weight: 400;
        font-style: normal;
        font-display: swap;
    }

    @font-face {
        font-family: "TmoneyRoundWind";
        src: url("/assets/fonts/TmoneyRoundWind/TmoneyRoundWindExtraBold.woff") format("woff");
        font-weight: 800;
        font-style: normal;
        font-display: swap;
    }

    :global(*) {
        -webkit-tap-highlight-color: transparent;
    }

    :global(*:focus),
    :global(*:focus-visible),
    :global(*:active) {
        outline: none;
        box-shadow: none;
    }

    :global(button) {
        -webkit-tap-highlight-color: transparent;
        -webkit-appearance: none;
        appearance: none;
        outline: none;
    }

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

    .dom-coordinate-layer {
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

    .loading-frame-cover {
        position: absolute;
        inset: 0;
        z-index: 39;
        background-image: url("/assets/bg.png");
        background-position: center;
        background-size: cover;
        background-repeat: no-repeat;
        pointer-events: auto;
    }

    .start-coordinate-layer {
        z-index: 30;
    }

    .start-frame-background {
        position: absolute;
        inset: 0;
        z-index: 25;
        background-image: url("/assets/bg.png");
        background-position: center;
        background-size: cover;
        background-repeat: no-repeat;
        pointer-events: none;
    }

    .start-content {
        position: absolute;
        left: 0;
        top: 0;
        width: 1080px;
        height: 1920px;
        color: #ffffff;
        pointer-events: none;
    }

    .start-logo {
        position: absolute;
        z-index: 2;
        left: 50%;
        top: 900px;
        transform: translate(-50%, -50%);
        display: block;
        animation: start-logo-floating 3.6s ease-in-out infinite;
        will-change: transform;
    }

    @keyframes start-logo-floating {
        0%,
        100% {
            transform: translate(-50%, -50%);
        }

        50% {
            transform: translate(-50%, calc(-50% - 50px));
        }
    }

    .start-character {
        position: absolute;
        left: calc(50%);
        top: 500px;
        z-index: 0;
        width: 520px;
        height: 520px;
        transform: translate(-50%, -50%);
        display: block;
        animation: start-character-floating 3.2s ease-in-out infinite;
        will-change: transform;
        pointer-events: none;
    }

    @keyframes start-character-floating {
        0%,
        100% {
            transform: translate(-50%, -50%);
        }

        50% {
            transform: translate(-50%, calc(-50% - 20px));
        }
    }

    .start-buttons {
        position: absolute;
        left: 50%;
        top: 1200px;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 760px;
        transform: translateX(-50%);
        pointer-events: none;
    }

    .start-button {
        position: relative;
        isolation: isolate;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 620px;
        height: 191px;
        margin: 0 0 0px;
        padding: 0 48px;
        border: 0;
        background-color: transparent;
        color: #ffffff;
        font-size: 42px;
        font-weight: 800;
        line-height: 1;
        cursor: pointer;
        pointer-events: auto;
        paint-order: stroke fill;
        -webkit-text-stroke: 12px #1b3a02;
    }

    .start-button::before {
        content: "";
        position: absolute;
        inset: 0;
        z-index: -1;
        background-image: url("/assets/button.png");
        background-position: center;
        background-size: 100% 100%;
        background-repeat: no-repeat;
        pointer-events: none;
    }

    .start-button-secondary {
        -webkit-text-stroke: 12px rgb(73, 47, 0);
    }

    .start-button-secondary::before {
        filter: sepia(1) saturate(3.4) hue-rotate(350deg) brightness(1.08);
    }

    .start-button-label {
        position: relative;
        z-index: 1;
        font-family: "TmoneyRoundWind", sans-serif;
        font-weight: 400;
    }

    .start-copyright {
        position: absolute;
        left: var(--dom-frame-left, 0px);
        top: calc(var(--dom-frame-bottom, 1920px) - var(--dom-safe-bottom, 0px) - 120px);
        width: var(--dom-frame-width, 1080px);
        color: #ffffff;
        font-size: 32px;
        font-weight: 800;
        line-height: 1;
        text-align: center;
        /* text-shadow:
            -2px -2px 0 #000000,
            2px -2px 0 #000000,
            -2px 2px 0 #000000,
            2px 2px 0 #000000,
            0 3px 2px rgba(0, 0, 0, 1.55); */
        -webkit-text-stroke: 7px black; /* 두께와 색상 지정 */
        paint-order: stroke fill;
        pointer-events: none;
    }

    .loading-coordinate-layer {
        z-index: 40;
    }

    .login-toast-coordinate-layer {
        z-index: 100;
    }

    .tutorial-coordinate-layer {
        z-index: 90;
    }

    .bottom-menu {
        position: absolute;
        left: var(--dom-frame-left, 0px);
        bottom: calc(1920px - var(--dom-ui-bottom, 1920px));
        z-index: 1;
        width: var(--dom-frame-width, 1080px);
        aspect-ratio: 1440 / 236;
        pointer-events: none;
    }

    .bottom-menu-frame {
        position: absolute;
        inset: 0;
        display: block;
        width: 100%;
        height: 100%;
        pointer-events: none;
        user-select: none;
        -webkit-user-drag: none;
    }

    .bottom-menu-buttons {
        position: absolute;
        inset: 0;
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        box-sizing: border-box;
        pointer-events: none;
        padding-inline: 7%;
    }

    .bottom-menu-button {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 0;
        margin: 0;
        padding: 0;
        padding-top: 36%;
        border: 0;
        background: transparent;
        color: #fff;
        paint-order: stroke fill;
        -webkit-text-stroke: 9px #8e5c04;
        font-family: "TmoneyRoundWind", sans-serif;
        font-size: 34px;
        font-weight: 400;
        line-height: 1;
        text-align: center;
        /* text-shadow: 0 2px 4px rgba(0, 0, 0, 0.55); */
        cursor: pointer;
        pointer-events: auto;
        touch-action: manipulation;
    }

    .bottom-menu-button-active {
        color: #ffe6ba;
        -webkit-text-stroke-color: #5b3900;
        filter: drop-shadow(0 4px 4px rgba(0, 0, 0, 0.25));
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

    .login-toast {
        position: absolute;
        left: var(--dom-ui-center-x, 540px);
        top: calc(var(--dom-frame-top, 0px) + var(--dom-safe-top, 0px) + 84px);
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        max-width: calc(var(--dom-ui-width, 1080px) - 300px);
        padding: 24px 34px;
        border: 4px solid rgba(255, 255, 255, 0.9);
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.78);
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.24);
        color: #ffffff;
        font-family: "TmoneyRoundWind", sans-serif;
        font-size: 34px;
        font-weight: 400;
        line-height: 1.2;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        pointer-events: none;
        opacity: 0;
        animation: login-toast-alpha 2.6s ease-in-out forwards;
    }

    .tutorial-dim {
        position: absolute;
        left: var(--dom-frame-left, 0px);
        top: var(--dom-frame-top, 0px);
        width: var(--dom-frame-width, 1080px);
        height: var(--dom-frame-height, 1920px);
        background: rgba(0, 0, 0, 0.58);
        pointer-events: auto;
    }

    .tutorial-guide {
        position: absolute;
        left: calc(var(--dom-ui-left, 0px) + 62px);
        top: calc(var(--dom-ui-top, 0px) + 212px);
        display: flex;
        align-items: flex-start;
        gap: 26px;
        pointer-events: none;
    }

    .tutorial-bean {
        flex: 0 0 auto;
        width: 300px;
        height: 300px;
        object-fit: contain;
        animation: tutorial-bean-floating 2.8s ease-in-out infinite;
        filter: drop-shadow(0 16px 18px rgba(0, 0, 0, 0.26));
        pointer-events: none;
    }

    @keyframes tutorial-bean-floating {
        0%,
        100% {
            transform: translateY(0) rotate(-3deg);
        }

        50% {
            transform: translateY(-28px) rotate(3deg);
        }
    }

    .tutorial-dialog {
        position: relative;
        width: min(600px, calc(var(--dom-ui-width, 1080px) - 330px));
        min-height: 176px;
        margin-top: 20px;
        padding: 34px 34px 30px;
        border: 6px solid #8e5c04;
        border-radius: 28px;
        background: rgba(255, 251, 231, 0.98);
        box-shadow: 0 16px 32px rgba(0, 0, 0, 0.22);
        color: #4c3300;
        font-family: "TmoneyRoundWind", sans-serif;
        pointer-events: auto;
    }

    .tutorial-dialog::before {
        content: "";
        position: absolute;
        left: -28px;
        top: 58px;
        width: 44px;
        height: 44px;
        border-left: 6px solid #8e5c04;
        border-bottom: 6px solid #8e5c04;
        background: rgba(255, 251, 231, 0.98);
        transform: rotate(45deg);
    }

    .tutorial-dialog-text {
        position: relative;
        z-index: 1;
        min-height: 56px;
        max-width: 100%;
        font-size: 30px;
        font-weight: 800;
        line-height: 1.32;
        word-break: keep-all;
    }

    .tutorial-close-button {
        position: relative;
        z-index: 1;
        display: block;
        min-width: 150px;
        margin: 28px 0 0 auto;
        padding: 18px 26px;
        border: 0;
        border-radius: 999px;
        background: #8e5c04;
        color: #ffffff;
        font-family: "TmoneyRoundWind", sans-serif;
        font-size: 30px;
        font-weight: 800;
        line-height: 1;
        cursor: pointer;
        pointer-events: auto;
        touch-action: manipulation;
    }

    .login-toast-hash {
        flex: 0 1 auto;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .login-toast-suffix {
        flex: 0 0 auto;
        white-space: nowrap;
    }

    @keyframes login-toast-alpha {
        0% {
            opacity: 0;
        }

        16%,
        78% {
            opacity: 1;
        }

        100% {
            opacity: 0;
        }
    }

    .loading-overlay {
        position: absolute;
        left: var(--dom-frame-left, 0px);
        top: var(--dom-frame-top, 0px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: var(--dom-frame-width, 1080px);
        height: var(--dom-frame-height, 1920px);
        background: transparent;
        color: #000;
        font-family: Arial, sans-serif;
        pointer-events: auto;
    }

    .loading-title {
        margin-bottom: 48px;
        font-size: 64px;
        font-weight: 800;
        letter-spacing: 2px;
    }

    .loading-bar-track {
        width: 560px;
        height: 36px;
        padding: 4px;
        border: 4px solid #111111;
        border-radius: 999px;
        background: #ffffff;
        overflow: hidden;
    }

    .loading-bar-fill {
        width: 0;
        height: 100%;
        border-radius: 999px;
        background: #111111;
    }

    .loading-percent {
        margin-top: 24px;
        font-size: 36px;
        font-weight: 700;
    }

    .debug-status-panel {
        position: absolute;
        left: var(--dom-ui-center-x);
        top: calc(var(--dom-ui-top) + 32px);
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
        left: var(--dom-ui-left);
        top: var(--dom-ui-center-y);
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
        left: calc(var(--dom-ui-left) + 60px);
        top: calc(var(--dom-ui-top) + 60px);
        z-index: 2;
        display: flex;
        flex-direction: column;
        width: calc(var(--dom-ui-width) - 120px);
        height: calc(var(--dom-ui-height) - 120px);
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
        padding: 16px 24px;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
    }

    .debug-popup-footer {
        flex: 0 0 auto;
        padding: 20px 24px 24px;
        border-top: 2px solid rgba(255, 255, 255, 0.25);
    }

    .debug-uid-panel {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 18px;
        padding: 16px 18px;
        border: 3px solid rgba(255, 255, 255, 0.34);
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.08);
        min-width: 0;
    }

    .debug-uid-label {
        flex: 0 0 auto;
        color: rgba(255, 255, 255, 0.72);
        font-family: monospace;
        font-size: 28px;
        font-weight: 800;
        line-height: 1;
        text-transform: uppercase;
    }

    .debug-uid-value {
        flex: 1 1 auto;
        min-width: 0;
        overflow: hidden;
        color: #ffffff;
        font-family: monospace;
        font-size: 30px;
        font-weight: 700;
        line-height: 1.2;
        text-overflow: ellipsis;
        white-space: nowrap;
        user-select: text;
        -webkit-user-select: text;
    }

    .debug-uid-copy-button {
        flex: 0 0 auto;
        min-width: 116px;
        padding: 16px 18px;
        border: 3px solid rgba(255, 255, 255, 0.74);
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.16);
        color: #ffffff;
        font-size: 28px;
        font-weight: 800;
        line-height: 1;
        cursor: pointer;
        pointer-events: auto;
        touch-action: manipulation;
    }

    .account-reset-button {
        width: 100%;
        padding: 22px 24px;
        border: 3px solid #ff5b5b;
        border-radius: 14px;
        background: rgba(255, 91, 91, 0.16);
        color: #ffdddd;
        font-size: 36px;
        font-weight: 800;
        cursor: pointer;
        pointer-events: auto;
    }

    .account-reset-confirm-backdrop {
        position: absolute;
        left: var(--dom-ui-left);
        top: var(--dom-ui-top);
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
        width: var(--dom-ui-width);
        height: var(--dom-ui-height);
        background: rgba(0, 0, 0, 0.45);
        pointer-events: auto;
    }

    .account-reset-confirm-popup {
        width: min(760px, calc(var(--dom-ui-width) - 120px));
        padding: 36px 32px 28px;
        border: 4px solid rgba(255, 255, 255, 0.92);
        border-radius: 22px;
        background: rgba(0, 0, 0, 0.9);
        color: #ffffff;
        text-align: center;
    }

    .account-reset-confirm-message {
        font-size: 34px;
        font-weight: 800;
        line-height: 1.35;
        word-break: keep-all;
    }

    .account-reset-confirm-actions {
        display: flex;
        gap: 18px;
        margin-top: 34px;
    }

    .account-reset-confirm-button {
        flex: 1 1 0;
        padding: 20px 12px;
        border: 3px solid rgba(255, 255, 255, 0.65);
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.12);
        color: #ffffff;
        font-size: 32px;
        font-weight: 800;
        cursor: pointer;
    }

    .account-reset-confirm-danger-button {
        border-color: #ff5b5b;
        background: rgba(255, 91, 91, 0.22);
        color: #ffdddd;
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
