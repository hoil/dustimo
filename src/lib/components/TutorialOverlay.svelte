<script lang="ts">

    import { onDestroy, onMount } from "svelte";

    export let message: string;
    export let onClose: () => void;

    const typingIntervalMs = 80;

    let typedMessage = "";
    let typingIntervalId: number | null = null;

    const clearTyping = () => {

        if (typingIntervalId !== null)
        {

            clearInterval(typingIntervalId);
            typingIntervalId = null;

        }

    };

    const startTyping = () => {

        const characters = Array.from(message);
        let characterIndex = 0;

        clearTyping();
        typedMessage = "";
        typingIntervalId = window.setInterval(() => {

            typedMessage += characters[characterIndex] ?? "";
            characterIndex += 1;

            if (characterIndex >= characters.length)
            {

                clearTyping();

            }

        }, typingIntervalMs);

    };

    onMount(startTyping);
    onDestroy(clearTyping);

</script>

<div class="dom-coordinate-layer tutorial-coordinate-layer">
    <div class="tutorial-dim" aria-hidden="true"></div>
    <section class="tutorial-guide" aria-label="튜토리얼 안내">
        <img
            class="tutorial-bean"
            src="/assets/tutorial_bean.png"
            alt="튜토리얼콩"
            width="400"
            height="400"
        />
        <div class="tutorial-dialog" role="dialog" aria-label="튜토리얼콩 대화">
            <div class="tutorial-dialog-text" aria-live="polite">{typedMessage}</div>
            <button class="tutorial-close-button" type="button" onclick={onClose}>
                확인
            </button>
        </div>
    </section>
</div>

<style>
    .tutorial-coordinate-layer {
        z-index: 90;
    }

    .tutorial-dim {
        position: absolute;
        left: var(--dom-frame-left, 0px);
        top: var(--dom-frame-top, 0px);
        width: var(--dom-frame-width, 1080px);
        height: var(--dom-frame-height, 1920px);
        background: rgba(0, 0, 0, 0.58);
        pointer-events: auto;
    }

    .tutorial-guide {
        position: absolute;
        left: calc(var(--dom-ui-left, 0px) + 62px);
        top: calc(var(--dom-ui-top, 0px) + 212px);
        display: flex;
        align-items: flex-start;
        gap: 26px;
        pointer-events: none;
    }

    .tutorial-bean {
        flex: 0 0 auto;
        width: 300px;
        height: 300px;
        object-fit: contain;
        animation: tutorial-bean-floating 2.8s ease-in-out infinite;
        filter: drop-shadow(0 16px 18px rgba(0, 0, 0, 0.26));
        pointer-events: none;
    }

    @keyframes tutorial-bean-floating {
        0%,
        100% {
            transform: translateY(0) rotate(-3deg);
        }

        50% {
            transform: translateY(-28px) rotate(3deg);
        }
    }

    .tutorial-dialog {
        position: relative;
        width: min(600px, calc(var(--dom-ui-width, 1080px) - 330px));
        min-height: 176px;
        margin-top: 20px;
        padding: 34px 34px 30px;
        border: 6px solid #8e5c04;
        border-radius: 28px;
        background: rgba(255, 251, 231, 0.98);
        box-shadow: 0 16px 32px rgba(0, 0, 0, 0.22);
        color: #4c3300;
        font-family: "TmoneyRoundWind", sans-serif;
        pointer-events: auto;
    }

    .tutorial-dialog::before {
        content: "";
        position: absolute;
        left: -28px;
        top: 58px;
        width: 44px;
        height: 44px;
        border-left: 6px solid #8e5c04;
        border-bottom: 6px solid #8e5c04;
        background: rgba(255, 251, 231, 0.98);
        transform: rotate(45deg);
    }

    .tutorial-dialog-text {
        position: relative;
        z-index: 1;
        min-height: 56px;
        max-width: 100%;
        font-size: 30px;
        font-weight: 800;
        line-height: 1.32;
        word-break: keep-all;
    }

    .tutorial-close-button {
        position: relative;
        z-index: 1;
        display: block;
        min-width: 150px;
        margin: 28px 0 0 auto;
        padding: 18px 26px;
        border: 0;
        border-radius: 999px;
        background: #8e5c04;
        color: #ffffff;
        font-family: "TmoneyRoundWind", sans-serif;
        font-size: 30px;
        font-weight: 800;
        line-height: 1;
        cursor: pointer;
        pointer-events: auto;
        touch-action: manipulation;
    }
</style>
