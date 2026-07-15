<script lang="ts">

    import { onMount } from "svelte";
    import { EventBus } from "../../game/EventBus";
    import { BATTLE_AREA_BOTTOM_Y } from "../battleLayout";
    import { BATTLE_CART_ITEM_DROP_REQUESTED_EVENT } from "../battleCartRewards";

    type CartItemVariant = {
        color: string;
        borderColor: string;
    };

    type FallingCartItem = CartItemVariant & {
        id: number;
        startX: number;
        landX: number;
        landY: number;
        spillX: number;
        durationMs: number;
        isOverflow: boolean;
    };

    type StackedCartItem = CartItemVariant & {
        id: number;
        x: number;
        y: number;
        rotation: number;
        zIndex: number;
    };

    const MAX_CART_ITEM_COUNT = 10;
    const CART_ITEM_SIZE = 138;
    const CART_ITEM_DROP_DURATION_MS = 1050;
    const CART_ITEM_LAND_Y = -32;
    const SQUAD_FRAME_IDS = [1, 2, 3, 4] as const;
    const EQUIPMENT_SLOTS = [
        { key: "hat", label: "모자", placeholder: "帽" },
        { key: "armor", label: "갑옷", placeholder: "甲" },
        { key: "weapon", label: "무기", placeholder: "劍" }
    ] as const;
    const CART_ITEM_VARIANTS: CartItemVariant[] = [
        { color: "#ffd45f", borderColor: "#9f6424" },
        { color: "#8ee86d", borderColor: "#2e7e31" },
        { color: "#76c8ff", borderColor: "#2d6b9f" },
        { color: "#ff8aa8", borderColor: "#9b3c5b" },
        { color: "#cba2ff", borderColor: "#65439c" }
    ];
    const STACK_SLOTS = [
        { x: -150, y: 126, rotation: -13, zIndex: 40 },
        { x: -50, y: 136, rotation: 8, zIndex: 40 },
        { x: 50, y: 128, rotation: -5, zIndex: 40 },
        { x: 150, y: 138, rotation: 12, zIndex: 40 },
        { x: -100, y: 50, rotation: -9, zIndex: 30 },
        { x: 0, y: 62, rotation: 7, zIndex: 30 },
        { x: 100, y: 54, rotation: -12, zIndex: 30 },
        { x: -50, y: -26, rotation: 11, zIndex: 20 },
        { x: 50, y: -18, rotation: -6, zIndex: 20 },
        { x: 0, y: -102, rotation: 4, zIndex: 10 }
    ] as const;

    let nextCartItemId = 1;
    let fallingCartItems: FallingCartItem[] = [];
    let stackedCartItems: StackedCartItem[] = [];
    let isCartRumbling = false;
    let cartRumbleFrameId: number | null = null;
    let cartRumbleTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let cartFullRumbleIntervalId: ReturnType<typeof setInterval> | null = null;
    const cleanupTimeoutIds: Set<ReturnType<typeof setTimeout>> = new Set();

    const getRandomNumber = (min: number, max: number) => {

        return min + Math.random() * (max - min);

    };

    const getRandomVariant = () => {

        return CART_ITEM_VARIANTS[Math.floor(Math.random() * CART_ITEM_VARIANTS.length)];

    };

    const removeFallingCartItem = (itemId: number) => {

        fallingCartItems = fallingCartItems.filter((item) => item.id !== itemId);

    };

    const addStackedCartItem = (item: FallingCartItem) => {

        const slot = STACK_SLOTS[stackedCartItems.length];

        if (!slot)
        {

            return;

        }

        const nextStackedCartItems = [
            ...stackedCartItems,
            {
                id: item.id,
                color: item.color,
                borderColor: item.borderColor,
                x: slot.x,
                y: slot.y,
                rotation: slot.rotation,
                zIndex: slot.zIndex
            }
        ];

        stackedCartItems = nextStackedCartItems;

        if (nextStackedCartItems.length >= MAX_CART_ITEM_COUNT)
        {

            startCartFullRumbleInterval();

        }

    };

    const scheduleDropCompletion = (item: FallingCartItem) => {

        const timeoutId = setTimeout(() => {

            cleanupTimeoutIds.delete(timeoutId);
            removeFallingCartItem(item.id);

            if (!item.isOverflow)
            {

                addStackedCartItem(item);

            }

        }, item.durationMs);

        cleanupTimeoutIds.add(timeoutId);

    };

    const stopCartRumble = () => {

        if (cartRumbleFrameId !== null)
        {

            cancelAnimationFrame(cartRumbleFrameId);
            cartRumbleFrameId = null;

        }

        if (cartRumbleTimeoutId !== null)
        {

            clearTimeout(cartRumbleTimeoutId);
            cartRumbleTimeoutId = null;

        }

        isCartRumbling = false;

    };

    const startCartRumble = () => {

        stopCartRumble();
        cartRumbleFrameId = requestAnimationFrame(() => {

            cartRumbleFrameId = null;
            isCartRumbling = true;
            cartRumbleTimeoutId = setTimeout(() => {

                cartRumbleTimeoutId = null;
                isCartRumbling = false;

            }, 900);

        });

    };

    const stopCartFullRumbleInterval = () => {

        if (cartFullRumbleIntervalId === null)
        {

            return;

        }

        clearInterval(cartFullRumbleIntervalId);
        cartFullRumbleIntervalId = null;

    };

    const startCartFullRumbleInterval = () => {

        if (cartFullRumbleIntervalId !== null)
        {

            return;

        }

        cartFullRumbleIntervalId = setInterval(startCartRumble, 5000);

    };

    const dropRandomCartItem = () => {

        const activeContainedItemCount = stackedCartItems.length
            + fallingCartItems.filter((item) => !item.isOverflow).length;
        if (activeContainedItemCount >= MAX_CART_ITEM_COUNT)
        {

            return;

        }

        const isOverflow = false;
        const variant = getRandomVariant();
        const landX = getRandomNumber(-36, 36);
        const item = {
            id: nextCartItemId,
            ...variant,
            startX: getRandomNumber(-300, 300),
            landX,
            landY: CART_ITEM_LAND_Y + getRandomNumber(-14, 16),
            spillX: getRandomNumber(460, 620),
            durationMs: CART_ITEM_DROP_DURATION_MS,
            isOverflow
        } satisfies FallingCartItem;

        nextCartItemId += 1;
        fallingCartItems = [...fallingCartItems, item];
        scheduleDropCompletion(item);

    };

    onMount(() => {

        EventBus.on(BATTLE_CART_ITEM_DROP_REQUESTED_EVENT, dropRandomCartItem);

        return () => {

            EventBus.off(BATTLE_CART_ITEM_DROP_REQUESTED_EVENT, dropRandomCartItem);
            cleanupTimeoutIds.forEach((timeoutId) => clearTimeout(timeoutId));
            cleanupTimeoutIds.clear();
            stopCartFullRumbleInterval();
            stopCartRumble();

        };

    });

