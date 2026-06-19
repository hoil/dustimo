export type MainTabKey = "roster" | "farm" | "battle" | "plaza" | "shop";

export type BottomMenuItem = {
    label: string;
    tabKey: MainTabKey;
    iconClass: string;
};

export const bottomMenuItems = [
    { label: "동료", tabKey: "roster", iconClass: "bottom-menu-icon-roster" },
    { label: "재배", tabKey: "farm", iconClass: "bottom-menu-icon-farm" },
    { label: "전투", tabKey: "battle", iconClass: "bottom-menu-icon-battle" },
    { label: "광장", tabKey: "plaza", iconClass: "bottom-menu-icon-plaza" },
    { label: "상점", tabKey: "shop", iconClass: "bottom-menu-icon-shop" }
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
