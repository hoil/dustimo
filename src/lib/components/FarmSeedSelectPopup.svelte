<script lang="ts">

    import type { OwnedSeed, SeedDefinition } from "../beans";

    export let ownedSeeds: readonly OwnedSeed[] = [];
    export let onPlant: (seed: SeedDefinition, count: number) => void;
    export let onClose: () => void;

    const MAX_SEED_PLANT_COUNT = 10;
    const GROW_MINUTES_PER_SEED = 10;

    let selectedOwnedSeed: OwnedSeed | null = null;
    let selectedSeedCount = 1;

    $: selectedMaxSeedCount = selectedOwnedSeed
        ? Math.max(1, Math.min(selectedOwnedSeed.count, MAX_SEED_PLANT_COUNT))
        : 1;
    $: if (selectedSeedCount > selectedMaxSeedCount) {
        selectedSeedCount = selectedMaxSeedCount;
    }

    const selectSeed = (ownedSeed: OwnedSeed) => {

        if (ownedSeed.count <= 0) {
            return;
        }

        selectedOwnedSeed = ownedSeed;
        selectedSeedCount = 1;

    };

    const decreaseSeedCount = () => {

        selectedSeedCount = Math.max(1, selectedSeedCount - 1);

    };

    const increaseSeedCount = () => {

        selectedSeedCount = Math.min(selectedMaxSeedCount, selectedSeedCount + 1);

    };

    const setMaxSeedCount = () => {

        selectedSeedCount = selectedMaxSeedCount;

    };

    const plantSelectedSeed = () => {

        if (!selectedOwnedSeed) {
            return;
        }

        onPlant(selectedOwnedSeed.seed, selectedSeedCount);

    };

</script>

