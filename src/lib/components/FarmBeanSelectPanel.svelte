<script lang="ts">

    import { onDestroy } from "svelte";

    import type { BeanDefinition } from "../beans";
    import { ROSTER_PREVIEW_HEIGHT } from "../rosterLayout";

    export let ownedBeans: readonly BeanDefinition[] = [];
    export let onSelectBean: (bean: BeanDefinition) => void;
    export let onClose: () => void;

    const rosterSlotCount = 60;
    const PANEL_CLOSE_ANIMATION_DURATION_MS = 240;

    let isClosing = false;
    let closeFallbackTimeout: ReturnType<typeof setTimeout> | null = null;
    $: rosterSlots = Array.from({ length: rosterSlotCount }, (_, index) => ownedBeans[index] ?? null);

    const stopPanelEventPropagation = (event: Event) => {

        event.stopPropagation();

    };

    const completeClose = () => {

        if (closeFallbackTimeout !== null)
        {
            clearTimeout(closeFallbackTimeout);
            closeFallbackTimeout = null;
        }

        onClose();

    };

    const requestClose = () => {

        if (isClosing)
        {
            return;
        }

        isClosing = true;
        closeFallbackTimeout = setTimeout(completeClose, PANEL_CLOSE_ANIMATION_DURATION_MS + 80);

    };

    const selectBean = (bean: BeanDefinition) => {

        if (isClosing)
        {
            return;
        }

        onSelectBean(bean);
        requestClose();

    };

    const handleAnimationEnd = () => {

        if (isClosing)
        {
            completeClose();
        }

    };

    onDestroy(() => {

        if (closeFallbackTimeout !== null)
        {
            clearTimeout(closeFallbackTimeout);
        }

    });

</script>

