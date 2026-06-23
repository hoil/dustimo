<script lang="ts">

    export let onOpen: () => void;
    export let isPanelExpanded = true;
    export let onTogglePanel: () => void;
    export let onOpenInbox: () => void;
    export let onOpenTesterThanks: () => void;
    export let onOpenGameSummary: () => void;

</script>

<div class="settings-menu">
    <button class="settings-button" type="button" aria-label="설정 열기" onclick={onOpen}>
        ⚙
    </button>

    <button
        class="settings-panel-toggle-button"
        type="button"
        aria-expanded={isPanelExpanded}
        aria-label={isPanelExpanded ? "바로가기 패널 접기" : "바로가기 패널 펼치기"}
        onclick={onTogglePanel}
    >
        <span aria-hidden="true">{isPanelExpanded ? "▲" : "▼"}</span>
    </button>

    <div class:settings-shortcut-panel-collapsed={!isPanelExpanded} class="settings-shortcut-panel">
        <button class="settings-shortcut-button" type="button" aria-label="인박스 열기" onclick={onOpenInbox}>
            <span aria-hidden="true">📥</span>
        </button>
        <button class="settings-shortcut-button" type="button" aria-label="게임테스터 감사의인사문 팝업 열기" onclick={onOpenTesterThanks}>
            <span aria-hidden="true">🙏</span>
        </button>
        <button class="settings-shortcut-button" type="button" aria-label="콩생역전에 대한 설명요약 열기" onclick={onOpenGameSummary}>
            <span aria-hidden="true">📖</span>
        </button>
    </div>
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
        pointer-events: none;
    }

    .settings-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 120px;
        height: 120px;
        padding: 0;
        border: 6px solid #8e5c04;
        border-radius: 34px;
        background: rgba(255, 248, 226, 0.94);
        box-shadow: 0 7px 13px rgba(0, 0, 0, 0.22);
        color: #4a2b17;
        font-family: "MabinogiClassic", sans-serif;
        font-size: 66px;
        font-weight: 800;
        line-height: 1;
        cursor: pointer;
        pointer-events: auto;
        touch-action: manipulation;
    }

    .settings-button:active {
        transform: translateY(4px);
        box-shadow: 0 4px 7px rgba(0, 0, 0, 0.2);
    }

    .settings-panel-toggle-button {
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        width: 120px;
        height: 69px;
        margin-top: 19px;
        padding: 0;
        border: 6px solid #8e5c04;
        border-radius: 26px;
        background: rgba(255, 248, 226, 0.94);
        box-shadow: 0 7px 13px rgba(0, 0, 0, 0.22);
        color: #4a2b17;
        font-family: "MabinogiClassic", sans-serif;
        font-size: 43px;
        font-weight: 800;
        line-height: 1;
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
        width: 120px;
        max-height: 540px;
        margin-top: 24px;
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
            padding 220ms ease-out,
            border-width 220ms ease-out,
            transform 220ms ease-out;
    }

    .settings-shortcut-panel-collapsed {
        max-height: 0;
        padding-top: 0;
        padding-bottom: 0;
        border-width: 0;
        opacity: 0;
        pointer-events: none;
        transform: translateY(-18px);
    }

    .settings-shortcut-button {
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        width: 120px;
        height: 120px;
        min-height: 120px;
        padding: 0;
        border: 8px solid #8e5c04;
        border-radius: 33px;
        background: #fff7d8;
        box-shadow: 0 7px 0 rgba(91, 57, 0, 0.26);
        color: #4a2b17;
        font-family: "MabinogiClassic", sans-serif;
        font-size: 63px;
        font-weight: 800;
        line-height: 1.18;
        cursor: pointer;
        pointer-events: auto;
        touch-action: manipulation;
    }

    .settings-shortcut-button + .settings-shortcut-button {
        margin-top: 24px;
    }
</style>