<script lang="ts">

    import {
        MAX_BATTLE_CART_ITEM_COUNT,
        getBattleCartItemDefinition,
        type BattleCartItem
    } from "../battleCartRewards";

    export let items: readonly BattleCartItem[] = [];
    export let onClaim: () => void;
    export let onClose: () => void = () => {};

    const getItemDefinition = (item: BattleCartItem) => {

        return getBattleCartItemDefinition(item.kind);

    };

    const getItemShortLabel = (item: BattleCartItem) => {

        return getItemDefinition(item).name.replace(/\s*콩상자$/, "").slice(0, 2);

    };

</script>

<div class="cart-claim-popup-layer">
    <button class="cart-claim-dim" type="button" aria-label="수레 아이템 수령 팝업 닫기" onclick={onClose}></button>

    <div class="cart-claim-popup" role="dialog" aria-modal="true" aria-label="수레 아이템 수령">
        <header class="cart-claim-header">
            <div>
                <p class="cart-claim-eyebrow">수레영역</p>
                <h2 class="cart-claim-title">아이템 수령</h2>
            </div>
            <button class="cart-claim-close-button" type="button" aria-label="닫기" onclick={onClose}>×</button>
        </header>

        <div class="cart-claim-count" aria-label={`수레에 쌓인 아이템 ${items.length}개`}>
            {items.length} / {MAX_BATTLE_CART_ITEM_COUNT}
        </div>

        <div class="cart-claim-item-list" aria-label="수령할 아이템 목록">
            {#if items.length === 0}
                <div class="cart-claim-empty">
                    아직 수레에 쌓인 아이템이 없어요.
                </div>
            {:else}
                {#each items as item (item.id)}
                    {@const definition = getItemDefinition(item)}
                    <article
                        class="cart-claim-item-tile"
                        style={`--item-color: ${definition.color}; --item-border-color: ${definition.borderColor};`}
                        aria-label={definition.name}
                    >
                        <div class="cart-claim-item-icon" aria-hidden="true">
                            {getItemShortLabel(item)}
                        </div>
                        <p class="cart-claim-item-name">{definition.name}</p>
                    </article>
                {/each}
            {/if}
        </div>

        <footer class="cart-claim-footer">
            <button
                class="cart-claim-all-button"
                type="button"
                disabled={items.length === 0}
                onclick={onClaim}
            >
                모두 수령
            </button>
        </footer>
    </div>
</div>

<style>
    .cart-claim-popup-layer {
        position: absolute;
        left: var(--dom-frame-left, 0px);
        top: var(--dom-frame-top, 0px);
        z-index: 90;
        width: var(--dom-frame-width, 1080px);
        height: var(--dom-frame-height, 1920px);
        font-family: "MabinogiClassic", sans-serif;
        pointer-events: auto;
    }

    .cart-claim-dim {
        position: absolute;
        inset: 0;
        border: 0;
        background: rgba(0, 0, 0, 0.64);
        cursor: pointer;
        pointer-events: auto;
    }

    .cart-claim-popup {
        position: absolute;
        left: 50%;
        top: calc(50% + 12px);
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        width: 860px;
        max-width: calc(var(--dom-frame-width, 1080px) - 120px);
        height: min(1240px, calc(var(--dom-frame-height, 1920px) - var(--dom-safe-top, 0px) - var(--dom-safe-bottom, 0px) - 260px));
        padding: 42px 42px 36px;
        border: 9px solid #8e5c04;
        border-radius: 44px;
        background:
            radial-gradient(circle at 50% 0%, rgba(255, 233, 153, 0.34), rgba(255, 233, 153, 0) 34%),
            linear-gradient(180deg, #fff4ca 0%, #f2c77a 100%);
        box-shadow:
            inset 0 0 0 6px rgba(121, 69, 18, 0.22),
            0 28px 46px rgba(0, 0, 0, 0.42);
        color: #4a2b17;
        transform: translate(-50%, -50%);
        pointer-events: auto;
    }

    .cart-claim-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 18px;
    }

    .cart-claim-eyebrow {
        margin: 0 0 8px;
        color: rgba(74, 43, 23, 0.68);
        font-size: 28px;
        font-weight: 800;
        letter-spacing: 0.04em;
    }

    .cart-claim-title {
        margin: 0;
        color: #3d2415;
        font-size: 58px;
        line-height: 1;
    }

    .cart-claim-close-button {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 84px;
        height: 84px;
        border: 7px solid #8e5c04;
        border-radius: 26px;
        background: #fff7d8;
        box-shadow: 0 8px 0 rgba(91, 57, 0, 0.26);
        color: #5a3219;
        font-family: "MabinogiClassic", sans-serif;
        font-size: 54px;
        line-height: 1;
        cursor: pointer;
        touch-action: manipulation;
    }

    .cart-claim-count {
        align-self: flex-start;
        margin-bottom: 22px;
        padding: 12px 24px;
        border: 5px solid rgba(142, 92, 4, 0.72);
        border-radius: 999px;
        background: rgba(255, 250, 225, 0.72);
        color: #5b351a;
        font-size: 30px;
        font-weight: 800;
    }

    .cart-claim-item-list {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        align-content: start;
        gap: 18px;
        flex: 1 1 auto;
        min-height: 0;
        padding: 20px;
        border: 7px solid rgba(105, 62, 24, 0.8);
        border-radius: 30px;
        background: rgba(61, 36, 21, 0.18);
        overflow-x: hidden;
        overflow-y: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
    }

    .cart-claim-empty {
        grid-column: 1 / -1;
        display: grid;
        place-items: center;
        min-height: 460px;
        color: rgba(74, 43, 23, 0.72);
        font-size: 34px;
        line-height: 1.35;
        text-align: center;
    }

    .cart-claim-item-tile {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        box-sizing: border-box;
        min-width: 0;
        min-height: 212px;
        padding: 18px 12px 16px;
        border: 6px solid rgba(88, 50, 22, 0.74);
        border-radius: 26px;
        background: rgba(255, 248, 219, 0.88);
        box-shadow: 0 9px 0 rgba(91, 57, 0, 0.14);
    }

    .cart-claim-item-icon {
        display: grid;
        place-items: center;
        box-sizing: border-box;
        width: 104px;
        height: 104px;
        border: 10px solid var(--item-border-color);
        border-radius: 24px;
        background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0) 42%),
            var(--item-color);
        box-shadow: 0 9px 12px rgba(0, 0, 0, 0.22);
        color: rgba(54, 31, 18, 0.82);
        font-size: 26px;
        font-weight: 900;
        line-height: 1;
    }

    .cart-claim-item-name {
        margin: 0;
        max-width: 100%;
        color: #4a2b17;
        font-size: 24px;
        font-weight: 800;
        line-height: 1.18;
        text-align: center;
        word-break: keep-all;
    }

    .cart-claim-footer {
        display: flex;
        justify-content: center;
        flex: 0 0 auto;
        padding-top: 30px;
    }

    .cart-claim-all-button {
        width: 520px;
        height: 116px;
        border: 8px solid #8e5c04;
        border-radius: 36px;
        background: #ffdf3d;
        box-shadow: 0 12px 0 rgba(91, 57, 0, 0.3);
        color: #4a2b17;
        font-family: "MabinogiClassic", sans-serif;
        font-size: 44px;
        font-weight: 900;
        cursor: pointer;
        pointer-events: auto;
        touch-action: manipulation;
    }

    .cart-claim-all-button:disabled {
        cursor: not-allowed;
        filter: grayscale(1);
        opacity: 0.52;
    }
</style>