export const FIELD_BACKGROUND_TEXTURE_KEY = "field-background";
export const ROSTER_BACKGROUND_TEXTURE_KEY = "roster-background";
export const BATTLE_BACKGROUND_TEXTURE_KEY = "battle-background";
export const BATTLE_ENEMY_1_TEXTURE_KEY = "battle-enemy-1";
export const BEAN_1_TEXTURE_KEY = "bean-1";
export const BACKGROUND_MUSIC_KEY = "background-music";
export const ALLY_ATTACK_SOUND_KEY = "ally-attack";
export const ENEMY_ATTACK_SOUND_KEY = "enemy-attack";

export const phaserInitialImageAssets = [
    { key: FIELD_BACKGROUND_TEXTURE_KEY, url: "/assets/farm/bg.png" },
    { key: ROSTER_BACKGROUND_TEXTURE_KEY, url: "/assets/roster/bg.png" },
    { key: BATTLE_BACKGROUND_TEXTURE_KEY, url: "/assets/battle/bg/bg_1.png" },
    { key: BATTLE_ENEMY_1_TEXTURE_KEY, url: "/assets/battle/enemy/enemy_1.png" },
    { key: BEAN_1_TEXTURE_KEY, url: "/assets/beans/bean_1.png" }
] as const;

export const phaserInitialAudioAssets = [
    { key: BACKGROUND_MUSIC_KEY, url: "/assets/sounds/curiosity_quest.mp3" },
    { key: ALLY_ATTACK_SOUND_KEY, url: "/assets/sounds/dang.mp3" },
    { key: ENEMY_ATTACK_SOUND_KEY, url: "/assets/sounds/kung.mp3" }
] as const;
