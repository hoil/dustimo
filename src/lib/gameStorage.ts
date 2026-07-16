import {
    initialOwnedBeans,
    initialOwnedSeeds,
    normalizeBeanGenes,
    type BeanDefinition,
    type OwnedSeed,
    type PlantedFarmBean,
    type PlantedFarmSeed,
} from "./beans";
import {
    BATTLE_CART_ITEM_DEFINITIONS,
    MAX_BATTLE_CART_ITEM_COUNT,
    type BattleCartItem,
    type BattleCartItemKind,
} from "./battleCartRewards";
import {
    INITIAL_INBOX_MAIL_DEFINITIONS,
    mergeInboxMailStatesWithInitialMails,
    type InboxMailState,
} from "./inbox";

const GAME_STORAGE_PREFIX = "beantoking:";
const GAME_UID_STORAGE_KEY = `${GAME_STORAGE_PREFIX}uid`;
const GAME_OWNED_BEANS_STORAGE_KEY = `${GAME_STORAGE_PREFIX}owned-beans`;
const GAME_OWNED_SEEDS_STORAGE_KEY = `${GAME_STORAGE_PREFIX}owned-seeds`;
const GAME_PLANTED_FARM_BEANS_STORAGE_KEY = `${GAME_STORAGE_PREFIX}planted-farm-beans`;
const GAME_PLANTED_FARM_SEEDS_STORAGE_KEY = `${GAME_STORAGE_PREFIX}planted-farm-seeds`;
const GAME_ROSTER_TAB_UNLOCKED_STORAGE_KEY = `${GAME_STORAGE_PREFIX}roster-tab-unlocked`;
const GAME_ROSTER_TAB_UNREAD_STORAGE_KEY = `${GAME_STORAGE_PREFIX}roster-tab-unread`;
const GAME_BATTLE_CART_ITEMS_STORAGE_KEY = `${GAME_STORAGE_PREFIX}battle-cart-items`;
const GAME_INBOX_MAIL_STATES_STORAGE_KEY = `${GAME_STORAGE_PREFIX}inbox-mail-states`;
const battleCartItemKinds = new Set<BattleCartItemKind>(
    BATTLE_CART_ITEM_DEFINITIONS.map((definition) => definition.kind)
);
const inboxMailIds = new Set(
    INITIAL_INBOX_MAIL_DEFINITIONS.map((mail) => mail.id)
);
const inboxAttachmentIdsByMailId = new Map(
    INITIAL_INBOX_MAIL_DEFINITIONS.map((mail) => [
        mail.id,
        new Set(mail.attachments.map((attachment) => attachment.id)),
    ])
);

const cloneBeanDefinition = (bean: BeanDefinition): BeanDefinition => ({
    ...bean,
    genes: bean.genes.map((gene) => ({ ...gene })),
});

const createInitialOwnedBeans = (): BeanDefinition[] => {
    return initialOwnedBeans.map(cloneBeanDefinition);
};

const addMissingInitialOwnedBeans = (beans: readonly BeanDefinition[]) => {
    const savedBeanIds = new Set(beans.map((bean) => bean.id));
    const missingInitialBeans = initialOwnedBeans
        .filter((bean) => !savedBeanIds.has(bean.id))
        .map(cloneBeanDefinition);

    return [...missingInitialBeans, ...beans.map(cloneBeanDefinition)];
};