<div class="bean-select-layer" style={`--bean-select-panel-top: ${ROSTER_PREVIEW_HEIGHT}px;`}>
    <button
        class="bean-select-dismiss-area"
        type="button"
        aria-label="콩 선택 취소"
        onclick={requestClose}
        onpointerdown={stopPanelEventPropagation}
        onpointermove={stopPanelEventPropagation}
        onpointerup={stopPanelEventPropagation}
        onpointercancel={stopPanelEventPropagation}
        disabled={isClosing}
    ></button>

    <section
        class:bean-select-panel-closing={isClosing}
        class="bean-select-panel"
        aria-label="심을 콩 선택"
        onanimationend={handleAnimationEnd}
        onclick={stopPanelEventPropagation}
        onpointerdown={stopPanelEventPropagation}
        onpointermove={stopPanelEventPropagation}
        onpointerup={stopPanelEventPropagation}
        onpointercancel={stopPanelEventPropagation}
        ontouchstart={stopPanelEventPropagation}
        ontouchmove={stopPanelEventPropagation}
        ontouchend={stopPanelEventPropagation}
        ontouchcancel={stopPanelEventPropagation}
    >
        <div class="bean-select-panel-background" aria-hidden="true"></div>

        <div class="bean-select-frame-border" aria-hidden="true">
            <svg class="bean-select-frame-border-slice bean-select-frame-border-left" viewBox="0 0 6 44" preserveAspectRatio="none">
                <image href="/assets/roster/frame_border.png" width="20" height="44" />
            </svg>
            <svg class="bean-select-frame-border-slice bean-select-frame-border-center" viewBox="6 0 8 44" preserveAspectRatio="none">
                <image href="/assets/roster/frame_border.png" width="20" height="44" />
            </svg>
            <svg class="bean-select-frame-border-slice bean-select-frame-border-right" viewBox="14 0 6 44" preserveAspectRatio="none">
                <image href="/assets/roster/frame_border.png" width="20" height="44" />
            </svg>
        </div>

        <div class="bean-select-header">
            <div class="bean-select-header-text">
                콩 박기 <span class="bean-select-header-description">(콩의 특성 한 가지가 무작위로 종자에 유전됩니다.)</span>
            </div>
        </div>

        <button class="bean-select-close-button" type="button" aria-label="콩 선택 취소" onclick={requestClose} disabled={isClosing}>
            ×
        </button>

        <div class="bean-select-scroll">
            <div class="bean-select-grid">
                {#each rosterSlots as bean, index}
                    <button
                        class:bean-select-card-empty={!bean}
                        class="bean-select-card"
                        type="button"
                        aria-label={bean ? `${bean.name} 심기` : `빈 동료 칸 ${index + 1}`}
                        disabled={!bean || isClosing}
                        onclick={() => bean && selectBean(bean)}
                    >
                        <span class="bean-select-portrait" aria-hidden="true">
                            {#if bean}
                                <img class="bean-select-bean-image" src={bean.imageUrl} alt="" draggable="false" />
                            {/if}
                        </span>
                    </button>
                {/each}
            </div>
        </div>
    </section>
</div>

<style>
    .bean-select-layer {
        display: contents;
    }

    .bean-select-dismiss-area {
        position: absolute;
        left: var(--dom-frame-left, 0px);
        top: var(--dom-frame-top, 0px);
        z-index: 0;
        width: var(--dom-frame-width, 1080px);
        height: calc(var(--bean-select-panel-top, 760px) - var(--dom-frame-top, 0px));
        padding: 0;
        border: 0;
        background: transparent;
        cursor: default;
        pointer-events: auto;
        touch-action: none;
    }

    .bean-select-panel {
        position: absolute;
        left: var(--dom-frame-left, 0px);
        top: var(--bean-select-panel-top, 760px);
        z-index: 0;
        width: var(--dom-frame-width, 1080px);
        bottom: calc(1920px - var(--dom-frame-bottom, 1920px));
        overflow: hidden;
        background: transparent;
        box-shadow: 0 -18px 28px rgba(0, 0, 0, 0.18);
        pointer-events: auto;
        animation: bean-select-slide-in 350ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .bean-select-panel-closing {
        animation: bean-select-slide-out 350ms cubic-bezier(0.34, 0, 0.2, 1) both;
        pointer-events: none;
    }

    .bean-select-panel-background {
        position: absolute;
        left: 0;
        top: var(--bean-select-frame-border-height, 44px);
        right: 0;
        bottom: 0;
        background: rgba(255, 248, 226, 0.96);
        pointer-events: none;
    }

    .bean-select-frame-border {
        --bean-select-frame-border-left: 6px;
        --bean-select-frame-border-right: 6px;
        --bean-select-frame-border-height: 44px;
        --bean-select-frame-border-overlap: 2px;

        position: absolute;
        left: 0;
        top: 0;
        z-index: 2;
        width: 100%;
        height: var(--bean-select-frame-border-height);
        pointer-events: none;
    }

    .bean-select-frame-border-slice {
        position: absolute;
        top: 0;
        display: block;
        height: var(--bean-select-frame-border-height);
        pointer-events: none;
        shape-rendering: geometricPrecision;
    }

    .bean-select-frame-border-left {
        left: 0;
        width: calc(var(--bean-select-frame-border-left) + var(--bean-select-frame-border-overlap));
    }

    .bean-select-frame-border-center {
        left: calc(var(--bean-select-frame-border-left) - var(--bean-select-frame-border-overlap));
        width: calc(100% - var(--bean-select-frame-border-left) - var(--bean-select-frame-border-right) + var(--bean-select-frame-border-overlap) * 2);
    }

    .bean-select-frame-border-right {
        right: 0;
        width: calc(var(--bean-select-frame-border-right) + var(--bean-select-frame-border-overlap));
    }

    .bean-select-header {
        position: absolute;
        left: calc(var(--dom-safe-left, 0px) + 34px);
        top: 64px;
        right: calc(var(--dom-safe-right, 0px) + 144px);
        z-index: 4;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        min-height: 88px;
        pointer-events: none;
    }

    .bean-select-close-button {
        position: absolute;
        right: calc(var(--dom-safe-right, 0px) + 34px);
        top: 64px;
        z-index: 4;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 88px;
        height: 88px;
        padding: 0;
        border: 6px solid #ffffff;
        border-radius: 50%;
        background: rgba(74, 43, 23, 0.96);
        box-shadow: 0 10px 16px rgba(0, 0, 0, 0.22);
        color: #ffffff;
        font-family: "MabinogiClassic", sans-serif;
        font-size: 66px;
        font-weight: 800;
        line-height: 1;
        cursor: pointer;
        pointer-events: auto;
        touch-action: manipulation;
    }

    .bean-select-header-text {
        flex: 1 1 auto;
        min-width: 0;
        color: #4a2b17;
        font-family: "MabinogiClassic", sans-serif;
        font-size: 38px;
        font-weight: 800;
        line-height: 1.25;
        text-align: left;
        text-shadow: 0 3px 0 rgba(255, 255, 255, 0.7);
        pointer-events: none;
    }

    .bean-select-header-description {
        font-size: 27px;
        font-weight: 800;
    }

    .bean-select-scroll {
        position: absolute;
        left: 0;
        top: var(--bean-select-frame-border-height, 44px);
        right: 0;
        bottom: 0;
        overflow-x: hidden;
        overflow-y: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        padding: 124px 28px 300px;
        pointer-events: auto;
        touch-action: pan-y;
    }

    .bean-select-scroll::-webkit-scrollbar {
        display: none;
    }

    .bean-select-grid {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        align-items: start;
        gap: 18px;
    }

    .bean-select-card {
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        width: 100%;
        height: auto;
        min-width: 0;
        min-height: 0;
        aspect-ratio: 1 / 1;
        margin: 0;
        padding: 8px;
        border: 5px solid #8e5c04;
        border-radius: 24px;
        background: #fff7d8;
        box-shadow: 0 8px 0 rgba(91, 57, 0, 0.28);
        cursor: pointer;
        line-height: 1;
        pointer-events: auto;
        touch-action: manipulation;
        -webkit-appearance: none;
        appearance: none;
    }

    .bean-select-card-empty {
        cursor: default;
        opacity: 0.72;
    }

    .bean-select-card:disabled {
        pointer-events: none;
    }

    .bean-select-card:not(:disabled):active {
        transform: translateY(5px);
        box-shadow: 0 3px 0 rgba(91, 57, 0, 0.28);
    }

    .bean-select-portrait {
        display: flex;
        flex: 0 0 auto;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        width: 100%;
        height: auto;
        aspect-ratio: 1 / 1;
        overflow: hidden;
        border-radius: 18px;
        background: #7f5b1e52;
    }

    .bean-select-bean-image {
        display: block;
        width: 86%;
        height: 86%;
        object-fit: contain;
        user-select: none;
        -webkit-user-drag: none;
    }

    @keyframes bean-select-slide-in {
        from {
            transform: translateY(100%);
        }

        to {
            transform: translateY(0);
        }
    }

    @keyframes bean-select-slide-out {
        from {
            transform: translateY(0);
        }

        to {
            transform: translateY(100%);
        }
    }
</style>
