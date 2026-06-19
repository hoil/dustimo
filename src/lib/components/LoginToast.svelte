<script lang="ts">

    export let hash: string;
    export let toastKey: number;

</script>

<div class="dom-coordinate-layer login-toast-coordinate-layer" aria-live="polite">
    {#key toastKey}
        <div class="login-toast" aria-label={`${hash} 계정으로 로그인되었습니다.`}>
            <span class="login-toast-hash">{hash}</span>
            <span class="login-toast-suffix">계정으로 로그인되었습니다.</span>
        </div>
    {/key}
</div>

<style>
    .login-toast-coordinate-layer {
        z-index: 100;
    }

    .login-toast {
        position: absolute;
        left: var(--dom-ui-center-x, 540px);
        top: calc(var(--dom-frame-top, 0px) + var(--dom-safe-top, 0px) + 84px);
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        max-width: calc(var(--dom-ui-width, 1080px) - 300px);
        padding: 24px 34px;
        border: 4px solid rgba(255, 255, 255, 0.9);
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.78);
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.24);
        color: #ffffff;
        font-family: "TmoneyRoundWind", sans-serif;
        font-size: 34px;
        font-weight: 400;
        line-height: 1.2;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        pointer-events: none;
        opacity: 0;
        animation: login-toast-alpha 2.6s ease-in-out forwards;
    }

    .login-toast-hash {
        flex: 0 1 auto;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .login-toast-suffix {
        flex: 0 0 auto;
        white-space: nowrap;
    }

    @keyframes login-toast-alpha {
        0% {
            opacity: 0;
        }

        16%,
        78% {
            opacity: 1;
        }

        100% {
            opacity: 0;
        }
    }
</style>