const createInitialOwnedSeeds = (): OwnedSeed[] => {
    return initialOwnedSeeds.map((ownedSeed) => ({
        seed: { ...ownedSeed.seed },
        count: ownedSeed.count,
    }));
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

const normalizeBeanDefinition = (bean: BeanDefinition): BeanDefinition => ({
    ...bean,
    genes: normalizeBeanGenes((bean as Record<string, unknown>).genes),
});

const parseOwnedBeans = (rawValue: string | null) => {
    if (!rawValue) {
        return null;
    }

    try {
        const parsedValue: unknown = JSON.parse(rawValue);

        if (
            !Array.isArray(parsedValue) ||
            parsedValue.some((bean) => !isBeanDefinition(bean))
        ) {
            return null;
        }

        return parsedValue.map(normalizeBeanDefinition);
    } catch {
        return null;
    }
};

const isOwnedSeed = (value: unknown): value is OwnedSeed => {
    if (!value || typeof value !== "object") {
        return false;
    }

    const ownedSeed = value as Record<string, unknown>;

    return (
        isBeanDefinition(ownedSeed.seed) &&
        typeof ownedSeed.count === "number" &&
        Number.isInteger(ownedSeed.count) &&
        ownedSeed.count >= 0
    );
};

const parseOwnedSeeds = (rawValue: string | null) => {
    if (!rawValue) {
        return null;
    }

    try {
        const parsedValue: unknown = JSON.parse(rawValue);

        if (
            !Array.isArray(parsedValue) ||
            parsedValue.some((ownedSeed) => !isOwnedSeed(ownedSeed))
        ) {
            return null;
        }

        return parsedValue;
    } catch {
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

const isPlantedFarmSeed = (value: unknown): value is PlantedFarmSeed => {
    if (!value || typeof value !== "object") {
        return false;
    }

    const plantedSeed = value as Record<string, unknown>;

    return (
        typeof plantedSeed.seedSlotId === "string" &&
        isBeanDefinition(plantedSeed.seed) &&
        typeof plantedSeed.count === "number" &&
        Number.isInteger(plantedSeed.count) &&
        plantedSeed.count > 0 &&
        typeof plantedSeed.plantedAt === "number" &&
        Number.isFinite(plantedSeed.plantedAt) &&
        typeof plantedSeed.growDurationMs === "number" &&
        Number.isFinite(plantedSeed.growDurationMs) &&
        plantedSeed.growDurationMs > 0
    );
};

const parsePlantedFarmBeans = (rawValue: string | null) => {
    if (!rawValue) {
        return [];
    }

    try {
        const parsedValue: unknown = JSON.parse(rawValue);

        if (
            !Array.isArray(parsedValue) ||
            parsedValue.some((plantedBean) => !isPlantedFarmBean(plantedBean))
        ) {
            return [];
        }

        return parsedValue.map((plantedBean) => ({
            ...plantedBean,
            bean: normalizeBeanDefinition(plantedBean.bean),
        }));
    } catch {
        return [];
    }
};

const parsePlantedFarmSeeds = (rawValue: string | null) => {
    if (!rawValue) {
        return [];
    }

    try {
        const parsedValue: unknown = JSON.parse(rawValue);

        if (
            !Array.isArray(parsedValue) ||
            parsedValue.some((plantedSeed) => !isPlantedFarmSeed(plantedSeed))
        ) {
            return [];
        }

        return parsedValue;
    } catch {
        return [];
    }
};

const isBattleCartItem = (value: unknown): value is BattleCartItem => {
    if (!value || typeof value !== "object") {
        return false;
    }

    const item = value as Record<string, unknown>;

    return (
        typeof item.id === "string" &&
        typeof item.kind === "string" &&
        battleCartItemKinds.has(item.kind as BattleCartItemKind)
    );
};

const parseBattleCartItems = (rawValue: string | null) => {
    if (!rawValue) {
        return [];
    }

    try {
        const parsedValue: unknown = JSON.parse(rawValue);

        if (
            !Array.isArray(parsedValue) ||
            parsedValue.some((item) => !isBattleCartItem(item))
        ) {
            return [];
        }

        return parsedValue.slice(0, MAX_BATTLE_CART_ITEM_COUNT);
    } catch {
        return [];
    }
};

const isInboxMailState = (value: unknown): value is InboxMailState => {
    if (!value || typeof value !== "object") {
        return false;
    }

    const state = value as Record<string, unknown>;

    return (
        typeof state.id === "string" &&
        inboxMailIds.has(state.id) &&
        typeof state.isRead === "boolean" &&
        Array.isArray(state.claimedAttachmentIds) &&
        state.claimedAttachmentIds.every(
            (attachmentId) => typeof attachmentId === "string"
        )
    );
};

const normalizeInboxMailState = (state: InboxMailState): InboxMailState => {
    const validAttachmentIds =
        inboxAttachmentIdsByMailId.get(state.id) ?? new Set<string>();

    return {
        id: state.id,
        isRead: state.isRead,
        claimedAttachmentIds: Array.from(
            new Set(state.claimedAttachmentIds)
        ).filter((attachmentId) => validAttachmentIds.has(attachmentId)),
    };
};

const parseInboxMailStates = (rawValue: string | null) => {
    if (!rawValue) {
        return null;
    }

    try {
        const parsedValue: unknown = JSON.parse(rawValue);

        if (
            !Array.isArray(parsedValue) ||
            parsedValue.some((state) => !isInboxMailState(state))
        ) {
            return null;
        }

        return parsedValue.map(normalizeInboxMailState);
    } catch {
        return null;
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

    return uid;
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

    const savedBeans = parseOwnedBeans(
        localStorage.getItem(GAME_OWNED_BEANS_STORAGE_KEY)
    );

    if (savedBeans) {
        const beansWithInitialBeans = addMissingInitialOwnedBeans(savedBeans);

        if (beansWithInitialBeans.length !== savedBeans.length) {
            saveOwnedBeans(beansWithInitialBeans);
        }

        return beansWithInitialBeans;
    }

    const defaultBeans = createInitialOwnedBeans();

    saveOwnedBeans(defaultBeans);

    return defaultBeans;
};

export const saveOwnedSeeds = (ownedSeeds: readonly OwnedSeed[]) => {
    if (typeof localStorage === "undefined") {
        return;
    }

    localStorage.setItem(
        GAME_OWNED_SEEDS_STORAGE_KEY,
        JSON.stringify(ownedSeeds)
    );
};

export const getOrCreateOwnedSeeds = () => {
    if (typeof localStorage === "undefined") {
        return createInitialOwnedSeeds();
    }

    const savedSeeds = parseOwnedSeeds(
        localStorage.getItem(GAME_OWNED_SEEDS_STORAGE_KEY)
    );

    if (savedSeeds) {
        return savedSeeds;
    }

    const defaultSeeds = createInitialOwnedSeeds();

    saveOwnedSeeds(defaultSeeds);

    return defaultSeeds;
};

export const savePlantedFarmBeans = (
    plantedBeans: readonly PlantedFarmBean[]
) => {
    if (typeof localStorage === "undefined") {
        return;
    }

    localStorage.setItem(
        GAME_PLANTED_FARM_BEANS_STORAGE_KEY,
        JSON.stringify(plantedBeans)
    );
};

export const getPlantedFarmBeans = () => {
    if (typeof localStorage === "undefined") {
        return [];
    }

    return parsePlantedFarmBeans(
        localStorage.getItem(GAME_PLANTED_FARM_BEANS_STORAGE_KEY)
    );
};

export const savePlantedFarmSeeds = (
    plantedSeeds: readonly PlantedFarmSeed[]
) => {
    if (typeof localStorage === "undefined") {
        return;
    }

    localStorage.setItem(
        GAME_PLANTED_FARM_SEEDS_STORAGE_KEY,
        JSON.stringify(plantedSeeds)
    );
};

export const getPlantedFarmSeeds = () => {
    if (typeof localStorage === "undefined") {
        return [];
    }

    return parsePlantedFarmSeeds(
        localStorage.getItem(GAME_PLANTED_FARM_SEEDS_STORAGE_KEY)
    );
};

export const saveBattleCartItems = (items: readonly BattleCartItem[]) => {
    if (typeof localStorage === "undefined") {
        return;
    }

    localStorage.setItem(
        GAME_BATTLE_CART_ITEMS_STORAGE_KEY,
        JSON.stringify(items.slice(0, MAX_BATTLE_CART_ITEM_COUNT))
    );
};

export const getBattleCartItems = () => {
    if (typeof localStorage === "undefined") {
        return [];
    }

    return parseBattleCartItems(
        localStorage.getItem(GAME_BATTLE_CART_ITEMS_STORAGE_KEY)
    );
};

export const addBattleCartItem = (item: BattleCartItem) => {
    const currentItems = getBattleCartItems();

    if (currentItems.length >= MAX_BATTLE_CART_ITEM_COUNT) {
        return currentItems;
    }

    const nextItems = [...currentItems, item].slice(
        0,
        MAX_BATTLE_CART_ITEM_COUNT
    );

    saveBattleCartItems(nextItems);

    return nextItems;
};

export const removeBattleCartItemsByIds = (itemIds: ReadonlySet<string>) => {
    const currentItems = getBattleCartItems();

    if (itemIds.size === 0) {
        return currentItems;
    }

    const nextItems = currentItems.filter((item) => !itemIds.has(item.id));

    if (nextItems.length !== currentItems.length) {
        saveBattleCartItems(nextItems);
    }

    return nextItems;
};

export const saveInboxMailStates = (states: readonly InboxMailState[]) => {
    if (typeof localStorage === "undefined") {
        return;
    }

    localStorage.setItem(
        GAME_INBOX_MAIL_STATES_STORAGE_KEY,
        JSON.stringify(mergeInboxMailStatesWithInitialMails(states))
    );
};

export const getOrCreateInboxMailStates = () => {
    if (typeof localStorage === "undefined") {
        return mergeInboxMailStatesWithInitialMails([]);
    }

    const savedStates = parseInboxMailStates(
        localStorage.getItem(GAME_INBOX_MAIL_STATES_STORAGE_KEY)
    );
    const states = mergeInboxMailStatesWithInitialMails(savedStates ?? []);

    if (!savedStates || savedStates.length !== states.length) {
        saveInboxMailStates(states);
    }

    return states;
};

export const markInboxMailRead = (mailId: string) => {
    const currentStates = getOrCreateInboxMailStates();
    const nextStates = currentStates.map((state) =>
        state.id === mailId
            ? {
                  ...state,
                  isRead: true,
              }
            : state
    );

    saveInboxMailStates(nextStates);

    return nextStates;
};

export const claimInboxMailAttachments = (
    mailId: string,
    attachmentIds: readonly string[]
) => {
    const validAttachmentIds =
        inboxAttachmentIdsByMailId.get(mailId) ?? new Set<string>();
    const claimableAttachmentIds = attachmentIds.filter((attachmentId) =>
        validAttachmentIds.has(attachmentId)
    );
    const currentStates = getOrCreateInboxMailStates();
    const nextStates = currentStates.map((state) => {
        if (state.id !== mailId) {
            return state;
        }

        return {
            ...state,
            isRead: true,
            claimedAttachmentIds: Array.from(
                new Set([
                    ...state.claimedAttachmentIds,
                    ...claimableAttachmentIds,
                ])
            ),
        };
    });

    saveInboxMailStates(nextStates);

    return nextStates;
};

export const hasUnlockedRosterTab = () => {
    if (typeof localStorage === "undefined") {
        return false;
    }

    return (
        localStorage.getItem(GAME_ROSTER_TAB_UNLOCKED_STORAGE_KEY) === "true"
    );
};

export const markRosterTabUnlocked = () => {
    if (typeof localStorage === "undefined") {
        return;
    }

    localStorage.setItem(GAME_ROSTER_TAB_UNLOCKED_STORAGE_KEY, "true");
};

export const hasUnreadRosterTab = () => {
    if (typeof localStorage === "undefined") {
        return false;
    }

    return localStorage.getItem(GAME_ROSTER_TAB_UNREAD_STORAGE_KEY) === "true";
};

export const markRosterTabUnread = () => {
    if (typeof localStorage === "undefined") {
        return;
    }

    localStorage.setItem(GAME_ROSTER_TAB_UNREAD_STORAGE_KEY, "true");
};

export const markRosterTabRead = () => {
    if (typeof localStorage === "undefined") {
        return;
    }

    localStorage.setItem(GAME_ROSTER_TAB_UNREAD_STORAGE_KEY, "false");
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
