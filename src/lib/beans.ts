export type BeanDefinition = {
    id: string;
    name: string;
    imageUrl: string;
    textureKey: string;
};

export type PlantedFarmBean = {
    slotId: string;
    bean: BeanDefinition;
};

export type SeedDefinition = {
    id: string;
    name: string;
    imageUrl: string;
    textureKey: string;
};

export type OwnedSeed = {
    seed: SeedDefinition;
    count: number;
};

export type PlantedFarmSeed = {
    seedSlotId: string;
    seed: SeedDefinition;
    count: number;
    plantedAt: number;
    growDurationMs: number;
};

export const TUTORIAL_SEED_ID = "kidney-bean-seed";

export const initialOwnedBeans: BeanDefinition[] = [];

export const kidneyBeanSeed = {
    id: TUTORIAL_SEED_ID,
    name: "완두콩 종자",
    imageUrl: "/assets/beans/bean_1.png",
    textureKey: "bean-1",
} as const satisfies SeedDefinition;

export const initialOwnedSeeds = [
    {
        seed: kidneyBeanSeed,
        count: 1,
    },
] as const satisfies OwnedSeed[];

export const getLastOwnedBeanId = (beans: readonly BeanDefinition[]) => {
    return beans.at(-1)?.id ?? null;
};
