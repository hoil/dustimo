<script lang="ts">

    export let onClose: () => void;

</script>

<div class="dom-coordinate-layer popup-coordinate-layer">
    <div class="popup-dim" aria-hidden="true"></div>
    <section class="test-popup" role="dialog" aria-modal="true" aria-label="테스트 팝업">
        <div class="popup-background" aria-hidden="true">
            <svg class="popup-slice popup-slice-top-left" viewBox="0 0 100 160" preserveAspectRatio="none">
                <image href="/assets/common/popup.png" width="1000" height="333" />
            </svg>
            <svg class="popup-slice popup-slice-top" viewBox="100 0 800 160" preserveAspectRatio="none">
                <image href="/assets/common/popup.png" width="1000" height="333" />
            </svg>
            <svg class="popup-slice popup-slice-top-right" viewBox="900 0 100 160" preserveAspectRatio="none">
                <image href="/assets/common/popup.png" width="1000" height="333" />
            </svg>
            <svg class="popup-slice popup-slice-left" viewBox="0 160 100 13" preserveAspectRatio="none">
                <image href="/assets/common/popup.png" width="1000" height="333" />
            </svg>
            <svg class="popup-slice popup-slice-center" viewBox="100 160 800 13" preserveAspectRatio="none">
                <image href="/assets/common/popup.png" width="1000" height="333" />
            </svg>
            <svg class="popup-slice popup-slice-right" viewBox="900 160 100 13" preserveAspectRatio="none">
                <image href="/assets/common/popup.png" width="1000" height="333" />
            </svg>
            <svg class="popup-slice popup-slice-bottom-left" viewBox="0 173 100 160" preserveAspectRatio="none">
                <image href="/assets/common/popup.png" width="1000" height="333" />
            </svg>
            <svg class="popup-slice popup-slice-bottom" viewBox="100 173 800 160" preserveAspectRatio="none">
                <image href="/assets/common/popup.png" width="1000" height="333" />
            </svg>
            <svg class="popup-slice popup-slice-bottom-right" viewBox="900 173 100 160" preserveAspectRatio="none">
                <image href="/assets/common/popup.png" width="1000" height="333" />
            </svg>
        </div>
        <button class="popup-close-button" type="button" aria-label="팝업 닫기" onclick={onClose}>
            ×
        </button>
        <div class="popup-content">
            <h2 class="popup-title">테스트 팝업</h2>
            <p class="popup-description">
                초기 접속 팝업 플로우 테스트입니다.<br />
                우선순위 순서대로 팝업을 띄우는 DOM UI 구조로 동작합니다.
            </p>
        </div>
    </section>
</div>

