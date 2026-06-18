const GAME_STORAGE_PREFIX = "beantoking:";
const GAME_UID_STORAGE_KEY = `${GAME_STORAGE_PREFIX}uid`;

const createRandomHex = (byteLength: number) => {

    const bytes = new Uint8Array(byteLength);

    if (globalThis.crypto?.getRandomValues)
    {

        globalThis.crypto.getRandomValues(bytes);

        return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

    }

    return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;

};

export const getGameUid = () => {

    if (typeof localStorage === "undefined")
    {

        return null;

    }

    return localStorage.getItem(GAME_UID_STORAGE_KEY);

};

export const getOrCreateGameUid = () => {

    const savedUid = getGameUid();

    if (savedUid)
    {

        return savedUid;

    }

    const uid = createRandomHex(16);

    localStorage.setItem(GAME_UID_STORAGE_KEY, uid);

    return uid;

};

export const clearGameStorage = () => {

    if (typeof localStorage === "undefined")
    {

        return;

    }

    const keysToRemove = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
        .filter((key): key is string => Boolean(key?.startsWith(GAME_STORAGE_PREFIX)));

    keysToRemove.forEach((key) => localStorage.removeItem(key));

};
