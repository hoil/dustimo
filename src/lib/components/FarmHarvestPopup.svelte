<script lang="ts">

    export let beanImageUrl = "/assets/beans/bean_1.png";
    export let isReturnDisabled = false;
    export let onReturn: () => void = () => {};
    export let onAdd: () => void;

</script>

<div class="dom-coordinate-layer harvest-coordinate-layer">
    <div class="harvest-dim" aria-hidden="true"></div>
    <section class="harvest-popup" role="dialog" aria-modal="true" aria-label="콩 수확">
        <div class="harvest-stage" aria-hidden="true">
            <div class="harvest-sprout">
                <div class="harvest-sprout-stem"></div>
                <div class="harvest-sprout-leaf harvest-sprout-leaf-left"></div>
                <div class="harvest-sprout-leaf harvest-sprout-leaf-right"></div>
                <div class="harvest-sprout-leaf harvest-sprout-leaf-top"></div>
            </div>
            <div class="harvest-burst"></div>
            <img class="harvest-bean" src={beanImageUrl} alt="" draggable="false" />
        </div>

        <div class="harvest-actions">
            <button
                class="harvest-action-button harvest-return-button"
                type="button"
                disabled={isReturnDisabled}
                onclick={onReturn}
            >
                환원하기
            </button>
            <button
                class="harvest-action-button harvest-add-button"
                type="button"
                onclick={onAdd}
            >
                추가하기
            </button>
        </div>
    </section>
</div>

<style>
    .harvest-coordinate-layer {
        z-index: 110;
        pointer-events: auto;
    }

    .harvest-dim {
        position: absolute;
        left: var(--dom-frame-left, 0px);
        top: var(--dom-frame-top, 0px);
        width: var(--dom-frame-width, 1080px);
        height: var(--dom-frame-height, 1920px);
        background: rgba(0, 0, 0, 0.68);
        pointer-events: auto;
    }

    .harvest-popup {
        position: absolute;
        left: 0;
        top: 0;
        width: 1080px;
        height: 1920px;
        font-family: "MabinogiClassic", sans-serif;
        pointer-events: none;
    }

    .harvest-stage {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 420px;
        height: 420px;
        transform: translate(-50%, -50%);
        pointer-events: none;
    }

    .harvest-sprout {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 220px;
        height: 260px;
        transform: translate(-50%, -50%);
        transform-origin: 50% 88%;
        animation:
            harvest-sprout-shake 250ms ease-in-out 0s 8,
            harvest-sprout-pop-out 220ms ease-in 2s forwards;
    }

    .harvest-sprout-stem {
        position: absolute;
        left: 50%;
        bottom: 38px;
        width: 30px;
        height: 142px;
        border: 6px solid #1f7a2d;
        border-radius: 999px;
        background: #3bb14a;
        transform: translateX(-50%);
    }

    .harvest-sprout-leaf {
        position: absolute;
        border: 6px solid #218a31;
        border-radius: 50%;
        background: #58d65f;
    }

    .harvest-sprout-leaf-left {
        left: 18px;
        top: 92px;
        width: 102px;
        height: 58px;
        transform: rotate(-28deg);
    }

    .harvest-sprout-leaf-right {
        right: 18px;
        top: 68px;
        width: 102px;
        height: 58px;
        background: #6ce36f;
        transform: rotate(26deg);
    }

    .harvest-sprout-leaf-top {
        left: 50%;
        top: 14px;
        width: 78px;
        height: 94px;
        background: #49c94f;
        transform: translateX(-50%);
    }

    .harvest-burst {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 120px;
        height: 120px;
        border-radius: 50%;
        background: radial-gradient(circle, #fff9bf 0%, #ffe15a 42%, rgba(255, 160, 29, 0) 72%);
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.25);
        animation: harvest-burst 440ms ease-out 2s forwards;
    }

    .harvest-bean {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 300px;
        height: 300px;
        object-fit: contain;
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.18);
        filter: drop-shadow(0 24px 24px rgba(0, 0, 0, 0.28));
        user-select: none;
        -webkit-user-drag: none;
        animation: harvest-bean-born 520ms cubic-bezier(0.18, 0.89, 0.32, 1.28) 2.05s forwards;
    }

    .harvest-actions {
        position: absolute;
        left: 50%;
        top: calc(50% + 255px);
        display: flex;
        justify-content: center;
        gap: 48px;
        box-sizing: border-box;
        transform: translateX(-50%);
        opacity: 0;
        pointer-events: none;
        animation: harvest-actions-in 220ms ease-out 2.08s forwards;
    }

    .harvest-action-button {
        width: 360px;
        height: 116px;
        border: 7px solid #8e5c04;
        border-radius: 34px;
        background: #fff7d8;
        box-shadow: 0 10px 0 rgba(91, 57, 0, 0.3);
        color: #4a2b17;
        font-family: "MabinogiClassic", sans-serif;
        font-size: 44px;
        font-weight: 800;
        cursor: pointer;
        pointer-events: auto;
        touch-action: manipulation;
    }

    .harvest-add-button {
        background: #ffdf3d;
    }

    .harvest-action-button:disabled {
        cursor: not-allowed;
        filter: grayscale(1);
        opacity: 0.48;
    }

    @keyframes harvest-sprout-shake {
        0%,
        100% {
            transform: translate(-50%, -50%) rotate(-7deg);
        }

        50% {
            transform: translate(-50%, -50%) rotate(7deg);
        }
    }

    @keyframes harvest-sprout-pop-out {
        to {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.35);
        }
    }

    @keyframes harvest-burst {
        0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.25);
        }

        45% {
            opacity: 1;
        }

        100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(3.2);
        }
    }

    @keyframes harvest-bean-born {
        0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.18);
        }

        100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
    }

    @keyframes harvest-actions-in {
        to {
            opacity: 1;
            pointer-events: auto;
        }
    }
</style>