</script>

<section
    class="cart-farm-zone"
    style={`--battle-area-bottom-y: ${BATTLE_AREA_BOTTOM_Y}px; --cart-item-size: ${CART_ITEM_SIZE}px;`}
    aria-label="수레파밍존"
>
    <div class="cart-farm-zone-background" aria-hidden="true"></div>
    <div class="cart-farm-zone-layout">
        <div class="cart-stage" aria-hidden="true">
            <div class="cart-drop-layer">
                {#each fallingCartItems as item (item.id)}
                    <div
                        class="cart-drop-item"
                        style={`--item-color: ${item.color}; --item-border-color: ${item.borderColor}; --start-x: ${item.startX}px; --land-x: ${item.landX}px; --land-y: ${item.landY}px; --drop-duration: ${item.durationMs}ms;`}
                    ></div>
                {/each}
            </div>

            <div class:cart-rumble-group-rumbling={isCartRumbling} class="cart-rumble-group">
                <img class="cart-farm-zone-wagon" src="/assets/battle/wagon.png" alt="" aria-hidden="true" />
                <div class="cart-item-stack">
                    {#each stackedCartItems as item (item.id)}
                        <div
                            class="cart-stacked-item"
                            style={`--item-color: ${item.color}; --item-border-color: ${item.borderColor}; --stack-x: ${item.x}px; --stack-y: ${item.y}px; --stack-rotation: ${item.rotation}deg; --stack-z-index: ${item.zIndex};`}
                        ></div>
                    {/each}
                </div>
            </div>
        </div>

        <div class="bean-squad-grid" aria-label="내 콩 스쿼드 장비 프레임">
            {#each SQUAD_FRAME_IDS as frameId}
                <article class="bean-squad-frame" aria-label={`콩 스쿼드 ${frameId}번`}>
                    <div class="bean-squad-slot bean-squad-portrait-slot" aria-label="콩 초상화">
                        <img class="bean-squad-portrait" src="/assets/beans/bean_1.png" alt="" aria-hidden="true" />
                    </div>

                    {#each EQUIPMENT_SLOTS as slot}
                        <div class="bean-squad-slot bean-squad-equipment-slot" aria-label={slot.label}>
                            <span class="bean-squad-placeholder-icon" aria-hidden="true">{slot.placeholder}</span>
                        </div>
                    {/each}
                </article>
            {/each}
        </div>
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
        height: calc(var(--dom-frame-bottom, 1920px) - var(--battle-area-bottom-y) - 248px);
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

    .cart-farm-zone-layout {
        position: absolute;
        left: 0;
        right: 0;
        top: 50%;
        z-index: 4;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 22px;
        transform: translateY(-50%);
        pointer-events: none;
    }

    .cart-stage {
        position: relative;
        left: auto;
        top: auto;
        z-index: 4;
        flex: 0 0 auto;
        width: 660px;
        height: 380px;
        margin: 0 auto;
        transform: scale(0.666);
        transform-origin: 50% 0;
        pointer-events: none;
    }

    .cart-rumble-group {
        position: absolute;
        left: 0;
        top: 240px;
        width: 660px;
        height: 356px;
        transform-origin: 50% 64%;
    }

    .cart-farm-zone-wagon {
        position: absolute;
        left: 0;
        top: 0;
        z-index: 3;
        display: block;
        width: 660px;
        max-width: 86%;
        height: auto;
        object-fit: contain;
        user-select: none;
    }

    .cart-drop-layer {
        position: absolute;
        left: 0;
        top: 0;
        z-index: 8;
        width: 660px;
        height: 380px;
        overflow: visible;
        pointer-events: none;
    }

    .bean-squad-grid {
        position: relative;
        left: auto;
        right: auto;
        top: auto;
        z-index: 2;
        display: grid;
        flex: 0 0 auto;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 28px;
        box-sizing: border-box;
        margin: 0 42px;
        pointer-events: none;
    }

    .bean-squad-frame {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        align-items: center;
        gap: 12px;
        box-sizing: border-box;
        min-width: 0;
        height: auto;
        padding: 14px;
        border: 7px solid rgba(255, 211, 116, 0.9);
        border-radius: 30px;
        background: linear-gradient(180deg, rgba(82, 50, 29, 0.95), rgba(47, 30, 21, 0.98));
        box-shadow:
            inset 0 0 0 5px rgba(59, 35, 19, 0.72),
            0 12px 18px rgba(0, 0, 0, 0.24);
    }

    .bean-squad-slot {
        position: relative;
        display: grid;
        place-items: center;
        min-width: 0;
        width: 100%;
        aspect-ratio: 1 / 1;
        height: auto;
        border: 5px solid rgba(135, 83, 39, 0.95);
        border-radius: 22px;
        background:
            radial-gradient(circle at 50% 28%, rgba(255, 236, 174, 0.24), rgba(255, 236, 174, 0) 46%),
            rgba(32, 21, 17, 0.76);
        overflow: hidden;
    }

    .bean-squad-portrait-slot {
        background:
            radial-gradient(circle at 50% 36%, rgba(255, 229, 132, 0.35), rgba(255, 229, 132, 0) 55%),
            rgba(44, 29, 19, 0.84);
    }

    .bean-squad-portrait {
        width: 118px;
        height: 118px;
        object-fit: contain;
        filter: drop-shadow(0 8px 8px rgba(0, 0, 0, 0.28));
        user-select: none;
    }

    .bean-squad-placeholder-icon {
        display: grid;
        place-items: center;
        width: 74px;
        height: 74px;
        border: 5px dashed rgba(255, 225, 154, 0.48);
        border-radius: 20px;
        color: rgba(255, 225, 154, 0.68);
        font-size: 42px;
        line-height: 1;
    }

    .cart-drop-item,
    .cart-stacked-item {
        box-sizing: border-box;
        width: var(--cart-item-size);
        height: var(--cart-item-size);
        border: 12px solid var(--item-border-color);
        border-radius: 22px;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0) 42%), var(--item-color);
        box-shadow: 0 10px 12px rgba(0, 0, 0, 0.28);
    }

    .cart-drop-item {
        position: absolute;
        left: calc(330px + var(--start-x));
        top: -72px;
        transform: translate(-50%, 0) rotate(0deg);
        animation: cart-item-drop-in var(--drop-duration) cubic-bezier(0.18, 0.82, 0.32, 1) forwards;
    }

    .cart-drop-item-overflow {
        animation-name: cart-item-overflow-spill;
        animation-timing-function: cubic-bezier(0.23, 0.72, 0.24, 1);
    }

    .cart-item-stack {
        position: absolute;
        left: 50%;
        z-index: 2;
        top: -186px;
        width: 560px;
        height: 380px;
        transform: translateX(-50%);
        pointer-events: none;
    }

    .cart-stacked-item {
        position: absolute;
        z-index: var(--stack-z-index);
        left: calc(50% + var(--stack-x));
        top: var(--stack-y);
        opacity: 0;
        transform: translate(-50%, 16px) rotate(var(--stack-rotation)) scale(0.82);
        animation: cart-stacked-item-pop 220ms cubic-bezier(0.2, 0.92, 0.34, 1.35) forwards;
    }

    .cart-rumble-group-rumbling {
        animation: cart-rumble-forward 900ms steps(2, end) both;
    }

    @keyframes cart-item-drop-in {
        0% {
            left: calc(330px + var(--start-x));
            top: -72px;
            opacity: 1;
            transform: translate(-50%, 0) rotate(0deg) scale(0.92);
        }

        70% {
            left: calc(330px + var(--land-x));
            top: var(--land-y);
            opacity: 1;
            transform: translate(-50%, 0) rotate(540deg) scale(1);
        }

        84% {
            left: calc(330px + var(--land-x));
            top: calc(var(--land-y) - 42px);
            opacity: 1;
            transform: translate(-50%, 0) rotate(650deg) scale(1.05);
        }

        100% {
            left: calc(330px + var(--land-x));
            top: var(--land-y);
            opacity: 0;
            transform: translate(-50%, 0) rotate(720deg) scale(0.72);
        }
    }

    @keyframes cart-item-overflow-spill {
        0% {
            left: calc(50% + var(--start-x));
            top: -72px;
            opacity: 1;
            transform: translate(-50%, 0) rotate(0deg) scale(0.92);
        }

        42% {
            left: calc(50% + var(--land-x));
            top: var(--land-y);
            opacity: 1;
            transform: translate(-50%, 0) rotate(420deg) scale(1);
        }

        58% {
            left: calc(50% + var(--land-x));
            top: calc(var(--land-y) - 86px);
            opacity: 1;
            transform: translate(-50%, 0) rotate(570deg) scale(1.04);
        }

        100% {
            left: calc(50% + var(--spill-x));
            top: calc(100% + 96px);
            opacity: 0.8;
            transform: translate(-50%, 0) rotate(1160deg) scale(0.96);
        }
    }

    @keyframes cart-stacked-item-pop {
        0% {
            opacity: 0;
            transform: translate(-50%, 16px) rotate(var(--stack-rotation)) scale(0.82);
        }

        70% {
            opacity: 1;
            transform: translate(-50%, -8px) rotate(var(--stack-rotation)) scale(1.08);
        }

        100% {
            opacity: 1;
            transform: translate(-50%, 0) rotate(var(--stack-rotation)) scale(1);
        }
    }

    @keyframes cart-rumble-forward {
        0% {
            transform: translate(0, 0) rotate(0deg);
        }

        8% {
            transform: translate(-4px, 2px) rotate(-0.55deg);
        }

        16% {
            transform: translate(5px, -2px) rotate(0.5deg);
        }

        24% {
            transform: translate(-4px, 2px) rotate(-0.45deg);
        }

        32% {
            transform: translate(4px, -2px) rotate(0.42deg);
        }

        40% {
            transform: translate(-3px, 2px) rotate(-0.35deg);
        }

        48% {
            transform: translate(3px, -2px) rotate(0.34deg);
        }

        56% {
            transform: translate(-3px, 2px) rotate(-0.28deg);
        }

        64% {
            transform: translate(3px, -1px) rotate(0.25deg);
        }

        72% {
            transform: translate(-2px, 1px) rotate(-0.2deg);
        }

        84% {
            transform: translate(2px, -1px) rotate(0.16deg);
        }

        100% {
            transform: translate(0, 0) rotate(0deg);
        }
    }
</style>
