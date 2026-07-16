export const BATTLE_CART_ITEM_DROP_REQUESTED_EVENT =
    "battle-cart-item-drop-requested";
export const BATTLE_CART_ITEMS_SYNC_REQUESTED_EVENT =
    "battle-cart-items-sync-requested";

export type BattleCartItemKind =
    | "gold"
    | "leaf"
    | "water"
    | "berry"
    | "crystal";

export type BattleCartItemDefinition = {
    kind: BattleCartItemKind;
    name: string;
    color: string;
    borderColor: string;
};

export type BattleCartItem = {
    id: string;
    kind: BattleCartItemKind;
};

export const BATTLE_CART_ITEM_DEFINITIONS = [
    {
        kind: "gold",
        name: "황금 콩상자",
        color: "#ffd45f",
        borderColor: "#9f6424",
    },
    {
        kind: "leaf",
        name: "잎새 콩상자",
        color: "#8ee86d",
        borderColor: "#2e7e31",
    },
    {
        kind: "water",
        name: "물빛 콩상자",
        color: "#76c8ff",
        borderColor: "#2d6b9f",
    },
    {
        kind: "berry",
        name: "열매 콩상자",
        color: "#ff8aa8",
        borderColor: "#9b3c5b",
    },
    {
        kind: "crystal",
        name: "수정 콩상자",
        color: "#cba2ff",
        borderColor: "#65439c",
    },
] satisfies BattleCartItemDefinition[];

export const MAX_BATTLE_CART_ITEM_COUNT = 50;
export const BATTLE_CART_VISIBLE_STACK_UNIT = 5;

export const getBattleCartItemDefinition = (kind: BattleCartItemKind) => {
    return (
        BATTLE_CART_ITEM_DEFINITIONS.find(
            (definition) => definition.kind === kind
        ) ?? BATTLE_CART_ITEM_DEFINITIONS[0]
    );
};

export const getRandomBattleCartItemKind = () => {
    return BATTLE_CART_ITEM_DEFINITIONS[
        Math.floor(Math.random() * BATTLE_CART_ITEM_DEFINITIONS.length)
    ].kind;
};

export const createBattleCartItem = (
    kind = getRandomBattleCartItemKind()
): BattleCartItem => {
    return {
        id: `cart-item-${Date.now().toString(36)}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,
        kind,
    };
};
