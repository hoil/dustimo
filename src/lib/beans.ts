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

export const initialOwnedBeans = [
    {
        id: "bean-1-owned-1",
        name: "완두콩",
        imageUrl: "/assets/beans/bean_1.png",
        textureKey: "bean-1"
    },
    {
        id: "bean-1-owned-2",
        name: "완두콩",
        imageUrl: "/assets/beans/bean_1.png",
        textureKey: "bean-1"
    },
    {
        id: "bean-1-owned-3",
        name: "완두콩",
        imageUrl: "/assets/beans/bean_1.png",
        textureKey: "bean-1"
    },
    {
        id: "bean-1-owned-4",
        name: "완두콩",
        imageUrl: "/assets/beans/bean_1.png",
        textureKey: "bean-1"
    }
] as const satisfies BeanDefinition[];

export const getLastOwnedBeanId = (beans: readonly BeanDefinition[]) => {

    return beans.at(-1)?.id ?? null;

};
