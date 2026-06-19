const GAME_STORAGE_PREFIX = "beantoking:";
const GAME_UID_STORAGE_KEY = `${GAME_STORAGE_PREFIX}uid`;
const GAME_TUTORIAL_SEEN_STORAGE_KEY_PREFIX = `${GAME_STORAGE_PREFIX}tutorial-seen:`;

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
