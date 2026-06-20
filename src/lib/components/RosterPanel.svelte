<script lang="ts">

    import { ROSTER_PREVIEW_HEIGHT } from "../rosterLayout";

    const rosterBeans = Array.from({ length: 60 }, (_, index) => ({
        id: `bean-${index + 1}`,
        name: `콩 ${index + 1}`
    }));

</script>

<section
    class="roster-panel"
    aria-label="내 콩 컬렉션"
    style={`--roster-preview-height: ${ROSTER_PREVIEW_HEIGHT}px;`}
>
    <div class="roster-grid">
        {#each rosterBeans as bean}
            <button class="roster-card" type="button" aria-label={`${bean.name} 선택`}>
                <span class="roster-portrait" aria-hidden="true">
                    <span class="roster-portrait-number">{bean.id.replace("bean-", "")}</span>
                </span>
            </button>
        {/each}
    </div>
</section>

<style>
    .roster-panel {
        position: absolute;
        left: var(--dom-frame-left, 0px);
        top: var(--roster-preview-height, 760px);
        z-index: 1;
        width: var(--dom-frame-width, 1080px);
        height: calc(1920px - var(--roster-preview-height, 760px));
        overflow-x: hidden;
        overflow-y: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        padding: 34px 28px 300px;
        background: rgba(255, 248, 226, 0.96);
        border-top: 6px solid rgba(142, 92, 4, 0.78);
        box-shadow: 0 -18px 28px rgba(0, 0, 0, 0.18);
        pointer-events: auto;
        touch-action: pan-y;
    }

    .roster-panel::-webkit-scrollbar {
        display: none;
    }

    .roster-grid {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 18px;
    }

    .roster-card {
        display: flex;
        align-items: center;
        justify-content: center;
        aspect-ratio: 1 / 1;
        margin: 0;
        padding: 8px;
        border: 5px solid #8e5c04;
        border-radius: 24px;
        background: #fff7d8;
        box-shadow: 0 8px 0 rgba(91, 57, 0, 0.28);
        cursor: pointer;
        pointer-events: auto;
        touch-action: manipulation;
    }

    .roster-card:active {
        transform: translateY(5px);
        box-shadow: 0 3px 0 rgba(91, 57, 0, 0.28);
    }

    .roster-portrait {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        border-radius: 18px;
        background: linear-gradient(145deg, #e2c5ff, #b68cff);
        color: #5b3900;
        font-family: "TmoneyRoundWind", sans-serif;
        font-size: 34px;
        font-weight: 800;
        line-height: 1;
    }

    .roster-portrait-number {
        display: block;
        transform: translateY(2px);
    }
</style>
