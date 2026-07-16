<script lang="ts">

    import { onMount } from "svelte";
    import type { Scene } from "phaser";
    import PhaserGame, { type TPhaserRef } from "../PhaserGame.svelte";
    import { EventBus } from "../game/EventBus";
    import {
        clearGameStorage,
        getOrCreateOwnedBeans,
        getOrCreateOwnedSeeds,
        getOrCreateGameUid,
        getOrCreateInboxMailStates,
        getPlantedFarmBeans,
        getPlantedFarmSeeds,
        hasUnlockedRosterTab,
        hasUnreadRosterTab,
        claimInboxMailAttachments,
        markInboxMailRead,
        markRosterTabRead,
        markRosterTabUnlocked,
        markRosterTabUnread,
        saveOwnedBeans,
        saveOwnedSeeds,
        savePlantedFarmSeeds,
        savePlantedFarmBeans
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
    import FarmBeanSelectPanel from "../lib/components/FarmBeanSelectPanel.svelte";
    import FarmHarvestPopup from "../lib/components/FarmHarvestPopup.svelte";
    import FarmSeedSelectPopup from "../lib/components/FarmSeedSelectPopup.svelte";
    import BattleCartFarmZone from "../lib/components/BattleCartFarmZone.svelte";
    import BeanGeneList from "../lib/components/BeanGeneList.svelte";
    import ProfileHud from "../lib/components/ProfileHud.svelte";
    import SettingsButton from "../lib/components/SettingsButton.svelte";
    import SettingsPopup from "../lib/components/SettingsPopup.svelte";
    import InboxPopup from "../lib/components/InboxPopup.svelte";
    import RosterPanel from "../lib/components/RosterPanel.svelte";
    import LoginToast from "../lib/components/LoginToast.svelte";
    import TestPopup from "../lib/components/TestPopup.svelte";
    import {
        createInitialPopupQueue,
        type InitialPopupDefinition
    } from "../lib/initialPopups";
    import {
        getLastOwnedBeanId,
        createRandomBeanGenes,
        type BeanDefinition,
        type OwnedSeed,
        type PlantedFarmBean,
        type PlantedFarmSeed,
        type SeedDefinition
    } from "../lib/beans";
    import {
        createInboxMails,
        hasUnreadInboxMails,
        type InboxMail,
        type InboxMailState
    } from "../lib/inbox";

    type PerformanceMemory = {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
    };

    type PerformanceWithMemory = Performance & {
        memory?: PerformanceMemory;
    };

    type QueuedPopup = InitialPopupDefinition;

    let activeMainTab: MainTabKey = "battle";
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
    const FARM_SEED_GROW_DURATION_PER_SEED_MS = 10 * 60 * 1000;
    const baseLockedMainTabs: MainTabKey[] = ["plaza", "shop"];

    let isGameFrameReady = false;
    let gameFrameStyle = "";
    let gameSize = { width: SAFE_AREA_WIDTH, height: SAFE_AREA_HEIGHT };
    let appElement: HTMLDivElement;
    let isFpsDebugEnabled = false;
    let isMemoryDebugEnabled = false;
    let isSafeAreaDebugEnabled = false;
    let isFullAreaDebugEnabled = false;
    let isRosterTabUnlocked = false;
    let isRosterTabUnread = false;
    let popupQueue: QueuedPopup[] = [];
    let activePopup: QueuedPopup | null = null;
    let isPopupLayerBusy = false;
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
    let ownedBeans: BeanDefinition[] = [];
    let ownedSeeds: OwnedSeed[] = [];
    let selectedRosterBeanId: string | null = getLastOwnedBeanId(ownedBeans);
    let plantedFarmBeans: PlantedFarmBean[] = [];
    let plantedFarmSeeds: PlantedFarmSeed[] = [];
    let activeFarmPlantSlotId: string | null = null;
    let activeFarmSeedSlotId: string | null = null;
    let activeHarvestSeed: PlantedFarmSeed | null = null;
    let activeHarvestedBean: BeanDefinition | null = null;
    let isSettingsPopupVisible = false;
    let isSettingsShortcutPanelExpanded = true;
    let isInboxPopupVisible = false;
    let activeSettingsShortcutPopup: "tester-thanks" | null = null;
    let inboxMailStates: InboxMailState[] = [];
    let inboxMails: InboxMail[] = [];
    let hasUnreadInbox = false;
    let lockedMainTabs: MainTabKey[] = [];
    let unreadMainTabs: MainTabKey[] = [];
    let fpsAnimationFrameId: number | null = null;
    let debugUpdateIntervalId: number | null = null;
    let fpsFrameCount = 0;
    let fpsLastUpdateTime = 0;
    let isDebugStatusRunning = false;
    $: EventBus.emit("debug-safe-area-changed", isSafeAreaDebugEnabled);
    $: EventBus.emit("debug-full-area-changed", isFullAreaDebugEnabled);
    $: syncDebugStatusLoop(isFpsDebugEnabled || isMemoryDebugEnabled);
    $: activePopup = popupQueue[0] ?? null;
    $: lockedMainTabs = isRosterTabUnlocked
        ? baseLockedMainTabs
        : ["roster", ...baseLockedMainTabs];
    $: unreadMainTabs = isRosterTabUnread ? ["roster"] : [];
    $: isPopupLayerBusy = Boolean(
        activeFarmSeedSlotId ||
        activeHarvestSeed ||
        isSettingsPopupVisible ||
        isInboxPopupVisible ||
        activeSettingsShortcutPopup
    );
    $: selectedRosterBean = ownedBeans.find((bean) => bean.id === selectedRosterBeanId) ?? null;
    $: EventBus.emit("roster-selected-bean-changed", selectedRosterBean);
    $: EventBus.emit("farm-plant-panel-open-changed", activeFarmPlantSlotId !== null);
    $: inboxMails = createInboxMails(inboxMailStates);
    $: hasUnreadInbox = hasUnreadInboxMails(inboxMails);

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

        popupQueue = [
            ...popupQueue,
            ...createInitialPopupQueue()
        ];

    };

    const closeActivePopup = () => {

        popupQueue = popupQueue.slice(1);

    };

    const startGuestPlay = () => {
        const uid = gameUid || getOrCreateGameUid();

        gameUid = uid;
        showLoginToast(uid);

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

        activeFarmPlantSlotId = null;

        activeFarmSeedSlotId = null;
        isSettingsPopupVisible = false;
        isInboxPopupVisible = false;
        activeSettingsShortcutPopup = null;
        if (tabKey === shopTabKey && activeMainTab !== shopTabKey)
        {

            lastActiveNonShopTab = activeMainTab;

        }

        activeMainTab = tabKey;
        if (tabKey === "roster" && isRosterTabUnread)
        {

            isRosterTabUnread = false;
            markRosterTabRead();

        }

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

    const selectRosterBean = (beanId: string) => {

        selectedRosterBeanId = beanId;

    };

    const openFarmBeanSelectPanel = (slotId: string) => {

        activeFarmPlantSlotId = slotId;
        activeFarmSeedSlotId = null;

    };

    const closeFarmBeanSelectPanel = () => {

        activeFarmPlantSlotId = null;

    };

    const openFarmSeedSelectPopup = (slotId: string) => {

        activeFarmSeedSlotId = slotId;
        activeFarmPlantSlotId = null;

    };

    const closeFarmSeedSelectPopup = () => {

        activeFarmSeedSlotId = null;

    };

    const openFarmHarvestPopup = (plantedSeed: PlantedFarmSeed) => {

        activeHarvestSeed = plantedSeed;
        activeHarvestedBean = createHarvestedBean(plantedSeed);

    };

    const createHarvestedBean = (plantedSeed: PlantedFarmSeed): BeanDefinition => {

        return {
            id: `${plantedSeed.seed.textureKey}-harvested-${Date.now()}`,
            name: plantedSeed.seed.name.replace(/\s*종자$/, "") || "완두콩",
            imageUrl: plantedSeed.seed.imageUrl,
            textureKey: plantedSeed.seed.textureKey,
            genes: createRandomBeanGenes()
        };

    };

    const addHarvestedBeanToRoster = () => {

        if (!activeHarvestSeed)
        {

            return;

        }

        const harvestedSeed = activeHarvestSeed;
        const harvestedBean = activeHarvestedBean ?? createHarvestedBean(harvestedSeed);
        const nextOwnedBeans = [...ownedBeans, harvestedBean];
        const nextPlantedFarmSeeds = plantedFarmSeeds.filter(
            (plantedSeed) => plantedSeed.seedSlotId !== harvestedSeed.seedSlotId
        );

        ownedBeans = nextOwnedBeans;
        plantedFarmSeeds = nextPlantedFarmSeeds;
        selectedRosterBeanId = harvestedBean.id;
        activeHarvestSeed = null;
        activeHarvestedBean = null;
        saveOwnedBeans(nextOwnedBeans);
        savePlantedFarmSeeds(nextPlantedFarmSeeds);
        if (!isRosterTabUnlocked)
        {

            isRosterTabUnlocked = true;
            markRosterTabUnlocked();

        }

        if (activeMainTab !== "roster")
        {

            isRosterTabUnread = true;
            markRosterTabUnread();

        }

        EventBus.emit("farm-planted-seeds-changed", nextPlantedFarmSeeds);

    };

    const plantSelectedSeedInActiveFarmSlot = (seed: SeedDefinition, count: number) => {

        if (!activeFarmSeedSlotId)
        {

            return;

        }

        const ownedSeed = ownedSeeds.find((item) => item.seed.id === seed.id);
        const plantCount = Math.min(Math.max(1, count), ownedSeed?.count ?? 0, 10);

        if (!ownedSeed || plantCount <= 0)
        {

            return;

        }

        const growDurationMs = plantCount * FARM_SEED_GROW_DURATION_PER_SEED_MS;
        const plantedSeed = {
            seedSlotId: activeFarmSeedSlotId,
            seed,
            count: plantCount,
            plantedAt: Date.now(),
            growDurationMs
        } satisfies PlantedFarmSeed;
        const nextOwnedSeeds: OwnedSeed[] = ownedSeeds.reduce((result: OwnedSeed[], item) => {

            if (item.seed.id !== seed.id)
            {

                result.push(item);
                return result;

            }

            const nextCount = item.count - plantCount;

            if (nextCount > 0)
            {

                result.push({
                    seed: item.seed,
                    count: nextCount
                });

            }

            return result;

        }, []);
        const nextPlantedFarmSeeds = [
            ...plantedFarmSeeds.filter((item) => item.seedSlotId !== activeFarmSeedSlotId),
            plantedSeed
        ];

        ownedSeeds = nextOwnedSeeds;
        plantedFarmSeeds = nextPlantedFarmSeeds;
        saveOwnedSeeds(nextOwnedSeeds);
        savePlantedFarmSeeds(nextPlantedFarmSeeds);
        EventBus.emit("farm-plant-seed", plantedSeed);
        closeFarmSeedSelectPopup();

    };

    const openSettingsPopup = () => {

        isSettingsPopupVisible = true;
        isInboxPopupVisible = false;
        activeSettingsShortcutPopup = null;

    };

    const closeSettingsPopup = () => {

        isSettingsPopupVisible = false;

    };

    const openInboxPopup = () => {

        isInboxPopupVisible = true;
        isSettingsPopupVisible = false;
        activeSettingsShortcutPopup = null;

    };

    const closeInboxPopup = () => {

        isInboxPopupVisible = false;

    };

    const toggleSettingsShortcutPanel = () => {

        isSettingsShortcutPanelExpanded = !isSettingsShortcutPanelExpanded;

    };

    const openSettingsShortcutPopup = (popupKey: "tester-thanks") => {

        activeSettingsShortcutPopup = popupKey;
        isSettingsPopupVisible = false;
        isInboxPopupVisible = false;

    };

    const closeSettingsShortcutPopup = () => {

        activeSettingsShortcutPopup = null;

    };

    const getSettingsShortcutPopupTitle = () => {

        if (activeSettingsShortcutPopup === "tester-thanks") {
            return "게임테스터 감사의인사문";
        }

        return "";

    };

    const getSettingsShortcutPopupMessage = () => {

        if (activeSettingsShortcutPopup === "tester-thanks") {
            return "게임테스터 여러분, 테스트에 참여해주셔서 감사합니다.";
        }

        return "";

    };

    const readInboxMail = (mailId: string) => {

        inboxMailStates = markInboxMailRead(mailId);

    };

    const claimInboxAttachments = (mailId: string, attachmentIds: readonly string[]) => {

        inboxMailStates = claimInboxMailAttachments(mailId, attachmentIds);

    };

    const plantSelectedBeanInActiveFarmSlot = (bean: BeanDefinition) => {

        if (!activeFarmPlantSlotId)
        {

            return;

        }

        EventBus.emit("farm-plant-bean", {
            slotId: activeFarmPlantSlotId,
            bean
        });

        const nextOwnedBeans = ownedBeans.filter((ownedBean) => ownedBean.id !== bean.id);
        const nextPlantedFarmBeans = [
            ...plantedFarmBeans.filter((plantedBean) => plantedBean.slotId !== activeFarmPlantSlotId),
            {
                slotId: activeFarmPlantSlotId,
                bean
            }
        ];

        ownedBeans = nextOwnedBeans;
        plantedFarmBeans = nextPlantedFarmBeans;
        selectedRosterBeanId = getLastOwnedBeanId(nextOwnedBeans);
        saveOwnedBeans(nextOwnedBeans);
        savePlantedFarmBeans(nextPlantedFarmBeans);

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

    const resetGameAccount = () => {

        clearGameStorage();
        window.location.reload();

    };

    const updateFpsFrameCount = () => {

        if (!isDebugStatusRunning)
        {

            fpsAnimationFrameId = null;
            return;

        }

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

    const stopDebugStatus = () => {

        isDebugStatusRunning = false;
        fpsFrameCount = 0;
        fpsLastUpdateTime = 0;

        if (fpsAnimationFrameId !== null)
        {

            cancelAnimationFrame(fpsAnimationFrameId);
            fpsAnimationFrameId = null;

        }

        if (debugUpdateIntervalId !== null)
        {

            clearInterval(debugUpdateIntervalId);
            debugUpdateIntervalId = null;

        }

    };

    const syncDebugStatusLoop = (shouldRunDebugStatus: boolean) => {

        if (!shouldRunDebugStatus)
        {

            stopDebugStatus();
            return;

        }

        if (isDebugStatusRunning)
        {

            return;

        }

        isDebugStatusRunning = true;
        fpsFrameCount = 0;
        fpsLastUpdateTime = performance.now();
        fpsAnimationFrameId = requestAnimationFrame(updateFpsFrameCount);
        debugUpdateIntervalId = window.setInterval(updateDebugStatus, 500);

    };

    onMount(() => {

        let animationFrameId: number | null = null;

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
        ownedBeans = getOrCreateOwnedBeans();
        ownedSeeds = getOrCreateOwnedSeeds();
        inboxMailStates = getOrCreateInboxMailStates();
        plantedFarmBeans = getPlantedFarmBeans();
        plantedFarmSeeds = getPlantedFarmSeeds();
        isRosterTabUnlocked = hasUnlockedRosterTab();
        isRosterTabUnread = hasUnreadRosterTab();
        selectedRosterBeanId = getLastOwnedBeanId(ownedBeans);

        scheduleGameFrameUpdate();

        const resizeObserver = new ResizeObserver(scheduleGameFrameUpdate);

        resizeObserver.observe(appElement);

        EventBus.on("phaser-loading-progress", handlePhaserLoadingProgress);
        EventBus.on("phaser-loading-complete", handlePhaserLoadingComplete);
        EventBus.on("farm-plant-slot-requested", openFarmBeanSelectPanel);
        EventBus.on("farm-seed-slot-requested", openFarmSeedSelectPopup);
        EventBus.on("farm-seed-harvest-requested", openFarmHarvestPopup);

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
            stopDebugStatus();

            window.removeEventListener("resize", scheduleGameFrameUpdate);
            window.visualViewport?.removeEventListener("resize", scheduleGameFrameUpdate);
            resizeObserver.disconnect();
            EventBus.off("phaser-loading-progress", handlePhaserLoadingProgress);
            EventBus.off("phaser-loading-complete", handlePhaserLoadingComplete);
            EventBus.off("farm-plant-slot-requested", openFarmBeanSelectPanel);
            EventBus.off("farm-seed-slot-requested", openFarmSeedSelectPopup);
            EventBus.off("farm-seed-harvest-requested", openFarmHarvestPopup);

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

        if (scene.scene.key === "RosterScene")
        {

            EventBus.emit("roster-selected-bean-changed", selectedRosterBean);

        }

        if (scene.scene.key === "FarmScene")
        {

            EventBus.emit("farm-planted-beans-changed", plantedFarmBeans);
            EventBus.emit("farm-planted-seeds-changed", plantedFarmSeeds);

        }

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
                    <ProfileHud nickname={gameUid} />
                    <SettingsButton
                        isPanelExpanded={isSettingsShortcutPanelExpanded}
                        onOpen={openSettingsPopup}
                        onTogglePanel={toggleSettingsShortcutPanel}
                        {hasUnreadInbox}
                        onOpenInbox={openInboxPopup}
                        onOpenTesterThanks={() => openSettingsShortcutPopup("tester-thanks")}
                    />

                    {#if activeMainTab === "roster"}
                        {#if selectedRosterBean}
                            <div class="roster-selected-gene-list">
                                <BeanGeneList genes={selectedRosterBean.genes} />
                            </div>
                        {/if}

                        <RosterPanel
                            {ownedBeans}
                            selectedBeanId={selectedRosterBeanId}
                            onSelectBean={selectRosterBean}
                        />
                    {/if}

                    {#if activeMainTab === "farm" && activeFarmPlantSlotId}
                        <FarmBeanSelectPanel
                            {ownedBeans}
                            onSelectBean={plantSelectedBeanInActiveFarmSlot}
                            onClose={closeFarmBeanSelectPanel}
                        />
                    {/if}

                    {#if activeMainTab === "battle"}
                        <BattleCartFarmZone />
                    {/if}

                    <BottomMenu
                        items={bottomMenuItems}
                        activeTab={activeMainTab}
                        pressedTab={pressedBottomMenuTab}
                        lockedTabs={lockedMainTabs}
                        unreadTabs={unreadMainTabs}
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

        {#if isGameFrameReady && hasGameStarted && activePopup?.key === "test-popup" && !isLoadingOverlayVisible && !isPopupLayerBusy}
            <TestPopup onClose={closeActivePopup} />
        {/if}

        {#if isGameFrameReady && hasGameStarted && activeFarmSeedSlotId && !isLoadingOverlayVisible}
            <FarmSeedSelectPopup
                {ownedSeeds}
                onPlant={plantSelectedSeedInActiveFarmSlot}
                onClose={closeFarmSeedSelectPopup}
            />
        {/if}

        {#if isGameFrameReady && hasGameStarted && activeHarvestSeed && activeHarvestedBean && !isLoadingOverlayVisible}
            <FarmHarvestPopup
                beanImageUrl={activeHarvestedBean.imageUrl}
                genes={activeHarvestedBean.genes}
                onAdd={addHarvestedBeanToRoster}
            />
        {/if}

        {#if isGameFrameReady && hasGameStarted && !isShopTabActive && isSettingsPopupVisible && !isLoadingOverlayVisible}
            <SettingsPopup onClose={closeSettingsPopup} />
        {/if}

        {#if isGameFrameReady && hasGameStarted && !isShopTabActive && isInboxPopupVisible && !isLoadingOverlayVisible}
            <InboxPopup
                mails={inboxMails}
                onRead={readInboxMail}
                onClaim={claimInboxAttachments}
                onClose={closeInboxPopup}
            />
        {/if}

        {#if isGameFrameReady && hasGameStarted && !isShopTabActive && activeSettingsShortcutPopup && !isLoadingOverlayVisible}
            <SettingsPopup
                title={getSettingsShortcutPopupTitle()}
                message={getSettingsShortcutPopupMessage()}
                onClose={closeSettingsShortcutPopup}
            />
        {/if}

        {#if loginToastHash}
            <LoginToast hash={loginToastHash} toastKey={loginToastKey} />
        {/if}

        {#if isGameFrameReady && hasGameStarted}
            <div class="dom-coordinate-layer debug-coordinate-layer">
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

    .debug-coordinate-layer {
        z-index: 10000;
    }

    .roster-selected-gene-list {
        position: absolute;
        left: 50%;
        top: 730px;
        z-index: 2;
        transform: translateX(-50%);
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
        font-family: "MabinogiClassic", sans-serif;
        font-size: 34px;
        font-weight: 800;
        line-height: 1;
        cursor: pointer;
        pointer-events: auto;
        touch-action: manipulation;
    }
</style>
