<svelte:head>
    <title>Dustimo</title>
</svelte:head>

<slot />

<style>
    :global(html) {
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        background-color: #333;
        overflow: hidden;
        touch-action: none;
        -webkit-text-size-adjust: 100%;
    }

    @supports (-webkit-touch-callout: none) {
        :global(html) {
            height: -webkit-fill-available;
        }
    }

    :global(body) {
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
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

    @supports (-webkit-touch-callout: none) {
        :global(body) {
            height: -webkit-fill-available;
            min-height: -webkit-fill-available;
        }
    }

    :global(*) {
        box-sizing: border-box;
    }
</style>