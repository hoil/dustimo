export const FIELD_BACKGROUND_TEXTURE_KEY = "field-background";
export const ROSTER_BACKGROUND_TEXTURE_KEY = "roster-background";
export const BEAN_1_TEXTURE_KEY = "bean-1";
export const BACKGROUND_MUSIC_KEY = "background-music";

export const phaserInitialImageAssets = [
    { key: FIELD_BACKGROUND_TEXTURE_KEY, url: "/assets/farm/bg.png" },
    { key: ROSTER_BACKGROUND_TEXTURE_KEY, url: "/assets/roster/bg.png" },
    { key: BEAN_1_TEXTURE_KEY, url: "/assets/beans/bean_1.png" }
] as const;

export const phaserInitialAudioAssets = [
    { key: BACKGROUND_MUSIC_KEY, url: "/assets/sounds/curiosity_quest.mp3" }
] as const;
