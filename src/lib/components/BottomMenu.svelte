<script lang="ts">

    import type { BottomMenuItem, MainTabKey } from "../navigation";

    export let items: BottomMenuItem[];
    export let activeTab: MainTabKey;
    export let pressedTab: MainTabKey | null;
    export let lockedTabs: readonly MainTabKey[] = [];
    export let onSelect: (tabKey: MainTabKey) => void;
    export let onPress: (tabKey: MainTabKey) => void;
    export let onRelease: (tabKey: MainTabKey) => void;

    const isTabLocked = (tabKey: MainTabKey) => {

        return lockedTabs.includes(tabKey);

    };

</script>

<nav class="bottom-menu" aria-label="하단 메뉴">
    <img
        class="bottom-menu-frame"
        src="/assets/bottom_menu/frame.png"
        alt=""
        width="1440"
        height="782"
        aria-hidden="true"
    />
    <div class="bottom-menu-buttons">
        {#each items as menuItem}
            {@const isLocked = isTabLocked(menuItem.tabKey)}
            <button
                class={`bottom-menu-button ${activeTab === menuItem.tabKey ? "bottom-menu-button-active" : ""} ${pressedTab === menuItem.tabKey && !isLocked ? "bottom-menu-button-pressed" : ""} ${isLocked ? "bottom-menu-button-locked" : ""}`}
                type="button"
                aria-pressed={activeTab === menuItem.tabKey}
                aria-disabled={isLocked}
                disabled={isLocked}
                onpointerdown={() => !isLocked && onPress(menuItem.tabKey)}
                onpointerup={() => !isLocked && onRelease(menuItem.tabKey)}
                onpointerleave={() => !isLocked && onRelease(menuItem.tabKey)}
                onpointercancel={() => !isLocked && onRelease(menuItem.tabKey)}
                onblur={() => !isLocked && onRelease(menuItem.tabKey)}
                onclick={() => !isLocked && onSelect(menuItem.tabKey)}
            >
                <span class="bottom-menu-icon-slot" aria-hidden="true">
                    <img class="bottom-menu-icon" src={menuItem.iconSrc} alt="" />
                    {#if isLocked}
                        <span class="bottom-menu-lock-badge">🔒</span>
                    {/if}
                </span>
                <span class="bottom-menu-label">{menuItem.label}</span>
            </button>
        {/each}
    </div>
</nav>

<style>
    .bottom-menu {
        position: absolute;
        left: var(--dom-frame-left, 0px);
        bottom: calc(1920px - var(--dom-ui-bottom, 1920px));
        z-index: 1;
        width: var(--dom-frame-width, 1080px);
        aspect-ratio: 1440 / 330;
        overflow: overflow;
        pointer-events: none;
    }

    .bottom-menu-frame {
        position: absolute;
        left: 0;
        top: 0;
        display: block;
        width: 100%;
        height: auto;
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
        /* padding-inline: 0%; */
    }

    .bottom-menu-button {
        position: relative;
        isolation: isolate;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        gap: 0;
        min-width: 0;
        margin: 0;
        padding: 0;
        padding-top: 9%;
        border: 0;
        background: transparent;
        color: #fff;
        paint-order: stroke fill;
        -webkit-text-stroke: 9px #8e5c04;
        font-family: "MabinogiClassic", sans-serif;
        font-size: 36px;
        font-weight: 400;
        line-height: 1;
        text-align: center;
        /* text-shadow: 0 2px 4px rgba(0, 0, 0, 0.55); */
        cursor: pointer;
        pointer-events: auto;
        touch-action: manipulation;
        transform: translateY(calc(60% + -65px)) scale(1);
        transform-origin: center 62%;
        transition: transform 110ms ease-out, filter 110ms ease-out;
        will-change: transform;
    }

    .bottom-menu-button:disabled {
        cursor: not-allowed;
    }

    .bottom-menu-button-pressed {
        transform: translateY(calc(57% - 65px)) scale(0.9);
        transition-duration: 70ms;
    }

    .bottom-menu-icon-slot {
        position: relative;
        z-index: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 82px;
        height: 72px;
        margin-bottom: 2px;
        pointer-events: none;
    }

    .bottom-menu-icon {
        position: relative;
        z-index: 0;
        display: block;
        width: 100px;
        height: 100px;
        object-fit: contain;
        pointer-events: none;
        user-select: none;
        -webkit-user-drag: none;
    }

    .bottom-menu-lock-badge {
        position: absolute;
        z-index: 1;
        left: 50%;
        top: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 72px;
        height: 72px;
        border: 4px solid rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        background: rgba(28, 21, 16, 0.72);
        font-size: 38px;
        line-height: 1;
        transform: translate(-50%, -50%);
        -webkit-text-stroke: 0;
        pointer-events: none;
    }

    .bottom-menu-label {
        position: relative;
        z-index: 2;
        display: block;
        height: 38px;
        line-height: 38px;
        pointer-events: none;
    }

    .bottom-menu-button-active {
        color: #ffe6ba;
        -webkit-text-stroke-color: #5b3900;
        filter: drop-shadow(0 4px 4px rgba(0, 0, 0, 0.25));
    }

    .bottom-menu-button-locked {
        color: rgba(255, 255, 255, 0.55);
        -webkit-text-stroke-color: rgba(82, 72, 63, 0.9);
        filter: grayscale(1) brightness(0.62);
    }

    .bottom-menu-button-locked .bottom-menu-icon {
        opacity: 0.5;
    }

</style>
