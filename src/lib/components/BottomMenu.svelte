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
        src="/assets/bottom_menu/frame.png"
        alt=""
        width="1440"
        height="782"
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
                    <img class="bottom-menu-icon" src={menuItem.iconSrc} alt="" />
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

    .bottom-menu-button-pressed {
        transform: translateY(calc(57% - 65px)) scale(0.9);
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
        display: block;
        width: 100px;
        height: 100px;
        object-fit: contain;
        pointer-events: none;
        user-select: none;
        -webkit-user-drag: none;
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

</style>
