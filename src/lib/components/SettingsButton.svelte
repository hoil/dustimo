<script lang="ts">

    export let onOpen: () => void;
    export let isPanelExpanded = true;
    export let onTogglePanel: () => void;
    export let onOpenInbox: () => void;
    export let onOpenTesterThanks: () => void;

</script>

<div class="settings-menu">
    <button class="settings-button" type="button" aria-label="설정 열기" onclick={onOpen}>
        <img class="settings-icon settings-main-icon" src="/assets/icons/setting.png" alt="" aria-hidden="true" />
    </button>

    <div class:settings-shortcut-panel-collapsed={!isPanelExpanded} class="settings-shortcut-panel">
        <button class="settings-shortcut-button" type="button" aria-label="인박스 열기" onclick={onOpenInbox}>
            <img class="settings-icon settings-shortcut-icon" src="/assets/icons/inbox.png" alt="" aria-hidden="true" />
        </button>
        <button class="settings-shortcut-button" type="button" aria-label="게임테스터 감사의인사문 팝업 열기" onclick={onOpenTesterThanks}>
            <img class="settings-icon settings-shortcut-icon" src="/assets/icons/cone.png" alt="" aria-hidden="true" />
        </button>
    </div>

    <button
        class="settings-panel-toggle-button"
        type="button"
        aria-expanded={isPanelExpanded}
        aria-label={isPanelExpanded ? "바로가기 패널 접기" : "바로가기 패널 펼치기"}
        onclick={onTogglePanel}
    >
        <img
            class:settings-toggle-icon-collapsed={isPanelExpanded}
            class="settings-icon settings-toggle-icon"
            src="/assets/icons/toggle.png"
            alt=""
            aria-hidden="true"
        />
    </button>
</div>

<style>
    .settings-menu {
        position: absolute;
        right: calc(1080px - var(--dom-frame-right, 1080px) + var(--dom-safe-right, 0px) + 32px);
        top: calc(var(--dom-frame-top, 0px) + var(--dom-safe-top, 0px) + 32px);
        z-index: 3;
        display: flex;
        align-items: flex-end;
        flex-direction: column;
        gap: 12px;
        pointer-events: none;
    }

    .settings-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 108px;
        height: 108px;
        padding: 0;
        border: 0;
        background: transparent;
        box-shadow: none;
        cursor: pointer;
        pointer-events: auto;
        touch-action: manipulation;
    }

    .settings-button:active {
        transform: translateY(4px);
    }

    .settings-panel-toggle-button {
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        width: 170px;
        height: 56px;
        margin-right: -31px;
        padding: 0;
        border: 0;
        background: transparent;
        box-shadow: none;
        cursor: pointer;
        pointer-events: auto;
        touch-action: manipulation;
    }

    .settings-panel-toggle-button:active,
    .settings-shortcut-button:active {
        transform: translateY(4px);
    }

    .settings-shortcut-panel {
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        width: 108px;
        max-height: 240px;
        overflow: hidden;
        padding: 0;
        border: 0 solid transparent;
        background: transparent;
        box-shadow: none;
        opacity: 1;
        pointer-events: auto;
        transform: translateY(0);
        transform-origin: top right;
        transition:
            max-height 220ms ease-out,
            opacity 180ms ease-out,
            transform 220ms ease-out;
    }

    .settings-shortcut-panel-collapsed {
        max-height: 0;
        padding-top: 0;
        padding-bottom: 0;
        opacity: 0;
        pointer-events: none;
        transform: translateY(-18px);
    }

    .settings-shortcut-button {
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        width: 108px;
        height: 108px;
        min-height: 108px;
        padding: 0;
        border: 0;
        background: transparent;
        box-shadow: none;
        cursor: pointer;
        pointer-events: auto;
        touch-action: manipulation;
    }

    .settings-icon {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
        pointer-events: none;
        user-select: none;
    }

    .settings-main-icon {
        width: 98px;
        height: 98px;
    }

    .settings-shortcut-icon {
        width: 98px;
        height: 98px;
    }

    .settings-toggle-icon {
        margin-top: 20px;
        width: 140px;
        height: auto;
    }

    .settings-toggle-icon-collapsed {
        transform: rotate(180deg);
    }

    .settings-shortcut-button + .settings-shortcut-button {
        margin-top: 14px;
    }
</style>