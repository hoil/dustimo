export type InboxItemKind = "beta-tester-profile-border";

export type InboxItemDefinition = {
    kind: InboxItemKind;
    name: string;
    description: string;
    color: string;
    borderColor: string;
    iconLabel: string;
};

export type InboxAttachmentDefinition = {
    id: string;
    itemKind: InboxItemKind;
};

export type InboxMailDefinition = {
    id: string;
    title: string;
    body: string;
    attachments: InboxAttachmentDefinition[];
};

export type InboxMailState = {
    id: string;
    isRead: boolean;
    claimedAttachmentIds: string[];
};

export type InboxAttachment = InboxAttachmentDefinition & {
    isClaimed: boolean;
};

export type InboxMail = Omit<InboxMailDefinition, "attachments"> & {
    isRead: boolean;
    attachments: InboxAttachment[];
};

export const INBOX_ITEM_DEFINITIONS = [
    {
        kind: "beta-tester-profile-border",
        name: "베타테스터 프로필테두리",
        description:
            "콩생의 첫 베타 테스트에 함께해 준 유저에게 지급되는 기념 프로필 테두리입니다.",
        color: "#69d8ff",
        borderColor: "#3154b8",
        iconLabel: "β",
    },
] satisfies InboxItemDefinition[];

export const INITIAL_INBOX_MAIL_DEFINITIONS = [
    {
        id: "welcome-beta-tester",
        title: "콩생에 오신 걸 환영합니다!",
        body: "안녕하세요, 콩생 베타테스터님! 먼지모 친구들이 첫 모험을 함께해 주셔서 감사의 마음을 담아 작은 선물을 보냈어요. 앞으로도 콩들이 잘 자랄 수 있게 많이 지켜봐 주세요.",
        attachments: [
            {
                id: "welcome-beta-profile-border",
                itemKind: "beta-tester-profile-border",
            },
        ],
    },
] satisfies InboxMailDefinition[];

export const getInboxItemDefinition = (kind: InboxItemKind) => {
    return (
        INBOX_ITEM_DEFINITIONS.find((definition) => definition.kind === kind) ??
        INBOX_ITEM_DEFINITIONS[0]
    );
};

export const createInitialInboxMailStates = (): InboxMailState[] => {
    return INITIAL_INBOX_MAIL_DEFINITIONS.map((mail) => ({
        id: mail.id,
        isRead: false,
        claimedAttachmentIds: [],
    }));
};

export const mergeInboxMailStatesWithInitialMails = (
    states: readonly InboxMailState[]
) => {
    const stateById = new Map(states.map((state) => [state.id, state]));

    return INITIAL_INBOX_MAIL_DEFINITIONS.map((mail) => {
        const savedState = stateById.get(mail.id);
        const attachmentIds = new Set(
            mail.attachments.map((attachment) => attachment.id)
        );
        const claimedAttachmentIds = (
            savedState?.claimedAttachmentIds ?? []
        ).filter((attachmentId) => attachmentIds.has(attachmentId));

        return {
            id: mail.id,
            isRead: savedState?.isRead ?? false,
            claimedAttachmentIds,
        } satisfies InboxMailState;
    });
};

export const createInboxMails = (states: readonly InboxMailState[]) => {
    const normalizedStates = mergeInboxMailStatesWithInitialMails(states);
    const stateById = new Map(
        normalizedStates.map((state) => [state.id, state])
    );

    return INITIAL_INBOX_MAIL_DEFINITIONS.map((mail) => {
        const state = stateById.get(mail.id);
        const claimedAttachmentIds = new Set(state?.claimedAttachmentIds ?? []);

        return {
            id: mail.id,
            title: mail.title,
            body: mail.body,
            isRead: state?.isRead ?? false,
            attachments: mail.attachments.map((attachment) => ({
                ...attachment,
                isClaimed: claimedAttachmentIds.has(attachment.id),
            })),
        } satisfies InboxMail;
    });
};

export const hasUnreadInboxMails = (mails: readonly InboxMail[]) => {
    return mails.some((mail) => !mail.isRead);
};