<div class="dom-coordinate-layer popup-coordinate-layer">
    <div class="popup-dim" aria-hidden="true"></div>
    <section class="seed-select-popup" role="dialog" aria-modal="true" aria-label="종자 선택">
        <div class="popup-background" aria-hidden="true">
            <svg class="popup-slice popup-slice-top-left" viewBox="0 0 100 160" preserveAspectRatio="none">
                <image href="/assets/common/popup.png" width="1000" height="333" />
            </svg>
            <svg class="popup-slice popup-slice-top" viewBox="100 0 800 160" preserveAspectRatio="none">
                <image href="/assets/common/popup.png" width="1000" height="333" />
            </svg>
            <svg class="popup-slice popup-slice-top-right" viewBox="900 0 100 160" preserveAspectRatio="none">
                <image href="/assets/common/popup.png" width="1000" height="333" />
            </svg>
            <svg class="popup-slice popup-slice-left" viewBox="0 160 100 13" preserveAspectRatio="none">
                <image href="/assets/common/popup.png" width="1000" height="333" />
            </svg>
            <svg class="popup-slice popup-slice-center" viewBox="100 160 800 13" preserveAspectRatio="none">
                <image href="/assets/common/popup.png" width="1000" height="333" />
            </svg>
            <svg class="popup-slice popup-slice-right" viewBox="900 160 100 13" preserveAspectRatio="none">
                <image href="/assets/common/popup.png" width="1000" height="333" />
            </svg>
            <svg class="popup-slice popup-slice-bottom-left" viewBox="0 173 100 160" preserveAspectRatio="none">
                <image href="/assets/common/popup.png" width="1000" height="333" />
            </svg>
            <svg class="popup-slice popup-slice-bottom" viewBox="100 173 800 160" preserveAspectRatio="none">
                <image href="/assets/common/popup.png" width="1000" height="333" />
            </svg>
            <svg class="popup-slice popup-slice-bottom-right" viewBox="900 173 100 160" preserveAspectRatio="none">
                <image href="/assets/common/popup.png" width="1000" height="333" />
            </svg>
        </div>

        <button class="popup-close-button" type="button" aria-label="종자 선택 닫기" onclick={onClose}>
            ×
        </button>

        <div class="popup-content">
            <h2 class="popup-title">종자 선택</h2>

            <div class="seed-list" role="list" aria-label="내 보유 종자 리스트">
                {#each ownedSeeds as ownedSeed}
                    <button
                        class:seed-list-item-selected={selectedOwnedSeed?.seed.id === ownedSeed.seed.id}
                        class="seed-list-item"
                        type="button"
                        role="listitem"
                        disabled={ownedSeed.count <= 0}
                        onclick={() => selectSeed(ownedSeed)}
                    >
                        <img class="seed-portrait" src={ownedSeed.seed.imageUrl} alt="" draggable="false" />
                        <span class="seed-name">{ownedSeed.seed.name}</span>
                        <span class="seed-count">보유 개수: {ownedSeed.count}개</span>
                    </button>
                {:else}
                    <p class="seed-empty-message">보유 중인 종자가 없어요.</p>
                {/each}
            </div>

            {#if selectedOwnedSeed}
                <div class="seed-plant-panel" aria-label="종자 심기 수량 선택">
                    <h3 class="seed-plant-title">몇 개를 심을까요?</h3>
                    <div class="seed-count-control">
                        <button class="seed-count-button" type="button" onclick={decreaseSeedCount} disabled={selectedSeedCount <= 1}>
                            −
                        </button>
                        <span class="seed-count-value">{selectedSeedCount}</span>
                        <button class="seed-count-button" type="button" onclick={increaseSeedCount} disabled={selectedSeedCount >= selectedMaxSeedCount}>
                            +
                        </button>
                        <button class="seed-count-max-button" type="button" onclick={setMaxSeedCount}>
                            최대
                        </button>
                    </div>
                    <p class="seed-grow-time">소요 재배 시간: {selectedSeedCount * GROW_MINUTES_PER_SEED}분</p>
                    <button class="seed-plant-button" type="button" onclick={plantSelectedSeed}>
                        심기
                    </button>
                </div>
            {/if}
        </div>
    </section>
</div>

<style>
    .popup-coordinate-layer {
        z-index: 100;
    }

    .popup-dim {
        position: absolute;
        left: var(--dom-frame-left, 0px);
        top: var(--dom-frame-top, 0px);
        width: var(--dom-frame-width, 1080px);
        height: var(--dom-frame-height, 1920px);
        background: rgba(0, 0, 0, 0.58);
        pointer-events: auto;
    }

    .seed-select-popup {
        position: absolute;
        left: var(--dom-popup-left, 0px);
        top: calc(var(--dom-popup-top, 0px) + 200px);
        box-sizing: border-box;
        width: var(--dom-popup-width, 1080px);
        height: 1520px;
        color: #4a2b17;
        font-family: "MabinogiClassic", sans-serif;
        pointer-events: auto;
        transform-origin: center;
        animation: popup-scale-in 300ms cubic-bezier(0.18, 0.89, 0.32, 1.28) both;
    }

    .popup-background {
        --popup-slice-left: 100px;
        --popup-slice-right: 100px;
        --popup-slice-top: 160px;
        --popup-slice-bottom: 160px;
        --popup-slice-overlap: 2px;

        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
    }

    .popup-slice {
        position: absolute;
        display: block;
        pointer-events: none;
        shape-rendering: geometricPrecision;
    }

    .popup-slice-top-left {
        left: 0;
        top: 0;
        width: calc(var(--popup-slice-left) + var(--popup-slice-overlap));
        height: calc(var(--popup-slice-top) + var(--popup-slice-overlap));
    }

    .popup-slice-top {
        left: calc(var(--popup-slice-left) - var(--popup-slice-overlap));
        top: 0;
        width: calc(100% - var(--popup-slice-left) - var(--popup-slice-right) + var(--popup-slice-overlap) * 2);
        height: calc(var(--popup-slice-top) + var(--popup-slice-overlap));
    }

    .popup-slice-top-right {
        right: 0;
        top: 0;
        width: calc(var(--popup-slice-right) + var(--popup-slice-overlap));
        height: calc(var(--popup-slice-top) + var(--popup-slice-overlap));
    }

    .popup-slice-left {
        left: 0;
        top: calc(var(--popup-slice-top) - var(--popup-slice-overlap));
        width: calc(var(--popup-slice-left) + var(--popup-slice-overlap));
        height: calc(100% - var(--popup-slice-top) - var(--popup-slice-bottom) + var(--popup-slice-overlap) * 2);
    }

    .popup-slice-center {
        left: calc(var(--popup-slice-left) - var(--popup-slice-overlap));
        top: calc(var(--popup-slice-top) - var(--popup-slice-overlap));
        width: calc(100% - var(--popup-slice-left) - var(--popup-slice-right) + var(--popup-slice-overlap) * 2);
        height: calc(100% - var(--popup-slice-top) - var(--popup-slice-bottom) + var(--popup-slice-overlap) * 2);
    }

    .popup-slice-right {
        right: 0;
        top: calc(var(--popup-slice-top) - var(--popup-slice-overlap));
        width: calc(var(--popup-slice-right) + var(--popup-slice-overlap));
        height: calc(100% - var(--popup-slice-top) - var(--popup-slice-bottom) + var(--popup-slice-overlap) * 2);
    }

    .popup-slice-bottom-left {
        left: 0;
        bottom: 0;
        width: calc(var(--popup-slice-left) + var(--popup-slice-overlap));
        height: calc(var(--popup-slice-bottom) + var(--popup-slice-overlap));
    }

    .popup-slice-bottom {
        left: calc(var(--popup-slice-left) - var(--popup-slice-overlap));
        bottom: 0;
        width: calc(100% - var(--popup-slice-left) - var(--popup-slice-right) + var(--popup-slice-overlap) * 2);
        height: calc(var(--popup-slice-bottom) + var(--popup-slice-overlap));
    }

    .popup-slice-bottom-right {
        right: 0;
        bottom: 0;
        width: calc(var(--popup-slice-right) + var(--popup-slice-overlap));
        height: calc(var(--popup-slice-bottom) + var(--popup-slice-overlap));
    }

    @keyframes popup-scale-in {
        from {
            opacity: 0;
            transform: scale(0.4);
        }

        to {
            opacity: 1;
            transform: scale(1);
        }
    }

    .popup-close-button {
        position: absolute;
        right: 100px;
        top: 130px;
        z-index: 2;
        display: flex;
        flex: 0 0 auto;
        align-items: center;
        justify-content: center;
        width: 104px;
        min-width: 104px;
        max-width: 104px;
        height: 104px;
        padding: 0;
        border: 6px solid #ffffff;
        border-radius: 50%;
        aspect-ratio: 1 / 1;
        background: rgba(74, 43, 23, 0.96);
        box-shadow: 0 12px 18px rgba(0, 0, 0, 0.22);
        color: #ffffff;
        font-family: "MabinogiClassic", sans-serif;
        font-size: 78px;
        font-weight: 800;
        line-height: 1;
        cursor: pointer;
        pointer-events: auto;
        touch-action: manipulation;
    }

    .popup-content {
        position: relative;
        z-index: 1;
        display: flex;
        min-width: 0;
        height: 100%;
        flex-direction: column;
        align-items: center;
        padding: 230px 110px 150px;
        text-align: center;
    }

    .popup-title {
        margin: 0;
        font-size: 76px;
        font-weight: 800;
        line-height: 1.08;
    }

    .seed-list {
        box-sizing: border-box;
        width: 100%;
        max-height: 520px;
        margin-top: 76px;
        overflow-x: hidden;
        overflow-y: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        pointer-events: auto;
        touch-action: pan-y;
    }

    .seed-list::-webkit-scrollbar {
        display: none;
    }

    .seed-list-item {
        display: flex;
        align-items: center;
        box-sizing: border-box;
        width: 100%;
        min-height: 156px;
        padding: 22px 34px;
        border: 6px solid #8e5c04;
        border-radius: 34px;
        background: rgba(255, 247, 216, 0.96);
        box-shadow: 0 10px 0 rgba(91, 57, 0, 0.24);
        color: #4a2b17;
        font-family: "MabinogiClassic", sans-serif;
        text-align: left;
        cursor: pointer;
        pointer-events: auto;
        touch-action: manipulation;
    }

    .seed-list-item:disabled {
        cursor: not-allowed;
        opacity: 0.55;
    }

    .seed-list-item-selected {
        border-color: #ffde45;
        background: #fff0a8;
        box-shadow:
            0 10px 0 rgba(155, 105, 0, 0.36),
            0 0 0 7px rgba(255, 177, 33, 0.44) inset;
    }

    .seed-list-item + .seed-list-item {
        margin-top: 28px;
    }

    .seed-portrait {
        display: block;
        flex: 0 0 auto;
        width: 112px;
        height: 112px;
        object-fit: contain;
        user-select: none;
        -webkit-user-drag: none;
    }

    .seed-name {
        margin-left: 24px;
        font-size: 42px;
        font-weight: 800;
        line-height: 1.16;
    }

    .seed-count {
        margin-left: auto;
        color: #67472d;
        font-size: 34px;
        font-weight: 800;
        line-height: 1.16;
        white-space: nowrap;
    }

    .seed-empty-message {
        margin: 160px 0 0;
        color: #67472d;
        font-size: 38px;
        font-weight: 800;
    }

    .seed-plant-panel {
        box-sizing: border-box;
        width: 100%;
        margin-top: 56px;
        padding: 38px 44px 42px;
        border: 6px solid #8e5c04;
        border-radius: 34px;
        background: rgba(255, 247, 216, 0.96);
        box-shadow: 0 10px 0 rgba(91, 57, 0, 0.24);
    }

    .seed-plant-title {
        margin: 0;
        font-size: 42px;
        font-weight: 800;
        line-height: 1.18;
    }

    .seed-count-control {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
        margin-top: 30px;
    }

    .seed-count-button,
    .seed-count-max-button,
    .seed-plant-button {
        border: 5px solid #8e5c04;
        background: #fff7d8;
        box-shadow: 0 7px 0 rgba(91, 57, 0, 0.26);
        color: #4a2b17;
        font-family: "MabinogiClassic", sans-serif;
        font-weight: 800;
        cursor: pointer;
        pointer-events: auto;
        touch-action: manipulation;
    }

    .seed-count-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 86px;
        height: 86px;
        border-radius: 24px;
        font-size: 58px;
        line-height: 1;
    }

    .seed-count-button:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }

    .seed-count-value {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 120px;
        height: 86px;
        border: 5px solid #8e5c04;
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.72);
        font-size: 46px;
        font-weight: 800;
    }

    .seed-count-max-button {
        height: 86px;
        padding: 0 30px;
        border-radius: 24px;
        font-size: 36px;
    }

    .seed-grow-time {
        margin: 34px 0 0;
        color: #67472d;
        font-size: 34px;
        font-weight: 800;
    }

    .seed-plant-button {
        width: 100%;
        height: 102px;
        margin-top: 34px;
        border-radius: 30px;
        background: #ffdf3d;
        font-size: 44px;
    }
</style>