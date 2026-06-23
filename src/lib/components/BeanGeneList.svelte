<script lang="ts">

    import type { BeanGeneDefinition } from "../beans";

    export let genes: readonly BeanGeneDefinition[] = [];
    export let title = "유전자";

</script>

<section class="bean-gene-list" aria-label={title}>
    <h3 class="bean-gene-list-title">{title}</h3>
    <ul class="bean-gene-items">
        {#each genes as gene}
            <li class="bean-gene-item">
                <span class="bean-gene-name">{gene.name}</span>
                <span class="bean-gene-description">{gene.description}</span>
            </li>
        {/each}
    </ul>
</section>

<style>
    .bean-gene-list {
        box-sizing: border-box;
        width: 560px;
        padding: 22px 26px 24px;
        border: 6px solid #8e5c04;
        border-radius: 28px;
        background: rgba(255, 248, 226, 0.96);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
        color: #4a2b17;
        font-family: "MabinogiClassic", sans-serif;
        pointer-events: none;
    }

    .bean-gene-list-title {
        margin: 0 0 16px;
        color: #8e5c04;
        font-size: 30px;
        font-weight: 800;
        line-height: 1;
    }

    .bean-gene-items {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .bean-gene-item {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        min-width: 0;
        font-size: 24px;
        font-weight: 800;
        line-height: 1.22;
        word-break: keep-all;
    }

    .bean-gene-item::before {
        content: "•";
        flex: 0 0 auto;
        color: #8e5c04;
    }

    .bean-gene-name {
        flex: 0 0 auto;
        color: #4a2b17;
        white-space: nowrap;
    }

    .bean-gene-description {
        min-width: 0;
        color: #6d470c;
        font-weight: 400;
    }
</style>