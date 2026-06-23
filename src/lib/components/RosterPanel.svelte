<script lang="ts">

    import type { BeanDefinition } from "../beans";
    import { ROSTER_PREVIEW_HEIGHT } from "../rosterLayout";

    export let ownedBeans: readonly BeanDefinition[] = [];
    export let selectedBeanId: string | null = null;
    export let onSelectBean: (beanId: string) => void;

    const rosterSlotCount = 60;
    $: rosterSlots = Array.from({ length: rosterSlotCount }, (_, index) => ownedBeans[index] ?? null);

</script>

<section
    class="roster-panel"
    aria-label="내 콩 컬렉션"
    style={`--roster-preview-height: ${ROSTER_PREVIEW_HEIGHT}px;`}
>
    <div class="roster-panel-background" aria-hidden="true"></div>

    <div class="roster-frame-border" aria-hidden="true">
        <svg class="roster-frame-border-slice roster-frame-border-left" viewBox="0 0 6 44" preserveAspectRatio="none">
            <image href="/assets/roster/frame_border.png" width="20" height="44" />
        </svg>
        <svg class="roster-frame-border-slice roster-frame-border-center" viewBox="6 0 8 44" preserveAspectRatio="none">
            <image href="/assets/roster/frame_border.png" width="20" height="44" />
        </svg>
        <svg class="roster-frame-border-slice roster-frame-border-right" viewBox="14 0 6 44" preserveAspectRatio="none">
            <image href="/assets/roster/frame_border.png" width="20" height="44" />
        </svg>
    </div>

    <div class="roster-scroll">
        <div class="roster-grid">
            {#each rosterSlots as bean, index}
                <button
                    class:roster-card-selected={bean?.id === selectedBeanId}
                    class:roster-card-empty={!bean}
                    class="roster-card"
                    type="button"
                    aria-label={bean ? `${bean.name} 선택` : `빈 동료 칸 ${index + 1}`}
                    aria-pressed={bean ? bean.id === selectedBeanId : undefined}
                    disabled={!bean}
                    onclick={() => bean && onSelectBean(bean.id)}
                >
                    <span class="roster-portrait" aria-hidden="true">
                        {#if bean}
                            <img class="roster-bean-image" src={bean.imageUrl} alt="" draggable="false" />
                        {/if}
                    </span>
                </button>
            {/each}
        </div>
    </div>
</section>

<style>
    .roster-panel {
        position: absolute;
        left: var(--dom-frame-left, 0px);
        top: var(--roster-preview-height, 760px);
        z-index: 1;
        width: var(--dom-frame-width, 1080px);
        bottom: calc(1920px - var(--dom-frame-bottom, 1920px));
        overflow: hidden;
        background: transparent;
        box-shadow: 0 -18px 28px rgba(0, 0, 0, 0.18);
        pointer-events: auto;
    }

    .roster-panel-background {
        position: absolute;
        left: 0;
        top: var(--roster-frame-border-height, 44px);
        right: 0;
        bottom: 0;
        background: rgba(255, 248, 226, 0.96);
        pointer-events: none;
    }

    .roster-frame-border {
        --roster-frame-border-left: 6px;
        --roster-frame-border-right: 6px;
        --roster-frame-border-height: 44px;
        --roster-frame-border-overlap: 2px;

        position: absolute;
        left: 0;
        top: 0;
        z-index: 2;
        width: 100%;
        height: var(--roster-frame-border-height);
        pointer-events: none;
    }

    .roster-frame-border-slice {
        position: absolute;
        top: 0;
        display: block;
        height: var(--roster-frame-border-height);
        pointer-events: none;
        shape-rendering: geometricPrecision;
    }

    .roster-frame-border-left {
        left: 0;
        width: calc(var(--roster-frame-border-left) + var(--roster-frame-border-overlap));
    }

    .roster-frame-border-center {
        left: calc(var(--roster-frame-border-left) - var(--roster-frame-border-overlap));
        width: calc(100% - var(--roster-frame-border-left) - var(--roster-frame-border-right) + var(--roster-frame-border-overlap) * 2);
    }

    .roster-frame-border-right {
        right: 0;
        width: calc(var(--roster-frame-border-right) + var(--roster-frame-border-overlap));
    }

    .roster-scroll {
        position: absolute;
        left: 0;
        top: var(--roster-frame-border-height, 44px);
        right: 0;
        bottom: 0;
        overflow-x: hidden;
        overflow-y: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        padding: 18px 28px 300px;
        pointer-events: auto;
        touch-action: pan-y;
    }

    .roster-scroll::-webkit-scrollbar {
        display: none;
    }

    .roster-grid {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        align-items: start;
        gap: 18px;
    }

    .roster-card {
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

    .roster-card-selected {
        border-color: #ffde45;
        background: #fff0a8;
        box-shadow:
            0 8px 0 rgba(155, 105, 0, 0.36),
            0 0 0 6px rgba(255, 177, 33, 0.48) inset;
    }

    .roster-card-empty {
        cursor: default;
        opacity: 0.72;
    }

    .roster-card:disabled {
        pointer-events: none;
    }

    .roster-card:not(:disabled):active {
        transform: translateY(5px);
        box-shadow: 0 3px 0 rgba(91, 57, 0, 0.28);
    }

    .roster-portrait {
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
        color: #5b3900;
        font-family: "MabinogiClassic", sans-serif;
        font-size: 34px;
        font-weight: 800;
        line-height: 1;
    }

    .roster-bean-image {
        display: block;
        width: 86%;
        height: 86%;
        object-fit: contain;
        user-select: none;
        -webkit-user-drag: none;
    }
</style>
