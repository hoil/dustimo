import {
    FULL_AREA_HEIGHT,
    FULL_AREA_WIDTH,
    MAX_GAME_ASPECT,
    MIN_GAME_ASPECT,
    SAFE_AREA_HEIGHT,
    SAFE_AREA_WIDTH
} from "../game/SafeArea";

export type GameFrame = {
    frameStyle: string;
    gameSize: {
        width: number;
        height: number;
    };
};

const toPixelValue = (value: number) => `${Math.round(value)}px`;
const parsePixelValue = (value: string) => Number.parseFloat(value) || 0;
const POPUP_SAFE_MARGIN = 30;

const getViewportSafeAreaInsets = (appElement: HTMLElement | null | undefined) => {

    if (!appElement)
    {

        return { top: 0, right: 0, bottom: 0, left: 0 };

    }

    const style = getComputedStyle(appElement);

    return {
        top: parsePixelValue(style.getPropertyValue("--safe-area-top")),
        right: parsePixelValue(style.getPropertyValue("--safe-area-right")),
        bottom: parsePixelValue(style.getPropertyValue("--safe-area-bottom")),
        left: parsePixelValue(style.getPropertyValue("--safe-area-left"))
    };

};

export const calculateGameFrame = (
    appElement: HTMLElement | null | undefined,
    isFullAreaDebugEnabled: boolean
): GameFrame => {

    const appBounds = appElement?.getBoundingClientRect();
    const viewportWidth = Math.max(1, appBounds?.width ?? window.innerWidth);
    const viewportHeight = Math.max(1, appBounds?.height ?? window.innerHeight);
    const viewportAspect = viewportWidth / viewportHeight;
    const gameAspect = Math.min(MAX_GAME_ASPECT, Math.max(MIN_GAME_ASPECT, viewportAspect));
    const safeAspect = SAFE_AREA_WIDTH / SAFE_AREA_HEIGHT;
    let gameWidth = isFullAreaDebugEnabled ? FULL_AREA_WIDTH : SAFE_AREA_WIDTH;
    let gameHeight = isFullAreaDebugEnabled ? FULL_AREA_HEIGHT : SAFE_AREA_HEIGHT;
    let frameWidth = viewportWidth;
    let frameHeight = viewportHeight;

    if (isFullAreaDebugEnabled)
    {
        const fullAreaAspect = FULL_AREA_WIDTH / FULL_AREA_HEIGHT;

        if (viewportAspect > fullAreaAspect)
        {
            frameHeight = viewportHeight;
            frameWidth = frameHeight * fullAreaAspect;
        }
        else
        {
            frameWidth = viewportWidth;
            frameHeight = frameWidth / fullAreaAspect;
        }
    }
    else if (gameAspect > safeAspect)
    {
        gameHeight = SAFE_AREA_HEIGHT;
        gameWidth = gameHeight * gameAspect;
    }
    else if (gameAspect < safeAspect)
    {
        gameWidth = SAFE_AREA_WIDTH;
        gameHeight = gameWidth / gameAspect;
    }

    if (!isFullAreaDebugEnabled && viewportAspect > MAX_GAME_ASPECT)
    {
        frameHeight = viewportHeight;
        frameWidth = frameHeight * MAX_GAME_ASPECT;
    }
    else if (!isFullAreaDebugEnabled && viewportAspect < MIN_GAME_ASPECT)
    {
        frameWidth = viewportWidth;
        frameHeight = frameWidth / MIN_GAME_ASPECT;
    }

    const roundedFrameWidth = Math.round(frameWidth);
    const roundedFrameHeight = Math.round(frameHeight);
    const domCoordinateScale = Math.min(frameWidth / gameWidth, frameHeight / gameHeight);
    const domFrameOffsetX = (gameWidth - SAFE_AREA_WIDTH) / 2;
    const domFrameOffsetY = (gameHeight - SAFE_AREA_HEIGHT) / 2;
    const safeAreaInsets = getViewportSafeAreaInsets(appElement);
    const logicalSafeTop = safeAreaInsets.top / domCoordinateScale;
    const logicalSafeRight = safeAreaInsets.right / domCoordinateScale;
    const logicalSafeBottom = safeAreaInsets.bottom / domCoordinateScale;
    const logicalSafeLeft = safeAreaInsets.left / domCoordinateScale;
    const domFrameLeft = -domFrameOffsetX;
    const domFrameTop = -domFrameOffsetY;
    const domFrameRight = SAFE_AREA_WIDTH + domFrameOffsetX;
    const domFrameBottom = SAFE_AREA_HEIGHT + domFrameOffsetY;
    const domUiLeft = domFrameLeft + logicalSafeLeft;
    const domUiTop = domFrameTop + logicalSafeTop;
    const domUiRight = domFrameRight - logicalSafeRight;
    const domUiBottom = domFrameBottom - logicalSafeBottom;
    const domUiWidth = Math.max(0, domUiRight - domUiLeft);
    const domUiHeight = Math.max(0, domUiBottom - domUiTop);
    const domUiCenterX = domUiLeft + domUiWidth / 2;
    const domUiCenterY = domUiTop + domUiHeight / 2;
    const domPopupMaxWidth = Math.max(0, domUiWidth - POPUP_SAFE_MARGIN * 2);
    const domPopupMaxHeight = Math.max(0, domUiHeight - POPUP_SAFE_MARGIN * 2);
    const popupAspect = SAFE_AREA_WIDTH / SAFE_AREA_HEIGHT;
    let domPopupWidth = domPopupMaxWidth;
    let domPopupHeight = domPopupWidth / popupAspect;

    if (domPopupHeight > domPopupMaxHeight)
    {
        domPopupHeight = domPopupMaxHeight;
        domPopupWidth = domPopupHeight * popupAspect;
    }

    const domPopupLeft = domUiCenterX - domPopupWidth / 2;
    const domPopupTop = domUiCenterY - domPopupHeight / 2;
    const toLogicalPixelValue = (value: number) => `${value}px`;

    return {
        frameStyle: [
            `width: ${roundedFrameWidth}px`,
            `height: ${roundedFrameHeight}px`,
            `--dom-coordinate-scale: ${domCoordinateScale}`,
            `--dom-frame-left: ${toLogicalPixelValue(domFrameLeft)}`,
            `--dom-frame-top: ${toLogicalPixelValue(domFrameTop)}`,
            `--dom-frame-right: ${toLogicalPixelValue(domFrameRight)}`,
            `--dom-frame-bottom: ${toLogicalPixelValue(domFrameBottom)}`,
            `--dom-frame-width: ${gameWidth}px`,
            `--dom-frame-height: ${gameHeight}px`,
            `--dom-safe-top: ${toLogicalPixelValue(logicalSafeTop)}`,
            `--dom-safe-right: ${toLogicalPixelValue(logicalSafeRight)}`,
            `--dom-safe-bottom: ${toLogicalPixelValue(logicalSafeBottom)}`,
            `--dom-safe-left: ${toLogicalPixelValue(logicalSafeLeft)}`,
            `--dom-ui-left: ${toLogicalPixelValue(domUiLeft)}`,
            `--dom-ui-top: ${toLogicalPixelValue(domUiTop)}`,
            `--dom-ui-right: ${toLogicalPixelValue(domUiRight)}`,
            `--dom-ui-bottom: ${toLogicalPixelValue(domUiBottom)}`,
            `--dom-ui-width: ${toLogicalPixelValue(domUiWidth)}`,
            `--dom-ui-height: ${toLogicalPixelValue(domUiHeight)}`,
            `--dom-ui-center-x: ${toLogicalPixelValue(domUiCenterX)}`,
            `--dom-ui-center-y: ${toLogicalPixelValue(domUiCenterY)}`,
            `--dom-popup-left: ${toLogicalPixelValue(domPopupLeft)}`,
            `--dom-popup-top: ${toLogicalPixelValue(domPopupTop)}`,
            `--dom-popup-width: ${toLogicalPixelValue(domPopupWidth)}`,
            `--dom-popup-height: ${toLogicalPixelValue(domPopupHeight)}`,
            `--ui-safe-padding: ${toPixelValue(frameWidth * 0.041)}`,
            `--ui-panel-padding-y: ${toPixelValue(frameWidth * 0.026)}`,
            `--ui-panel-padding-x: ${toPixelValue(frameWidth * 0.031)}`,
            `--ui-panel-radius: ${toPixelValue(frameWidth * 0.031)}`,
            `--ui-control-gap: ${toPixelValue(frameWidth * 0.012)}`,
            `--ui-sprite-gap: ${toPixelValue(frameWidth * 0.021)}`,
            `--ui-pre-margin-top: ${toPixelValue(frameWidth * 0.01)}`,
            `--ui-font-size: ${toPixelValue(frameWidth * 0.033)}`,
            `--ui-button-width: ${toPixelValue(frameWidth * 0.28)}`,
            `--ui-button-padding: ${toPixelValue(frameWidth * 0.018)}`,
            `--ui-button-font-size: ${toPixelValue(frameWidth * 0.026)}`,
            `--ui-button-radius: ${toPixelValue(frameWidth * 0.008)}`,
            `--ui-border-width: ${toPixelValue(Math.max(1, frameWidth * 0.0026))}`
        ].join('; '),
        gameSize: {
            width: Math.round(gameWidth),
            height: Math.round(gameHeight)
        }
    };

};
