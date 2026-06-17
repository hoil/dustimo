<svelte:head>
    <title>Dustimo</title>
</svelte:head>

<slot />

<style>
    :global(html) {
        width: 100%;
        height: 100%;
        background-color: #333;
        overflow: hidden;
        touch-action: none;
        -webkit-text-size-adjust: 100%;
    }

    :global(body) {
        width: 100%;
        min-height: 100%;
        margin: 0;
        padding: 0;
        color: rgba(255, 255, 255, 0.87);
        background-color: #333;
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
</style>