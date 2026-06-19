<script lang="ts">

    import type { BottomMenuItem, MainTabKey } from "../navigation";

    export let items: BottomMenuItem[];
    export let activeTab: MainTabKey;
    export let pressedTab: MainTabKey | null;
    export let onSelect: (tabKey: MainTabKey) => void;
    export let onPress: (tabKey: MainTabKey) => void;
    export let onRelease: (tabKey: MainTabKey) => void;

</script>

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
        {#each items as menuItem}
            <button
                class={`bottom-menu-button ${activeTab === menuItem.tabKey ? "bottom-menu-button-active" : ""} ${pressedTab === menuItem.tabKey ? "bottom-menu-button-pressed" : ""}`}
                type="button"
                aria-pressed={activeTab === menuItem.tabKey}
                onpointerdown={() => onPress(menuItem.tabKey)}
                onpointerup={() => onRelease(menuItem.tabKey)}
                onpointerleave={() => onRelease(menuItem.tabKey)}
                onpointercancel={() => onRelease(menuItem.tabKey)}
                onblur={() => onRelease(menuItem.tabKey)}
                onclick={() => onSelect(menuItem.tabKey)}
            >
                <span class="bottom-menu-icon-slot" aria-hidden="true">
                    <span class={`bottom-menu-icon ${menuItem.iconClass}`}></span>
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
        font-family: "TmoneyRoundWind", sans-serif;
        font-size: 34px;
        font-weight: 400;
        line-height: 1;
        text-align: center;
        /* text-shadow: 0 2px 4px rgba(0, 0, 0, 0.55); */
        cursor: pointer;
        pointer-events: auto;
        touch-action: manipulation;
        transform: translateY(calc(50% - 70px)) scale(1);
        transform-origin: center 62%;
        transition: transform 110ms ease-out, filter 110ms ease-out;
        will-change: transform;
    }

    .bottom-menu-button-pressed {
        transform: translateY(calc(47% - 70px)) scale(0.9);
        transition-duration: 70ms;
    }

    .bottom-menu-icon-slot {
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
        display: block;
        width: 58px;
        height: 58px;
        border: 7px solid #8e5c04;
        background: #ffe6ba;
        box-shadow: 0 7px 0 rgba(91, 57, 0, 0.32);
        pointer-events: none;
        transition: border-color 110ms ease-out, background-color 110ms ease-out, box-shadow 110ms ease-out;
    }

    .bottom-menu-icon-roster {
        border-radius: 50%;
    }

    .bottom-menu-icon-farm {
        border-radius: 16px;
        transform: rotate(45deg) scale(0.86);
    }

    .bottom-menu-icon-battle {
        width: 68px;
        height: 50px;
        clip-path: polygon(50% 0, 100% 100%, 0 100%);
    }

    .bottom-menu-icon-plaza {
        border-radius: 18px 18px 8px 8px;
    }

    .bottom-menu-icon-shop {
        border-radius: 14px;
    }

    .bottom-menu-label {
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

    .bottom-menu-button-active .bottom-menu-icon {
        border-color: #5b3900;
        background: #fff3cc;
        box-shadow: 0 7px 0 rgba(50, 31, 0, 0.36);
    }
</style>
