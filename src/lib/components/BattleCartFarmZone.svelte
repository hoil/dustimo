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
        <div class="cart-farm-zone-title">수레파밍존</div>
        <div class="cart-farm-zone-cart" aria-hidden="true">
            <div class="cart-body"></div>
            <div class="cart-wheel cart-wheel-left"></div>
            <div class="cart-wheel cart-wheel-right"></div>
        </div>
        <p class="cart-farm-zone-description">
            DOM UI 영역<br />
            전투 보상/수레 파밍 인터랙션 배치 예정
        </p>
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
        box-sizing: border-box;
        height: 100%;
        padding: 96px 72px 420px;
        color: #fff4d7;
        text-align: center;
        pointer-events: none;
    }

    .cart-farm-zone-title {
        font-size: 64px;
        line-height: 1;
        text-shadow: 0 8px 0 rgba(0, 0, 0, 0.28);
        -webkit-text-stroke: 8px #5b350f;
        paint-order: stroke fill;
    }

    .cart-farm-zone-cart {
        position: relative;
        width: 520px;
        height: 300px;
        margin-top: 120px;
    }

    .cart-body {
        position: absolute;
        left: 50%;
        top: 48px;
        width: 430px;
        height: 170px;
        border: 10px solid #633914;
        border-radius: 36px 36px 54px 54px;
        background: #c87b2f;
        box-shadow: inset 0 -24px 0 rgba(83, 43, 14, 0.25), 0 18px 0 rgba(0, 0, 0, 0.18);
        transform: translateX(-50%) skewX(-8deg);
    }

    .cart-wheel {
        position: absolute;
        bottom: 18px;
        width: 104px;
        height: 104px;
        border: 12px solid #4b2a13;
        border-radius: 50%;
        background: #a55f26;
        box-shadow: inset 0 0 0 16px #f4bf63;
    }

    .cart-wheel-left {
        left: 112px;
    }

    .cart-wheel-right {
        right: 112px;
    }

    .cart-farm-zone-description {
        margin: 86px 0 0;
        color: rgba(255, 244, 215, 0.88);
        font-size: 38px;
        line-height: 1.45;
        text-shadow: 0 4px 0 rgba(0, 0, 0, 0.22);
    }
</style>
