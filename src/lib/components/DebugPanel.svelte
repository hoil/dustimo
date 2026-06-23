<script lang="ts">

    export let isFpsDebugEnabled: boolean;
    export let isMemoryDebugEnabled: boolean;
    export let isSafeAreaDebugEnabled: boolean;
    export let isFullAreaDebugEnabled: boolean;
    export let debugFpsText: string;
    export let debugMemoryText: string;
    export let gameUid: string;
    export let uidCopyFeedback: string;
    export let onFullAreaChange: (value: boolean) => void;
    export let onCopyUid: () => void;
    export let onResetAccount: () => void;

    let isDebugPopupOpen = false;
    let isAccountResetConfirmOpen = false;

    $: isDebugStatusPanelVisible = isFpsDebugEnabled || isMemoryDebugEnabled;

</script>

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
    onclick={() => isDebugPopupOpen = true}
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
                onclick={() => isDebugPopupOpen = false}
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
                    onchange={(event) => onFullAreaChange(event.currentTarget.checked)}
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
                    onclick={onCopyUid}
                >
                    {uidCopyFeedback || "복사"}
                </button>
            </div>
            <button
                class="account-reset-button"
                type="button"
                onclick={() => isAccountResetConfirmOpen = true}
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
                    onclick={() => isAccountResetConfirmOpen = false}
                >
                    아니요
                </button>
                <button
                    class="account-reset-confirm-button account-reset-confirm-danger-button"
                    type="button"
                    onclick={onResetAccount}
                >
                    예
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
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
        font-family: "MabinogiClassic", sans-serif;
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
        font-family: "MabinogiClassic", sans-serif;
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
        font-family: "MabinogiClassic", sans-serif;
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
