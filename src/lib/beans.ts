export type BeanGeneDefinition = {
    id: string;
    name: string;
    description: string;
};

export type BeanDefinition = {
    id: string;
    name: string;
    imageUrl: string;
    textureKey: string;
    genes: BeanGeneDefinition[];
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
export const BEAN_GENE_COUNT = 4;

export const beanGeneDefinitions = [
    {
        id: "bean-muscle",
        name: "콩근육",
        description: "공격력 10% 증가",
    },
    {
        id: "plump-kernel",
        name: "통통한 알맹이",
        description: "체력 10% 증가",
    },
    {
        id: "one-heart-one-body",
        name: "일심동체",
        description: "생존 중인 콩 수만큼 공격력 5% 증가",
    },
    {
        id: "vengeful-spirit",
        name: "복수의 화신",
        description: "사망한 콩 수만큼 공격력 5% 증가",
    },
    {
        id: "double-strike",
        name: "연속 공격",
        description: "2% 확률로 2회 공격",
    },
    {
        id: "revival-body",
        name: "부활 체질",
        description: "사망 시간 1초 단축",
    },
] as const satisfies readonly BeanGeneDefinition[];

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

export const createRandomBeanGenes = () => {
    const shuffledGenes = beanGeneDefinitions.map((gene) => ({ ...gene }));

    for (let index = shuffledGenes.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        const currentGene = shuffledGenes[index];
        const randomGene = shuffledGenes[randomIndex];

        shuffledGenes[index] = randomGene;
        shuffledGenes[randomIndex] = currentGene;
    }

    return shuffledGenes.slice(0, BEAN_GENE_COUNT);
};

export const normalizeBeanGenes = (genes: unknown) => {
    if (!Array.isArray(genes)) {
        return createRandomBeanGenes();
    }

    const normalizedGenes = genes
        .filter((gene): gene is BeanGeneDefinition => {
            if (!gene || typeof gene !== "object") {
                return false;
            }

            const candidateGene = gene as Record<string, unknown>;

            return (
                typeof candidateGene.id === "string" &&
                typeof candidateGene.name === "string" &&
                typeof candidateGene.description === "string"
            );
        })
        .slice(0, BEAN_GENE_COUNT)
        .map((gene) => ({ ...gene }));

    if (normalizedGenes.length >= BEAN_GENE_COUNT) {
        return normalizedGenes;
    }

    const existingGeneIds = new Set(normalizedGenes.map((gene) => gene.id));
    const fallbackGenes = createRandomBeanGenes().filter(
        (gene) => !existingGeneIds.has(gene.id)
    );

    return [
        ...normalizedGenes,
        ...fallbackGenes.slice(0, BEAN_GENE_COUNT - normalizedGenes.length),
    ];
};