<style>
    .popup-coordinate-layer {
        z-index: 100;
    }

    .popup-dim {
        position: absolute;
        left: var(--dom-frame-left, 0px);
        top: var(--dom-frame-top, 0px);
        width: var(--dom-frame-width, 1080px);
        height: var(--dom-frame-height, 1920px);
        background: rgba(0, 0, 0, 0.58);
        pointer-events: auto;
    }

    .test-popup {
        position: absolute;
        left: var(--dom-popup-left, 0px);
        top: var(--dom-popup-top, 0px);
        box-sizing: border-box;
        width: var(--dom-popup-width, 1080px);
        height: var(--dom-popup-height, 1920px);
        color: #4a2b17;
        font-family: "TmoneyRoundWind", sans-serif;
        pointer-events: auto;
        transform-origin: center;
        animation: popup-scale-in 300ms cubic-bezier(0.18, 0.89, 0.32, 1.28) both;
    }

    .popup-background {
        --popup-slice-left: 100px;
        --popup-slice-right: 100px;
        --popup-slice-top: 160px;
        --popup-slice-bottom: 160px;
        --popup-slice-overlap: 2px;

        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
    }

    .popup-slice {
        position: absolute;
        display: block;
        pointer-events: none;
        shape-rendering: geometricPrecision;
    }

    .popup-slice-top-left {
        left: 0;
        top: 0;
        width: calc(var(--popup-slice-left) + var(--popup-slice-overlap));
        height: calc(var(--popup-slice-top) + var(--popup-slice-overlap));
    }

    .popup-slice-top {
        left: calc(var(--popup-slice-left) - var(--popup-slice-overlap));
        top: 0;
        width: calc(100% - var(--popup-slice-left) - var(--popup-slice-right) + var(--popup-slice-overlap) * 2);
        height: calc(var(--popup-slice-top) + var(--popup-slice-overlap));
    }

    .popup-slice-top-right {
        right: 0;
        top: 0;
        width: calc(var(--popup-slice-right) + var(--popup-slice-overlap));
        height: calc(var(--popup-slice-top) + var(--popup-slice-overlap));
    }

    .popup-slice-left {
        left: 0;
        top: calc(var(--popup-slice-top) - var(--popup-slice-overlap));
        width: calc(var(--popup-slice-left) + var(--popup-slice-overlap));
        height: calc(100% - var(--popup-slice-top) - var(--popup-slice-bottom) + var(--popup-slice-overlap) * 2);
    }

    .popup-slice-center {
        left: calc(var(--popup-slice-left) - var(--popup-slice-overlap));
        top: calc(var(--popup-slice-top) - var(--popup-slice-overlap));
        width: calc(100% - var(--popup-slice-left) - var(--popup-slice-right) + var(--popup-slice-overlap) * 2);
        height: calc(100% - var(--popup-slice-top) - var(--popup-slice-bottom) + var(--popup-slice-overlap) * 2);
    }

    .popup-slice-right {
        right: 0;
        top: calc(var(--popup-slice-top) - var(--popup-slice-overlap));
        width: calc(var(--popup-slice-right) + var(--popup-slice-overlap));
        height: calc(100% - var(--popup-slice-top) - var(--popup-slice-bottom) + var(--popup-slice-overlap) * 2);
    }

    .popup-slice-bottom-left {
        left: 0;
        bottom: 0;
        width: calc(var(--popup-slice-left) + var(--popup-slice-overlap));
        height: calc(var(--popup-slice-bottom) + var(--popup-slice-overlap));
    }

    .popup-slice-bottom {
        left: calc(var(--popup-slice-left) - var(--popup-slice-overlap));
        bottom: 0;
        width: calc(100% - var(--popup-slice-left) - var(--popup-slice-right) + var(--popup-slice-overlap) * 2);
        height: calc(var(--popup-slice-bottom) + var(--popup-slice-overlap));
    }

    .popup-slice-bottom-right {
        right: 0;
        bottom: 0;
        width: calc(var(--popup-slice-right) + var(--popup-slice-overlap));
        height: calc(var(--popup-slice-bottom) + var(--popup-slice-overlap));
    }

    @keyframes popup-scale-in {
        from {
            opacity: 0;
            transform: scale(0.4);
        }

        to {
            opacity: 1;
            transform: scale(1);
        }
    }

    .popup-close-button {
        position: absolute;
        right: 100px;
        top: 130px;
        z-index: 2;
        display: flex;
        flex: 0 0 auto;
        align-items: center;
        justify-content: center;
        width: 104px;
        min-width: 104px;
        max-width: 104px;
        height: 104px;
        padding: 0;
        border: 6px solid #ffffff;
        border-radius: 50%;
        aspect-ratio: 1 / 1;
        background: rgba(74, 43, 23, 0.96);
        box-shadow: 0 12px 18px rgba(0, 0, 0, 0.22);
        color: #ffffff;
        font-family: Arial, sans-serif;
        font-size: 78px;
        font-weight: 800;
        line-height: 1;
        cursor: pointer;
        pointer-events: auto;
        touch-action: manipulation;
    }

    .popup-content {
        position: relative;
        z-index: 1;
        display: flex;
        min-width: 0;
        height: 100%;
        flex-direction: column;
        align-items: center;
        padding-top: 700px;
        text-align: center;
    }

    .popup-title {
        margin: 0;
        font-size: 76px;
        font-weight: 800;
        line-height: 1.08;
    }

    .popup-description {
        max-width: 800px;
        margin: 52px 0 0;
        color: #67472d;
        font-size: 38px;
        font-weight: 800;
        line-height: 1.42;
        word-break: keep-all;
    }
</style>