<script lang="ts">

    import {
        getInboxItemDefinition,
        type InboxAttachment,
        type InboxItemDefinition,
        type InboxMail
    } from "../inbox";

    export let mails: readonly InboxMail[] = [];
    export let onRead: (mailId: string) => void;
    export let onClaim: (mailId: string, attachmentIds: readonly string[]) => void;
    export let onClose: () => void;

    let selectedMailId: string | null = null;
    let activeItemInfo: InboxItemDefinition | null = null;

    $: selectedMail = selectedMailId
        ? mails.find((mail) => mail.id === selectedMailId) ?? null
        : null;
    $: areSelectedMailAttachmentsClaimed = selectedMail
        ? selectedMail.attachments.every((attachment) => attachment.isClaimed)
        : true;

    const openMailDetail = (mail: InboxMail) => {

        selectedMailId = mail.id;
        onRead(mail.id);

    };

    const closeMailDetail = () => {

        selectedMailId = null;

    };

    const getAttachmentItemDefinition = (attachment: InboxAttachment) => {

        return getInboxItemDefinition(attachment.itemKind);

    };

    const getMailPreviewAttachments = (mail: InboxMail) => {

        return mail.attachments.slice(0, 3);

    };

    const claimSelectedMailAttachments = () => {

        if (!selectedMail)
        {

            return;

        }

        const unclaimedAttachmentIds = selectedMail.attachments
            .filter((attachment) => !attachment.isClaimed)
            .map((attachment) => attachment.id);

        if (unclaimedAttachmentIds.length === 0)
        {

            return;

        }

        onClaim(selectedMail.id, unclaimedAttachmentIds);

    };

    const openItemInfo = (attachment: InboxAttachment) => {

        activeItemInfo = getAttachmentItemDefinition(attachment);

    };

    const closeItemInfo = () => {

        activeItemInfo = null;

    };

</script>

