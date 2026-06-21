import {
    initialOwnedBeans,
    type BeanDefinition,
    type PlantedFarmBean
} from "./beans";

const GAME_STORAGE_PREFIX = "beantoking:";
const GAME_UID_STORAGE_KEY = `${GAME_STORAGE_PREFIX}uid`;
const GAME_TUTORIAL_SEEN_STORAGE_KEY_PREFIX = `${GAME_STORAGE_PREFIX}tutorial-seen:`;
const GAME_OWNED_BEANS_STORAGE_KEY = `${GAME_STORAGE_PREFIX}owned-beans`;
const GAME_PLANTED_FARM_BEANS_STORAGE_KEY = `${GAME_STORAGE_PREFIX}planted-farm-beans`;

const createInitialOwnedBeans = (): BeanDefinition[] => {

    return initialOwnedBeans.map((bean) => ({ ...bean }));

};

const isBeanDefinition = (value: unknown): value is BeanDefinition => {

    if (!value || typeof value !== "object") {
        return false;
    }

    const bean = value as Record<string, unknown>;

    return (
        typeof bean.id === "string" &&
        typeof bean.name === "string" &&
        typeof bean.imageUrl === "string" &&
        typeof bean.textureKey === "string"
    );

};

const parseOwnedBeans = (rawValue: string | null) => {

    if (!rawValue) {
        return null;
    }

    try {
        const parsedValue: unknown = JSON.parse(rawValue);

        if (!Array.isArray(parsedValue) || parsedValue.some((bean) => !isBeanDefinition(bean))) {
            return null;
        }

        return parsedValue;
    }
    catch {
        return null;
    }

};

const isPlantedFarmBean = (value: unknown): value is PlantedFarmBean => {

    if (!value || typeof value !== "object") {
        return false;
    }

    const plantedBean = value as Record<string, unknown>;

    return (
        typeof plantedBean.slotId === "string" &&
        isBeanDefinition(plantedBean.bean)
    );

};

const parsePlantedFarmBeans = (rawValue: string | null) => {

    if (!rawValue) {
        return [];
    }

    try {
        const parsedValue: unknown = JSON.parse(rawValue);

        if (!Array.isArray(parsedValue) || parsedValue.some((plantedBean) => !isPlantedFarmBean(plantedBean))) {
            return [];
        }

        return parsedValue;
    }
    catch {
        return [];
    }

};

const createRandomHex = (byteLength: number) => {
    const bytes = new Uint8Array(byteLength);

    if (globalThis.crypto?.getRandomValues) {
        globalThis.crypto.getRandomValues(bytes);

        return Array.from(bytes, (byte) =>
            byte.toString(16).padStart(2, "0")
        ).join("");
    }

    return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
};

export const getGameUid = () => {
    if (typeof localStorage === "undefined") {
        return null;
    }

    return localStorage.getItem(GAME_UID_STORAGE_KEY);
};

export const getOrCreateGameUid = () => {
    const savedUid = getGameUid();

    if (savedUid) {
        return savedUid;
    }

    const uid = createRandomHex(16);

    localStorage.setItem(GAME_UID_STORAGE_KEY, uid);
    localStorage.setItem(
        `${GAME_TUTORIAL_SEEN_STORAGE_KEY_PREFIX}${uid}`,
        "false"
    );

    return uid;
};

export const hasSeenGameTutorial = (uid: string) => {
    if (typeof localStorage === "undefined" || !uid) {
        return true;
    }

    return (
        localStorage.getItem(
            `${GAME_TUTORIAL_SEEN_STORAGE_KEY_PREFIX}${uid}`
        ) === "true"
    );
};

export const markGameTutorialSeen = (uid: string) => {
    if (typeof localStorage === "undefined" || !uid) {
        return;
    }

    localStorage.setItem(
        `${GAME_TUTORIAL_SEEN_STORAGE_KEY_PREFIX}${uid}`,
        "true"
    );
};

export const saveOwnedBeans = (beans: readonly BeanDefinition[]) => {
    if (typeof localStorage === "undefined") {
        return;
    }

    localStorage.setItem(GAME_OWNED_BEANS_STORAGE_KEY, JSON.stringify(beans));
};

export const getOrCreateOwnedBeans = () => {
    if (typeof localStorage === "undefined") {
        return createInitialOwnedBeans();
    }

    const savedBeans = parseOwnedBeans(localStorage.getItem(GAME_OWNED_BEANS_STORAGE_KEY));

    if (savedBeans) {
        return savedBeans;
    }

    const defaultBeans = createInitialOwnedBeans();

    saveOwnedBeans(defaultBeans);

    return defaultBeans;
};

export const savePlantedFarmBeans = (plantedBeans: readonly PlantedFarmBean[]) => {
    if (typeof localStorage === "undefined") {
        return;
    }

    localStorage.setItem(GAME_PLANTED_FARM_BEANS_STORAGE_KEY, JSON.stringify(plantedBeans));
};

export const getPlantedFarmBeans = () => {
    if (typeof localStorage === "undefined") {
        return [];
    }

    return parsePlantedFarmBeans(localStorage.getItem(GAME_PLANTED_FARM_BEANS_STORAGE_KEY));
};

export const clearGameStorage = () => {
    if (typeof localStorage === "undefined") {
        return;
    }

    const keysToRemove = Array.from(
        { length: localStorage.length },
        (_, index) => localStorage.key(index)
    ).filter((key): key is string =>
        Boolean(key?.startsWith(GAME_STORAGE_PREFIX))
    );

    keysToRemove.forEach((key) => localStorage.removeItem(key));
};
