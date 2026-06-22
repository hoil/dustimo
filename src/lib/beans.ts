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

export const initialOwnedBeans = [
    {
        id: "bean-1-owned-1",
        name: "완두콩",
        imageUrl: "/assets/beans/bean_1.png",
        textureKey: "bean-1",
    },
    {
        id: "bean-1-owned-2",
        name: "완두콩",
        imageUrl: "/assets/beans/bean_1.png",
        textureKey: "bean-1",
    },
    {
        id: "bean-1-owned-3",
        name: "완두콩",
        imageUrl: "/assets/beans/bean_1.png",
        textureKey: "bean-1",
    },
    {
        id: "bean-1-owned-4",
        name: "완두콩",
        imageUrl: "/assets/beans/bean_1.png",
        textureKey: "bean-1",
    },
] as const satisfies BeanDefinition[];

export const kidneyBeanSeed = {
    id: "kidney-bean-seed",
    name: "강낭콩 종자",
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
