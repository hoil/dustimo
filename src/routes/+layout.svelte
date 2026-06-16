<svelte:head>
    <title>Phaser Svelte Template</title>
</svelte:head>

<slot />

<style>
    :global(html) {
        width: 100%;
        height: 100%;
        background-color: #000000;
        overflow: hidden;
    }

    :global(body) {
        width: 100%;
        min-height: 100%;
        margin: 0;
        padding: 0;
        color: rgba(255, 255, 255, 0.87);
        background-color: #000000;
        font-family: Arial, Helvetica, sans-serif;
        overflow: hidden;
        overscroll-behavior: none;
    }

    :global(*) {
        box-sizing: border-box;
    }
</style>