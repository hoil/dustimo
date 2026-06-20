export type MainTabKey = "roster" | "farm" | "battle" | "plaza" | "shop";

export type BottomMenuItem = {
    label: string;
    tabKey: MainTabKey;
    iconSrc: string;
};

export const bottomMenuItems = [
    { label: "동료", tabKey: "roster", iconSrc: "/assets/bottom_menu/roster_icon.png" },
    { label: "재배", tabKey: "farm", iconSrc: "/assets/bottom_menu/farm_icon.png" },
    { label: "전투", tabKey: "battle", iconSrc: "/assets/bottom_menu/battle_icon.png" },
    { label: "광장", tabKey: "plaza", iconSrc: "/assets/bottom_menu/plaza_icon.png" },
    { label: "상점", tabKey: "shop", iconSrc: "/assets/bottom_menu/shop_icon.png" }
] satisfies BottomMenuItem[];

const mainTabLabels: Record<MainTabKey, string> = {
    roster: "동료",
    farm: "재배",
    battle: "전투",
    plaza: "광장",
    shop: "상점"
};

const tabSceneKeys: Record<MainTabKey, string> = {
    roster: "RosterScene",
    farm: "FarmScene",
    battle: "BattleScene",
    plaza: "PlazaScene",
    shop: "ShopScene"
};

export const defaultReturnTab: MainTabKey = "farm";
export const shopTabKey: MainTabKey = "shop";
const nonShopTabKeys: MainTabKey[] = [
    "roster",
    "farm",
    "battle",
    "plaza"
];

export const isNonShopTabKey = (tabKey: MainTabKey) => {

    return nonShopTabKeys.includes(tabKey);

};

export const getTabLabel = (tabKey: MainTabKey) => {

    return mainTabLabels[tabKey];

};

export const getTabSceneKey = (tabKey: MainTabKey) => {

    return tabSceneKeys[tabKey];

};
