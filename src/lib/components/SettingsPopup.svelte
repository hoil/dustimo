<script lang="ts">

    export let title = "설정 팝업";
    export let message = "설정팝업입니다.";
    export let onClose: () => void;

</script>

<div class="dom-coordinate-layer settings-popup-coordinate-layer">
    <button class="settings-popup-dim" type="button" aria-label="설정 팝업 닫기" onclick={onClose}></button>
    <section class="settings-popup" role="dialog" aria-modal="true" aria-label={title}>
        <button class="settings-popup-close-button" type="button" aria-label="설정 팝업 닫기" onclick={onClose}>
            ×
        </button>
        <div class="settings-popup-content">
            <h2 class="settings-popup-title">{title}</h2>
            <p class="settings-popup-message">{message}</p>
        </div>
    </section>
</div>

<style>
    .settings-popup-coordinate-layer {
        z-index: 100;
    }

    .settings-popup-dim {
        position: absolute;
        left: var(--dom-frame-left, 0px);
        top: var(--dom-frame-top, 0px);
        width: var(--dom-frame-width, 1080px);
        height: var(--dom-frame-height, 1920px);
        padding: 0;
        border: 0;
        background: rgba(0, 0, 0, 0.58);
        cursor: default;
        pointer-events: auto;
        touch-action: manipulation;
    }

    .settings-popup {
        position: absolute;
        left: 140px;
        top: 560px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        width: 800px;
        height: 640px;
        padding: 120px 80px;
        border: 8px solid #8e5c04;
        border-radius: 56px;
        background: rgba(255, 248, 226, 0.98);
        box-shadow: 0 20px 34px rgba(0, 0, 0, 0.24);
        color: #4a2b17;
        font-family: "TmoneyRoundWind", sans-serif;
        pointer-events: auto;
        transform-origin: center;
        animation: settings-popup-scale-in 260ms cubic-bezier(0.18, 0.89, 0.32, 1.28) both;
    }

    @keyframes settings-popup-scale-in {
        from {
            opacity: 0;
            transform: scale(0.5);
        }

        to {
            opacity: 1;
            transform: scale(1);
        }
    }

    .settings-popup-close-button {
        position: absolute;
        right: 36px;
        top: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 92px;
        height: 92px;
        padding: 0;
        border: 6px solid #ffffff;
        border-radius: 50%;
        background: rgba(74, 43, 23, 0.96);
        box-shadow: 0 10px 16px rgba(0, 0, 0, 0.22);
        color: #ffffff;
        font-family: Arial, sans-serif;
        font-size: 70px;
        font-weight: 800;
        line-height: 1;
        cursor: pointer;
        pointer-events: auto;
        touch-action: manipulation;
    }

    .settings-popup-message {
        margin: 44px 0 0;
        font-size: 54px;
        font-weight: 800;
        line-height: 1.25;
        text-align: center;
        word-break: keep-all;
    }

    .settings-popup-content {
        max-width: 620px;
        text-align: center;
    }

    .settings-popup-title {
        margin: 0;
        font-size: 64px;
        font-weight: 800;
        line-height: 1.12;
    }
</style>