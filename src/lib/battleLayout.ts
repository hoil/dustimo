import { SAFE_AREA_HEIGHT, SAFE_AREA_WIDTH } from "../game/SafeArea";

export const BATTLE_AREA_BOTTOM_Y = 700;

export const battleArea = {
    x: 0,
    y: 0,
    width: SAFE_AREA_WIDTH,
    height: BATTLE_AREA_BOTTOM_Y,
} as const;

export const cartFarmArea = {
    x: 0,
    y: BATTLE_AREA_BOTTOM_Y,
    width: SAFE_AREA_WIDTH,
    height: SAFE_AREA_HEIGHT - BATTLE_AREA_BOTTOM_Y,
} as const;
