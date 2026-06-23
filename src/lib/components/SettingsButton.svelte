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
        width: 112px;
        height: 112px;
        padding: 0;
        border: 6px solid #8e5c04;
        border-radius: 32px;
        background: rgba(255, 248, 226, 0.94);
        box-shadow: 0 10px 18px rgba(0, 0, 0, 0.22);
        color: #4a2b17;
        font-family: Arial, sans-serif;
        font-size: 62px;
        font-weight: 800;
        line-height: 1;
        cursor: pointer;
        pointer-events: auto;
        touch-action: manipulation;
    }

    .settings-button:active {
        transform: translateY(5px);
        box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
    }

    .settings-panel-toggle-button {
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        width: 112px;
        height: 112px;
        margin-top: 18px;
        padding: 0;
        border: 6px solid #8e5c04;
        border-radius: 32px;
        background: rgba(255, 248, 226, 0.94);
        box-shadow: 0 10px 18px rgba(0, 0, 0, 0.22);
        color: #4a2b17;
        font-family: Arial, sans-serif;
        font-size: 54px;
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
        width: 112px;
        max-height: 540px;
        margin-top: 16px;
        overflow: hidden;
        padding: 10px;
        border: 6px solid rgba(126, 82, 12, 0.96);
        border-radius: 34px;
        background: rgba(255, 248, 226, 0.94);
        box-shadow: 0 12px 22px rgba(0, 0, 0, 0.2);
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
        border-width: 0 6px;
        opacity: 0;
        pointer-events: none;
        transform: translateY(-18px);
    }

    .settings-shortcut-button {
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        width: 80px;
        height: 80px;
        min-height: 80px;
        padding: 0;
        border: 5px solid #8e5c04;
        border-radius: 22px;
        background: #fff7d8;
        box-shadow: 0 7px 0 rgba(91, 57, 0, 0.26);
        color: #4a2b17;
        font-family: Arial, sans-serif;
        font-size: 42px;
        font-weight: 800;
        line-height: 1.18;
        cursor: pointer;
        pointer-events: auto;
        touch-action: manipulation;
    }

    .settings-shortcut-button + .settings-shortcut-button {
        margin-top: 16px;
    }
</style>