<svelte:head>
    <title>콩생역전</title>
</svelte:head>

<slot />

<style>
    @font-face {
        font-family: "TmoneyRoundWind";
        src: url("/assets/fonts/TmoneyRoundWind/TmoneyRoundWindRegular.woff") format("woff");
        font-weight: 400;
        font-style: normal;
        font-display: swap;
    }

    @font-face {
        font-family: "TmoneyRoundWind";
        src: url("/assets/fonts/TmoneyRoundWind/TmoneyRoundWindExtraBold.woff") format("woff");
        font-weight: 800;
        font-style: normal;
        font-display: swap;
    }

    :global(html) {
        width: 100vw;
        height: 100vh;
        height: 100lvh;
        min-height: calc(100lvh + env(safe-area-inset-bottom, 0px));
        background-color: #1a1918;
        overflow: hidden;
        touch-action: none;
        -webkit-text-size-adjust: 100%;
    }

    :global(body) {
        width: 100vw;
        height: 100vh;
        height: 100lvh;
        min-height: calc(100lvh + env(safe-area-inset-bottom, 0px));
        margin: 0;
        padding: 0;
        color: rgba(255, 255, 255, 0.87);
        background-color: #1a1918;
        font-family: Arial, Helvetica, sans-serif;
        overflow: hidden;
        overscroll-behavior: none;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
    }

    :global(*) {
        box-sizing: border-box;
    }

    :global(*) {
        -webkit-tap-highlight-color: transparent;
    }

    :global(*:focus),
    :global(*:focus-visible),
    :global(*:active) {
        outline: none;
        box-shadow: none;
    }

    :global(button) {
        -webkit-tap-highlight-color: transparent;
        -webkit-appearance: none;
        appearance: none;
        outline: none;
    }
</style>