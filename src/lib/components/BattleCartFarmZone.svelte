<script lang="ts">

    import { BATTLE_AREA_BOTTOM_Y } from "../battleLayout";

</script>

<section
    class="cart-farm-zone"
    style={`--battle-area-bottom-y: ${BATTLE_AREA_BOTTOM_Y}px;`}
    aria-label="수레파밍존"
>
    <div class="cart-farm-zone-background" aria-hidden="true"></div>
    <div class="cart-farm-zone-content">
        <img class="cart-farm-zone-wagon" src="/assets/battle/wagon.png" alt="" aria-hidden="true" />
    </div>
</section>

<style>
    .cart-farm-zone {
        position: absolute;
        left: var(--dom-frame-left, 0px);
        top: var(--battle-area-bottom-y);
        z-index: 0;
        box-sizing: border-box;
        width: var(--dom-frame-width, 1080px);
        height: calc(var(--dom-frame-bottom, 1920px) - var(--battle-area-bottom-y));
        overflow: hidden;
        border-top: 8px solid rgba(255, 212, 122, 0.9);
        font-family: "MabinogiClassic", sans-serif;
        pointer-events: auto;
    }

    .cart-farm-zone-background {
        position: absolute;
        inset: 0;
        background:
            radial-gradient(circle at 50% 12%, rgba(255, 231, 165, 0.24) 0, rgba(255, 231, 165, 0) 34%),
            linear-gradient(180deg, rgba(74, 47, 27, 0.96) 0%, rgba(39, 26, 18, 0.98) 100%);
        pointer-events: none;
    }

    .cart-farm-zone-content {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        height: 100%;
        padding: 0 72px;
        pointer-events: none;
    }

    .cart-farm-zone-wagon {
        display: block;
        width: 660px;
        max-width: 86%;
        height: auto;
        object-fit: contain;
        user-select: none;
    }
</style>
