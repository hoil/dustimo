<script lang="ts">

    export let progress: number;

    $: loadingPercent = Math.round(progress * 100);
    $: loadingBarWidth = `${loadingPercent}%`;

</script>

<div class="loading-frame-cover"></div>
<div class="dom-coordinate-layer loading-coordinate-layer" aria-live="polite">
    <div class="loading-overlay">
        <div class="loading-title">Loading</div>
        <div class="loading-bar-track" aria-label="loading progress">
            <div class="loading-bar-fill" style={`width: ${loadingBarWidth}`}></div>
        </div>
        <div class="loading-percent">{loadingPercent}%</div>
    </div>
</div>

<style>
    .loading-frame-cover {
        position: absolute;
        inset: 0;
        z-index: 39;
        background-image: url("/assets/bg.png");
        background-position: center;
        background-size: cover;
        background-repeat: no-repeat;
        pointer-events: auto;
    }

    .loading-coordinate-layer {
        z-index: 40;
    }

    .loading-overlay {
        position: absolute;
        left: var(--dom-frame-left, 0px);
        top: var(--dom-frame-top, 0px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: var(--dom-frame-width, 1080px);
        height: var(--dom-frame-height, 1920px);
        background: transparent;
        color: #000;
        font-family: Arial, sans-serif;
        pointer-events: auto;
    }

    .loading-title {
        margin-bottom: 48px;
        font-size: 64px;
        font-weight: 800;
        letter-spacing: 2px;
    }

    .loading-bar-track {
        width: 560px;
        height: 36px;
        padding: 4px;
        border: 4px solid #111111;
        border-radius: 999px;
        background: #ffffff;
        overflow: hidden;
    }

    .loading-bar-fill {
        width: 0;
        height: 100%;
        border-radius: 999px;
        background: #111111;
    }

    .loading-percent {
        margin-top: 24px;
        font-size: 36px;
        font-weight: 700;
    }
</style>
