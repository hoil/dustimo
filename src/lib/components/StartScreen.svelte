<script lang="ts">

    export let onGuestPlay: () => void;
    export let onLoginPlay: () => void;

</script>

<div class="start-frame-background"></div>
<div class="dom-coordinate-layer start-coordinate-layer">
    <div class="start-content">
        <img class="start-logo" src="/assets/logo.png" alt="logo" width="1000" height="750" />
        <img class="start-character" src="/assets/character.png" alt="" width="600" height="600" aria-hidden="true" />
        <div class="start-buttons">
            <button class="start-button" type="button" onclick={onGuestPlay}>
                <span class="start-button-label">바로 플레이</span>
            </button>
            <button class="start-button start-button-secondary" type="button" onclick={onLoginPlay}>
                <span class="start-button-label">로그인하고 플레이</span>
            </button>
        </div>
    </div>
    <div class="start-copyright">© 2026 Twile. All Rights Reserved.</div>
</div>

<style>
    .start-coordinate-layer {
        z-index: 30;
    }

    .start-frame-background {
        position: absolute;
        inset: 0;
        z-index: 25;
        background-image: url("/assets/bg.png");
        background-position: center;
        background-size: cover;
        background-repeat: no-repeat;
        pointer-events: none;
    }

    .start-content {
        position: absolute;
        left: 0;
        top: 0;
        width: 1080px;
        height: 1920px;
        color: #ffffff;
        pointer-events: none;
    }

    .start-logo {
        position: absolute;
        z-index: 2;
        left: 50%;
        top: 900px;
        transform: translate(-50%, -50%);
        display: block;
        animation: start-logo-floating 3.6s ease-in-out infinite;
        will-change: transform;
    }

    @keyframes start-logo-floating {
        0%,
        100% {
            transform: translate(-50%, -50%);
        }

        50% {
            transform: translate(-50%, calc(-50% - 50px));
        }
    }

    .start-character {
        position: absolute;
        left: calc(50%);
        top: 500px;
        z-index: 0;
        width: 520px;
        height: 520px;
        transform: translate(-50%, -50%);
        display: block;
        animation: start-character-floating 3.2s ease-in-out infinite;
        will-change: transform;
        pointer-events: none;
    }

    @keyframes start-character-floating {
        0%,
        100% {
            transform: translate(-50%, -50%);
        }

        50% {
            transform: translate(-50%, calc(-50% - 20px));
        }
    }

    .start-buttons {
        position: absolute;
        left: 50%;
        top: 1200px;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 760px;
        transform: translateX(-50%);
        pointer-events: none;
    }

    .start-button {
        position: relative;
        isolation: isolate;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 620px;
        height: 191px;
        margin: 0 0 0px;
        padding: 0 48px;
        border: 0;
        background-color: transparent;
        color: #ffffff;
        font-size: 42px;
        font-weight: 800;
        line-height: 1;
        cursor: pointer;
        pointer-events: auto;
        paint-order: stroke fill;
        -webkit-text-stroke: 10px #1b3a02;
    }

    .start-button::before {
        content: "";
        position: absolute;
        inset: 0;
        z-index: -1;
        background-image: url("/assets/button.png");
        background-position: center;
        background-size: 100% 100%;
        background-repeat: no-repeat;
        pointer-events: none;
    }

    .start-button-secondary {
        -webkit-text-stroke: 10px rgb(73, 47, 0);
    }

    .start-button-secondary::before {
        filter: sepia(1) saturate(3.4) hue-rotate(350deg) brightness(1.08);
    }

    .start-button-label {
        position: relative;
        z-index: 1;
        font-family: "MabinogiClassic", sans-serif;
        font-weight: 400;
    }

    .start-copyright {
        position: absolute;
        left: var(--dom-frame-left, 0px);
        top: calc(var(--dom-frame-bottom, 1920px) - var(--dom-safe-bottom, 0px) - 120px);
        width: var(--dom-frame-width, 1080px);
        color: #ffffff;
        font-size: 32px;
        font-weight: 800;
        line-height: 1;
        text-align: center;
        /* text-shadow:
            -2px -2px 0 #000000,
            2px -2px 0 #000000,
            -2px 2px 0 #000000,
            2px 2px 0 #000000,
            0 3px 2px rgba(0, 0, 0, 1.55); */
        -webkit-text-stroke: 7px black; /* 두께와 색상 지정 */
        paint-order: stroke fill;
        pointer-events: none;
    }
</style>