<div class="dom-coordinate-layer inbox-coordinate-layer">
    <button class="inbox-dim" type="button" aria-label="인박스 팝업 닫기" onclick={onClose}></button>

    <div class="inbox-popup" role="dialog" aria-modal="true" aria-label="인박스">
        <header class="inbox-header">
            {#if selectedMail}
                <button class="inbox-back-button" type="button" aria-label="우편 목록으로 돌아가기" onclick={closeMailDetail}>
                    ‹
                </button>
            {/if}
            <h2 class="inbox-title">인박스</h2>
            <button class="inbox-close-button" type="button" aria-label="인박스 닫기" onclick={onClose}>
                ×
            </button>
        </header>

        {#if selectedMail}
            <article class="mail-detail" aria-label="우편 상세 내용">
                <h3 class="mail-detail-title">{selectedMail.title}</h3>
                <p class="mail-detail-body">{selectedMail.body}</p>

                <div class="mail-detail-attachments" aria-label="첨부 아이템">
                    {#each selectedMail.attachments as attachment (attachment.id)}
                        {@const itemDefinition = getAttachmentItemDefinition(attachment)}
                        <button
                            class:mail-attachment-claimed={attachment.isClaimed}
                            class="mail-attachment-tile"
                            type="button"
                            aria-label={`${itemDefinition.name} 정보 보기`}
                            style={`--item-color: ${itemDefinition.color}; --item-border-color: ${itemDefinition.borderColor};`}
                            onclick={() => openItemInfo(attachment)}
                        >
                            <span class="mail-attachment-icon" aria-hidden="true">{itemDefinition.iconLabel}</span>
                            <span class="mail-attachment-name">{itemDefinition.name}</span>
                        </button>
                    {/each}
                </div>

                <button
                    class="mail-claim-button"
                    type="button"
                    disabled={areSelectedMailAttachmentsClaimed}
                    onclick={claimSelectedMailAttachments}
                >
                    {areSelectedMailAttachmentsClaimed ? "수령 완료" : "수령하기"}
                </button>
            </article>
        {:else}
            <div class="mail-list" aria-label="도착한 우편물 목록">
                {#each mails as mail (mail.id)}
                    <button
                        class:mail-row-read={mail.isRead}
                        class="mail-row"
                        type="button"
                        aria-label={`${mail.title} 우편 열기`}
                        onclick={() => openMailDetail(mail)}
                    >
                        <span class="mail-row-title">{mail.title}</span>
                        <span class="mail-row-attachments" aria-label="첨부 아이템 미리보기">
                            {#each getMailPreviewAttachments(mail) as attachment (attachment.id)}
                                {@const itemDefinition = getAttachmentItemDefinition(attachment)}
                                <span
                                    class:mail-row-attachment-claimed={attachment.isClaimed}
                                    class="mail-row-attachment-icon"
                                    style={`--item-color: ${itemDefinition.color}; --item-border-color: ${itemDefinition.borderColor};`}
                                    aria-label={itemDefinition.name}
                                >
                                    {itemDefinition.iconLabel}
                                </span>
                            {/each}
                            {#if mail.attachments.length > 3}
                                <span class="mail-row-more">...</span>
                            {/if}
                        </span>
                    </button>
                {:else}
                    <p class="mail-empty-message">도착한 우편물이 없어요.</p>
                {/each}
            </div>
        {/if}
    </div>

    {#if activeItemInfo}
        <div class="item-info-layer">
            <button class="item-info-dim" type="button" aria-label="아이템 정보 닫기" onclick={closeItemInfo}></button>
            <div class="item-info-popup" role="dialog" aria-modal="true" aria-label="아이템 정보">
                <button class="item-info-close-button" type="button" aria-label="아이템 정보 닫기" onclick={closeItemInfo}>
                    ×
                </button>
                <div
                    class="item-info-thumbnail"
                    style={`--item-color: ${activeItemInfo.color}; --item-border-color: ${activeItemInfo.borderColor};`}
                    aria-hidden="true"
                >
                    {activeItemInfo.iconLabel}
                </div>
                <h3 class="item-info-name">{activeItemInfo.name}</h3>
                <p class="item-info-description">{activeItemInfo.description}</p>
            </div>
        </div>
    {/if}
</div>

<style>
    .inbox-coordinate-layer {
        z-index: 105;
        font-family: "MabinogiClassic", sans-serif;
        pointer-events: auto;
    }

    .inbox-dim,
    .item-info-dim {
        position: absolute;
        left: var(--dom-frame-left, 0px);
        top: var(--dom-frame-top, 0px);
        width: var(--dom-frame-width, 1080px);
        height: var(--dom-frame-height, 1920px);
        padding: 0;
        border: 0;
        background: rgba(0, 0, 0, 0.62);
        cursor: pointer;
        pointer-events: auto;
        touch-action: manipulation;
    }

    .inbox-popup {
        position: absolute;
        left: 50%;
        top: 50%;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        width: 860px;
        height: min(1240px, calc(var(--dom-frame-height, 1920px) - var(--dom-safe-top, 0px) - var(--dom-safe-bottom, 0px) - 260px));
        padding: 38px 38px 42px;
        border: 9px solid #8e5c04;
        border-radius: 46px;
        background:
            radial-gradient(circle at 50% 0%, rgba(255, 234, 162, 0.32), rgba(255, 234, 162, 0) 34%),
            linear-gradient(180deg, #fff7dc 0%, #f3ce8d 100%);
        box-shadow: 0 28px 46px rgba(0, 0, 0, 0.38);
        color: #4a2b17;
        transform: translate(-50%, -50%);
        pointer-events: auto;
    }

    .inbox-header {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        min-height: 92px;
        margin-bottom: 22px;
    }

    .inbox-title {
        margin: 0;
        color: #3d2415;
        font-size: 64px;
        line-height: 1;
    }

    .inbox-back-button,
    .inbox-close-button,
    .item-info-close-button {
        position: absolute;
        display: grid;
        place-items: center;
        width: 84px;
        height: 84px;
        padding: 0;
        border: 7px solid #8e5c04;
        border-radius: 26px;
        background: #fff7d8;
        box-shadow: 0 8px 0 rgba(91, 57, 0, 0.25);
        color: #5a3219;
        font-family: "MabinogiClassic", sans-serif;
        font-size: 54px;
        line-height: 1;
        cursor: pointer;
        pointer-events: auto;
        touch-action: manipulation;
    }

    .inbox-back-button {
        left: 0;
        font-size: 76px;
        padding-bottom: 10px;
    }

    .inbox-close-button {
        right: 0;
    }

    .mail-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
        flex: 1 1 auto;
        min-height: 0;
        padding: 18px;
        border: 7px solid rgba(105, 62, 24, 0.78);
        border-radius: 30px;
        background: rgba(61, 36, 21, 0.15);
        overflow-x: hidden;
        overflow-y: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
    }

    .mail-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 20px;
        box-sizing: border-box;
        min-height: 112px;
        padding: 18px 22px;
        border: 6px solid rgba(105, 62, 24, 0.7);
        border-radius: 24px;
        background: rgba(255, 250, 225, 0.9);
        box-shadow: 0 8px 0 rgba(91, 57, 0, 0.14);
        cursor: pointer;
        pointer-events: auto;
        touch-action: manipulation;
    }

    .mail-row-title {
        min-width: 0;
        overflow: hidden;
        color: #1f1510;
        font-family: "MabinogiClassic", sans-serif;
        font-size: 34px;
        font-weight: 900;
        line-height: 1.15;
        text-align: left;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .mail-row-read .mail-row-title {
        color: rgba(74, 43, 23, 0.48);
    }

    .mail-row-attachments {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 0 0 auto;
    }

    .mail-row-attachment-icon,
    .mail-attachment-icon,
    .item-info-thumbnail {
        display: grid;
        place-items: center;
        box-sizing: border-box;
        border: 8px solid var(--item-border-color);
        border-radius: 18px;
        background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0) 42%),
            var(--item-color);
        color: rgba(54, 31, 18, 0.86);
        font-weight: 900;
        line-height: 1;
    }

    .mail-row-attachment-icon {
        width: 62px;
        height: 62px;
        font-size: 30px;
    }

    .mail-row-attachment-claimed,
    .mail-attachment-claimed .mail-attachment-icon {
        filter: grayscale(1);
        opacity: 0.45;
    }

    .mail-row-more {
        color: #5a3219;
        font-size: 32px;
        font-weight: 900;
    }

    .mail-empty-message {
        margin: auto;
        color: rgba(74, 43, 23, 0.7);
        font-size: 34px;
        text-align: center;
    }

    .mail-detail {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-height: 0;
        padding: 28px;
        border: 7px solid rgba(105, 62, 24, 0.78);
        border-radius: 30px;
        background: rgba(255, 250, 225, 0.82);
        overflow: hidden;
    }

    .mail-detail-title {
        margin: 0 0 24px;
        color: #2d1c12;
        font-size: 44px;
        line-height: 1.18;
        word-break: keep-all;
    }

    .mail-detail-body {
        flex: 0 0 auto;
        max-height: 360px;
        margin: 0 0 28px;
        overflow-y: auto;
        color: #5a3219;
        font-size: 31px;
        font-weight: 800;
        line-height: 1.42;
        word-break: keep-all;
    }

    .mail-detail-attachments {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
        flex: 1 1 auto;
        align-content: start;
        min-height: 0;
        padding: 18px;
        border-radius: 24px;
        background: rgba(61, 36, 21, 0.12);
        overflow-y: auto;
    }

    .mail-attachment-tile {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        min-height: 210px;
        padding: 16px 10px;
        border: 6px solid rgba(105, 62, 24, 0.62);
        border-radius: 24px;
        background: rgba(255, 250, 225, 0.9);
        cursor: pointer;
        pointer-events: auto;
        touch-action: manipulation;
    }

    .mail-attachment-icon {
        width: 104px;
        height: 104px;
        font-size: 52px;
    }

    .mail-attachment-name {
        max-width: 100%;
        color: #4a2b17;
        font-size: 24px;
        font-weight: 900;
        line-height: 1.18;
        text-align: center;
        word-break: keep-all;
    }

    .mail-claim-button {
        flex: 0 0 auto;
        align-self: center;
        width: 420px;
        height: 108px;
        margin-top: 28px;
        border: 8px solid #8e5c04;
        border-radius: 34px;
        background: #ffdf3d;
        box-shadow: 0 12px 0 rgba(91, 57, 0, 0.3);
        color: #4a2b17;
        font-family: "MabinogiClassic", sans-serif;
        font-size: 42px;
        font-weight: 900;
        cursor: pointer;
        pointer-events: auto;
        touch-action: manipulation;
    }

    .mail-claim-button:disabled {
        cursor: not-allowed;
        filter: grayscale(1);
        opacity: 0.58;
    }

    .item-info-layer {
        position: absolute;
        inset: 0;
        z-index: 2;
        pointer-events: auto;
    }

    .item-info-dim {
        background: rgba(0, 0, 0, 0.42);
    }

    .item-info-popup {
        position: absolute;
        left: 50%;
        top: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
        box-sizing: border-box;
        width: 680px;
        min-height: 620px;
        padding: 118px 58px 54px;
        border: 9px solid #8e5c04;
        border-radius: 42px;
        background: rgba(255, 248, 226, 0.98);
        box-shadow: 0 24px 42px rgba(0, 0, 0, 0.36);
        color: #4a2b17;
        transform: translate(-50%, -50%);
        pointer-events: auto;
    }

    .item-info-close-button {
        right: 30px;
        top: 30px;
    }

    .item-info-thumbnail {
        width: 156px;
        height: 156px;
        margin-bottom: 28px;
        border-radius: 30px;
        font-size: 76px;
    }

    .item-info-name {
        margin: 0 0 22px;
        color: #2d1c12;
        font-size: 42px;
        line-height: 1.18;
        text-align: center;
        word-break: keep-all;
    }

    .item-info-description {
        margin: 0;
        color: #5a3219;
        font-size: 31px;
        font-weight: 800;
        line-height: 1.38;
        text-align: center;
        word-break: keep-all;
    }
</style>