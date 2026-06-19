export type InitialPopupKey = "test-popup";

export type InitialPopupDefinition = {
    key: InitialPopupKey;
    priority: number;
    shouldShow?: () => boolean;
};

export const initialPopupPriorities = {
    testPopup: 1000,
} as const;

export const createInitialPopupQueue = (): InitialPopupDefinition[] => {
    const popupDefinitions: InitialPopupDefinition[] = [
        {
            key: "test-popup",
            priority: initialPopupPriorities.testPopup,
        },
    ];

    return popupDefinitions
        .filter((popupDefinition) => popupDefinition.shouldShow?.() ?? true)
        .sort((a, b) => b.priority - a.priority);
};