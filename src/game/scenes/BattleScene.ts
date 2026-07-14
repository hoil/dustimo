import { GameObjects, Scene, TintModes } from "phaser";

import { EventBus } from "../EventBus";
import {
    BATTLE_BACKGROUND_TEXTURE_KEY,
    BATTLE_ENEMY_1_TEXTURE_KEY,
    BEAN_1_TEXTURE_KEY,
    ALLY_ATTACK_SOUND_KEY,
    ENEMY_ATTACK_SOUND_KEY,
} from "../preloadAssets";
import { getSafeAreaOrigin, useSafeAreaCamera, useSafeAreaDebugOverlay } from "../SafeArea";
import {
    consumePendingBattleWaveResetEvent,
    getBattleSnapshot,
    getPendingBattleWaveTransitionState,
    markBattleWaveTransitionStarted,
    pauseBattleLoop,
    resumeBattleLoopImmediately,
    subscribeBattleAttackEvents,
    subscribeBattleWaveResetEvents,
    type BattleAttackEvent,
    type BattleTeam,
    type BattleUnitId,
    type BattleUnitState,
    type BattleWaveResetEvent,
} from "../../lib/battleState";
import { BATTLE_AREA_BOTTOM_Y, battleArea } from "../../lib/battleLayout";

const BATTLE_BACKGROUND_DEPTH = 0;
const BATTLE_GUIDE_DEPTH = 1;
const BATTLE_CHARACTER_DEPTH = 3;
const BATTLE_ATTACKER_DEPTH = 30;
const BATTLE_TRANSITION_DEPTH = 80;
const BATTLE_BACKGROUND_GROUND_Y = 760;
const ALLY_BEAN_DISPLAY_SIZE = 120;
const ENEMY_DISPLAY_SIZE = 150;
const ALLY_LAYOUTS = [
    { key: "ally-4", x: 120 },
    { key: "ally-3", x: 240 },
    { key: "ally-2", x: 360 },
    { key: "ally-1", x: 480 },
] as const;
const ENEMY_LAYOUTS = [
    { key: "enemy-1", x: 620 },
    { key: "enemy-2", x: 745 },
    { key: "enemy-3", x: 870 },
    { key: "enemy-4", x: 995 },
] as const;
const ENEMY_LAYOUT_GAP = 125;
const ENEMY_LAYOUT_CENTER_X = (ENEMY_LAYOUTS[0].x + ENEMY_LAYOUTS[ENEMY_LAYOUTS.length - 1].x) / 2;
const BREATHING_TWEEN_DURATION = 1050;
const BREATHING_SCALE_X = 1.035;
const BREATHING_SCALE_Y = 0.965;
const ATTACK_MOVE_DURATION = 150;
const ATTACK_RETURN_DURATION = 160;
const ATTACK_PRE_HIT_DELAY = 120;
const ATTACK_POST_HIT_DELAY = 120;
const ATTACK_SOUND_MAX_EVENT_AGE_MS = 900;
const ATTACK_SOUND_FOCUS_RESTORE_GRACE_MS = 250;
const MELEE_ATTACK_GAP = 82;
const HP_BAR_WIDTH = 92;
const HP_BAR_HEIGHT = 12;
const HP_BAR_Y = 22;
const HP_BAR_BG_COLOR = 0x2b1417;
const HP_BAR_FILL_COLOR = 0x62d85f;
const HP_BAR_DANGER_COLOR = 0xff6b59;
const ALLY_HIT_TINT = 0xff3b30;
const ENEMY_HIT_TINT = 0xffffff;
const ENEMY_HIT_FLASH_DURATION = 90;
const HIT_SHAKE_DISTANCE = 18;
const HIT_SHAKE_DURATION = 45;
const DEAD_UNIT_ALPHA = 0.25;
const WAVE_ALLY_EXIT_DURATION = 520;
const WAVE_ALLY_ENTER_DURATION = 560;
const WAVE_FADE_DURATION = 320;
const WAVE_FADE_HOLD_DURATION = 120;
const WAVE_OFFSCREEN_PADDING = 180;
const WAVE_ALLY_ENTER_STAGGER = 55;
const WAVE_ALLY_EXIT_END_MS = WAVE_ALLY_EXIT_DURATION;
const WAVE_FADE_OUT_END_MS = WAVE_ALLY_EXIT_END_MS + WAVE_FADE_DURATION;
const WAVE_FADE_HOLD_END_MS = WAVE_FADE_OUT_END_MS + WAVE_FADE_HOLD_DURATION;
const WAVE_FADE_IN_END_MS = WAVE_FADE_HOLD_END_MS + WAVE_FADE_DURATION;
const WAVE_ALLY_ENTER_START_MS = WAVE_FADE_IN_END_MS;
const WAVE_TRANSITION_TOTAL_DURATION_MS = WAVE_ALLY_ENTER_START_MS
    + WAVE_ALLY_ENTER_DURATION
    + (ALLY_LAYOUTS.length - 1) * WAVE_ALLY_ENTER_STAGGER;

type BattleUnit = {
    key: BattleUnitId;
    team: BattleTeam;
    container: GameObjects.Container;
    sprite: GameObjects.Image;
    hitFlash: GameObjects.Image | null;
    hpBarBg: GameObjects.Rectangle;
    hpBarFill: GameObjects.Rectangle;
    homeX: number;
    depth: number;
};

type BattleTweenConfig = Omit<Phaser.Types.Tweens.TweenBuilderConfig, "targets">;
type BattleTweenTarget = GameObjects.GameObject | GameObjects.GameObject[];

export class BattleScene extends Scene {
    private battleBackground: GameObjects.Image | null = null;
    private cartFarmBackdrop: GameObjects.Rectangle | null = null;
    private battleSeparator: GameObjects.Rectangle | null = null;
    private battleFadeOverlay: GameObjects.Rectangle | null = null;
    private allyBeans: GameObjects.Image[] = [];
    private allyUnits: BattleUnit[] = [];
    private enemyUnits: BattleUnit[] = [];
    private unsubscribeBattleAttackEvents: (() => void) | null = null;
    private unsubscribeBattleWaveResetEvents: (() => void) | null = null;
    private attackEventQueue: BattleAttackEvent[] = [];
    private pendingWaveResetEvent: BattleWaveResetEvent | null = null;
    private isAttackAnimationPlaying = false;
    private isWaveTransitionPlaying = false;
    private isSceneActive = false;
    private isDocumentVisible = typeof document === "undefined" || document.visibilityState === "visible";
    private isWindowFocused = typeof document === "undefined" || document.hasFocus();
    private lastFocusRestoredAt = 0;
    private animationVersion = 0;

    constructor() {
        super("BattleScene");
    }

    create() {
        useSafeAreaCamera(this);
        this.cameras.main.setBackgroundColor("#171019");
        this.resetRuntimeFlowState();

        this.createBattleAreaPlaceholder();
        this.createCartFarmBackdrop();
        this.createBattleCharacters();
        this.updateExtendedAreaLayout();
        this.isSceneActive = true;
        this.resumeBattleViewFromState();
        this.unsubscribeBattleAttackEvents = subscribeBattleAttackEvents(this.queueBattleAttackEvent);
        this.unsubscribeBattleWaveResetEvents = subscribeBattleWaveResetEvents(this.applyBattleWaveResetEvent);
        this.scale.on("resize", this.updateExtendedAreaLayout, this);
        this.registerAudioFocusListeners();
        this.events.once("shutdown", () => {
            this.resetRuntimeFlowState();
            this.unsubscribeBattleAttackEvents?.();
            this.unsubscribeBattleAttackEvents = null;
            this.unsubscribeBattleWaveResetEvents?.();
            this.unsubscribeBattleWaveResetEvents = null;
            this.scale.off("resize", this.updateExtendedAreaLayout, this);
            this.unregisterAudioFocusListeners();
        });
        useSafeAreaDebugOverlay(this);
        EventBus.emit("current-scene-ready", this);
    }

    private resumeBattleViewFromState() {
        this.attackEventQueue = [];
        this.isAttackAnimationPlaying = false;
        this.isWaveTransitionPlaying = false;
        this.animationVersion += 1;
        this.getBattleUnits().forEach((unit) => {
            this.tweens.killTweensOf(unit.container);
        });
        this.battleFadeOverlay?.setVisible(false).setAlpha(0);
        this.applyUnitStates(getBattleSnapshot().units);
        const pendingWaveTransitionState = getPendingBattleWaveTransitionState();

        if (pendingWaveTransitionState) {
            this.playWaveTransition(
                pendingWaveTransitionState.event,
                pendingWaveTransitionState.elapsedMs
            );

            return;
        }

        resumeBattleLoopImmediately();
    }

    private resetRuntimeFlowState() {
        this.isSceneActive = false;
        this.isAttackAnimationPlaying = false;
        this.isWaveTransitionPlaying = false;
        this.attackEventQueue = [];
        this.pendingWaveResetEvent = null;
        this.animationVersion += 1;
        this.tweens.killAll();
        this.battleFadeOverlay?.setVisible(false).setAlpha(0);
    }

    private createBattleAreaPlaceholder() {
        const battleCenterX = battleArea.x + battleArea.width / 2;
        const battleCenterY = battleArea.y + battleArea.height / 2;

        this.battleBackground = this.add
            .image(
                battleCenterX,
                battleCenterY,
                BATTLE_BACKGROUND_TEXTURE_KEY
            )
            .setDepth(BATTLE_BACKGROUND_DEPTH);

        this.battleSeparator = this.add
            .rectangle(
                battleCenterX,
                BATTLE_AREA_BOTTOM_Y,
                battleArea.width,
                8,
                0xffd47a,
                0.85
            )
            .setDepth(BATTLE_GUIDE_DEPTH + 1);

        this.battleFadeOverlay = this.add
            .rectangle(
                battleCenterX,
                battleCenterY,
                battleArea.width,
                battleArea.height,
                0x000000,
                1
            )
            .setAlpha(0)
            .setDepth(BATTLE_TRANSITION_DEPTH)
            .setVisible(false);
    }

    private createCartFarmBackdrop() {
        this.cartFarmBackdrop = this.add
            .rectangle(
                battleArea.x + battleArea.width / 2,
                BATTLE_AREA_BOTTOM_Y + 1,
                battleArea.width,
                1,
                0x241a14
            )
            .setDepth(BATTLE_BACKGROUND_DEPTH);
    }

    private createBattleCharacters() {
        const unitStates = new Map(
            getBattleSnapshot().units.map((unit) => [unit.id, unit])
        );

        this.allyUnits = ALLY_LAYOUTS.map((layout, index) => {
            const allyBean = this.add
                .image(0, 0, BEAN_1_TEXTURE_KEY)
                .setOrigin(0.5, 1)
                .setDisplaySize(ALLY_BEAN_DISPLAY_SIZE, ALLY_BEAN_DISPLAY_SIZE);
            const hpBarBg = this.createHpBarBackground();
            const hpBarFill = this.createHpBarFill();
            const container = this.add
                .container(layout.x, BATTLE_AREA_BOTTOM_Y, [allyBean, hpBarBg, hpBarFill])
                .setDepth(BATTLE_CHARACTER_DEPTH + index);

            this.applyBreathingAnimation(allyBean, index * 130);

            const battleUnit: BattleUnit = {
                key: layout.key,
                team: "ally",
                container,
                sprite: allyBean,
                hitFlash: null,
                hpBarBg,
                hpBarFill,
                homeX: layout.x,
                depth: BATTLE_CHARACTER_DEPTH + index,
            };

            this.applyUnitState(battleUnit, unitStates.get(layout.key));

            return battleUnit;
        });
        this.allyBeans = this.allyUnits.map((unit) => unit.sprite);

        this.enemyUnits = ENEMY_LAYOUTS.map((layout, index) => {
            const enemy = this.add
                .image(0, 0, BATTLE_ENEMY_1_TEXTURE_KEY)
                .setOrigin(0.5, 1)
                .setDisplaySize(ENEMY_DISPLAY_SIZE, ENEMY_DISPLAY_SIZE);
            const enemyHitFlash = this.add
                .image(0, 0, BATTLE_ENEMY_1_TEXTURE_KEY)
                .setOrigin(0.5, 1)
                .setDisplaySize(ENEMY_DISPLAY_SIZE, ENEMY_DISPLAY_SIZE)
                .setTint(ENEMY_HIT_TINT)
                .setTintMode(TintModes.FILL)
                .setAlpha(0);
            const hpBarBg = this.createHpBarBackground();
            const hpBarFill = this.createHpBarFill();
            const container = this.add
                .container(layout.x, BATTLE_AREA_BOTTOM_Y, [enemy, enemyHitFlash, hpBarBg, hpBarFill])
                .setDepth(BATTLE_CHARACTER_DEPTH + this.allyUnits.length + index);

            this.applyBreathingAnimation([enemy, enemyHitFlash], 260 + index * 130);

            const battleUnit: BattleUnit = {
                key: layout.key,
                team: "enemy",
                container,
                sprite: enemy,
                hitFlash: enemyHitFlash,
                hpBarBg,
                hpBarFill,
                homeX: layout.x,
                depth: BATTLE_CHARACTER_DEPTH + this.allyUnits.length + index,
            };

            this.applyUnitState(battleUnit, unitStates.get(layout.key));

            return battleUnit;
        });
    }

    private createHpBarBackground() {
        return this.add
            .rectangle(0, HP_BAR_Y, HP_BAR_WIDTH + 6, HP_BAR_HEIGHT + 6, HP_BAR_BG_COLOR, 0.95)
            .setOrigin(0.5);
    }

    private createHpBarFill() {
        return this.add
            .rectangle(-HP_BAR_WIDTH / 2, HP_BAR_Y, HP_BAR_WIDTH, HP_BAR_HEIGHT, HP_BAR_FILL_COLOR, 1)
            .setOrigin(0, 0.5);
    }

    private getBattleUnit(key: BattleUnitId) {
        return [...this.allyUnits, ...this.enemyUnits].find((unit) => unit.key === key) ?? null;
    }

    private getBattleUnits() {
        return [...this.allyUnits, ...this.enemyUnits];
    }

    private applyBattleWaveResetEvent = (event: BattleWaveResetEvent) => {
        if (!this.isSceneActive) {
            return;
        }

        pauseBattleLoop();

        if (this.isAttackAnimationPlaying || this.attackEventQueue.length > 0) {
            this.pendingWaveResetEvent = event;

            return;
        }

        this.playWaveTransition(event);
    };

    private playPendingWaveTransition() {
        if (!this.pendingWaveResetEvent || this.isAttackAnimationPlaying || this.isWaveTransitionPlaying) {
            return;
        }

        const event = this.pendingWaveResetEvent;
        this.pendingWaveResetEvent = null;
        this.playWaveTransition(event);
    }

    private async playWaveTransition(event: BattleWaveResetEvent, elapsedMs = 0) {
        if (this.isWaveTransitionPlaying) {
            this.attackEventQueue = [];
            this.pendingWaveResetEvent = event;
            this.applyUnitStates(event.units);

            return;
        }

        markBattleWaveTransitionStarted(event.id);

        this.attackEventQueue = [];
        this.isWaveTransitionPlaying = true;
        this.animationVersion += 1;
        const transitionElapsedMs = this.clampWaveTransitionElapsed(elapsedMs);
        this.getBattleUnits().forEach((unit) => {
            this.tweens.killTweensOf(unit.container);
        });

        this.applyWaveTransitionState(event, transitionElapsedMs);

        if (transitionElapsedMs >= WAVE_TRANSITION_TOTAL_DURATION_MS) {
            this.completeWaveTransition(event);

            return;
        }

        if (transitionElapsedMs < WAVE_ALLY_EXIT_END_MS) {
            await this.runAlliesOffscreenRight(WAVE_ALLY_EXIT_END_MS - transitionElapsedMs);

            if (!this.isSceneActive) {
                return;
            }
        }

        if (transitionElapsedMs < WAVE_FADE_OUT_END_MS) {
            await this.fadeBattleAreaToBlack(WAVE_FADE_OUT_END_MS - Math.max(transitionElapsedMs, WAVE_ALLY_EXIT_END_MS));

            if (!this.isSceneActive) {
                return;
            }
        }

        if (transitionElapsedMs < WAVE_ALLY_ENTER_START_MS) {
            this.applyUnitStates(event.units);
            this.placeAlliesOffscreenLeft();
        }

        if (transitionElapsedMs < WAVE_FADE_HOLD_END_MS) {
            await this.wait(WAVE_FADE_HOLD_END_MS - Math.max(transitionElapsedMs, WAVE_FADE_OUT_END_MS));

            if (!this.isSceneActive) {
                return;
            }
        }

        if (transitionElapsedMs < WAVE_FADE_IN_END_MS) {
            await this.fadeBattleAreaFromBlack(WAVE_FADE_IN_END_MS - Math.max(transitionElapsedMs, WAVE_FADE_HOLD_END_MS));

            if (!this.isSceneActive) {
                return;
            }
        }

        await this.runAlliesToHomeFromElapsed(Math.max(transitionElapsedMs, WAVE_ALLY_ENTER_START_MS));

        if (!this.isSceneActive) {
            return;
        }

        this.completeWaveTransition(event);
    }

    private completeWaveTransition(event: BattleWaveResetEvent) {
        if (!this.isSceneActive) {
            return;
        }

        this.attackEventQueue = [];
        this.applyUnitStates(getBattleSnapshot().units);
        this.allyUnits.forEach((unit) => {
            unit.container.setDepth(unit.depth);
        });
        this.isAttackAnimationPlaying = false;
        this.isWaveTransitionPlaying = false;
        this.pendingWaveResetEvent = null;
        consumePendingBattleWaveResetEvent(event.id);
        resumeBattleLoopImmediately();
    }

    private runAlliesOffscreenRight(duration = WAVE_ALLY_EXIT_DURATION) {
        const exitX = this.getFrameRight() + WAVE_OFFSCREEN_PADDING;

        return this.tweenBattleTarget(this.allyUnits.map((unit) => unit.container), {
            x: exitX,
            duration: Math.max(0, duration),
            ease: "Sine.easeIn",
        });
    }

    private placeAlliesOffscreenLeft() {
        const enterX = this.getFrameLeft() - WAVE_OFFSCREEN_PADDING;

        this.allyUnits.forEach((unit) => {
            unit.container
                .setX(enterX)
                .setAlpha(1)
                .setVisible(true)
                .setDepth(BATTLE_ATTACKER_DEPTH);
        });
    }

    private runAlliesToHomeFromElapsed(elapsedMs = WAVE_ALLY_ENTER_START_MS) {
        return Promise.all(
            this.allyUnits.map((unit, index) => {
                const unitStartMs = WAVE_ALLY_ENTER_START_MS + index * WAVE_ALLY_ENTER_STAGGER;
                const unitEndMs = unitStartMs + WAVE_ALLY_ENTER_DURATION;

                if (elapsedMs >= unitEndMs) {
                    unit.container.setX(unit.homeX);

                    return Promise.resolve();
                }

                return this.tweenBattleTarget(unit.container, {
                    x: unit.homeX,
                    duration: Math.max(0, unitEndMs - Math.max(elapsedMs, unitStartMs)),
                    delay: Math.max(0, unitStartMs - elapsedMs),
                    ease: "Sine.easeOut",
                });
            })
        ).then(() => undefined);
    }

    private fadeBattleAreaToBlack(duration = WAVE_FADE_DURATION) {
        this.updateBattleFadeOverlayLayout();
        this.battleFadeOverlay?.setVisible(true);

        return this.tweenBattleTarget(this.battleFadeOverlay ? [this.battleFadeOverlay] : [], {
            alpha: 1,
            duration: Math.max(0, duration),
            ease: "Sine.easeInOut",
        });
    }

    private async fadeBattleAreaFromBlack(duration = WAVE_FADE_DURATION) {
        await this.tweenBattleTarget(this.battleFadeOverlay ? [this.battleFadeOverlay] : [], {
            alpha: 0,
            duration: Math.max(0, duration),
            ease: "Sine.easeInOut",
        });

        this.battleFadeOverlay?.setVisible(false);
    }

    private applyWaveTransitionState(event: BattleWaveResetEvent, elapsedMs: number) {
        const exitX = this.getFrameRight() + WAVE_OFFSCREEN_PADDING;
        const enterX = this.getFrameLeft() - WAVE_OFFSCREEN_PADDING;

        this.updateBattleFadeOverlayLayout();

        if (elapsedMs < WAVE_ALLY_EXIT_END_MS) {
            const exitProgress = this.easeSineIn(elapsedMs / WAVE_ALLY_EXIT_DURATION);

            this.enemyUnits.forEach((unit) => {
                unit.container
                    .setAlpha(0)
                    .setVisible(false)
                    .setDepth(unit.depth);
            });
            this.allyUnits.forEach((unit) => {
                unit.container
                    .setX(this.lerp(unit.homeX, exitX, exitProgress))
                    .setAlpha(1)
                    .setVisible(true)
                    .setDepth(BATTLE_ATTACKER_DEPTH);
            });
            this.battleFadeOverlay?.setAlpha(0).setVisible(false);

            return;
        }

        if (elapsedMs < WAVE_FADE_OUT_END_MS) {
            const fadeProgress = this.easeSineInOut((elapsedMs - WAVE_ALLY_EXIT_END_MS) / WAVE_FADE_DURATION);

            this.enemyUnits.forEach((unit) => {
                unit.container
                    .setAlpha(0)
                    .setVisible(false)
                    .setDepth(unit.depth);
            });
            this.allyUnits.forEach((unit) => {
                unit.container
                    .setX(exitX)
                    .setAlpha(1)
                    .setVisible(true)
                    .setDepth(BATTLE_ATTACKER_DEPTH);
            });
            this.battleFadeOverlay?.setAlpha(fadeProgress).setVisible(true);

            return;
        }

        this.applyUnitStates(event.units);
        this.allyUnits.forEach((unit) => {
            unit.container
                .setX(enterX)
                .setAlpha(1)
                .setVisible(true)
                .setDepth(BATTLE_ATTACKER_DEPTH);
        });

        if (elapsedMs < WAVE_FADE_HOLD_END_MS) {
            this.battleFadeOverlay?.setAlpha(1).setVisible(true);

            return;
        }

        if (elapsedMs < WAVE_FADE_IN_END_MS) {
            const fadeProgress = this.easeSineInOut((elapsedMs - WAVE_FADE_HOLD_END_MS) / WAVE_FADE_DURATION);

            this.battleFadeOverlay?.setAlpha(1 - fadeProgress).setVisible(true);

            return;
        }

        this.battleFadeOverlay?.setAlpha(0).setVisible(false);
        this.allyUnits.forEach((unit, index) => {
            const unitStartMs = WAVE_ALLY_ENTER_START_MS + index * WAVE_ALLY_ENTER_STAGGER;
            const unitProgress = this.easeSineOut((elapsedMs - unitStartMs) / WAVE_ALLY_ENTER_DURATION);

            unit.container
                .setX(this.lerp(enterX, unit.homeX, unitProgress))
                .setAlpha(1)
                .setVisible(true)
                .setDepth(BATTLE_ATTACKER_DEPTH);
        });
    }

    private clampWaveTransitionElapsed(elapsedMs: number) {
        return Math.min(WAVE_TRANSITION_TOTAL_DURATION_MS, Math.max(0, elapsedMs));
    }

    private lerp(start: number, end: number, progress: number) {
        const clampedProgress = Math.min(1, Math.max(0, progress));

        return start + (end - start) * clampedProgress;
    }

    private easeSineIn(progress: number) {
        const clampedProgress = Math.min(1, Math.max(0, progress));

        return 1 - Math.cos((clampedProgress * Math.PI) / 2);
    }

    private easeSineOut(progress: number) {
        const clampedProgress = Math.min(1, Math.max(0, progress));

        return Math.sin((clampedProgress * Math.PI) / 2);
    }

    private easeSineInOut(progress: number) {
        const clampedProgress = Math.min(1, Math.max(0, progress));

        return -(Math.cos(Math.PI * clampedProgress) - 1) / 2;
    }

    private applyUnitStates(unitStates: BattleUnitState[]) {
        const unitStateById = new Map(
            unitStates.map((unitState) => [unitState.id, unitState])
        );

        this.updateEnemyHomePositions(unitStates);

        this.getBattleUnits().forEach((unit) => {
            this.applyUnitState(unit, unitStateById.get(unit.key));
        });
    }

    private updateEnemyHomePositions(unitStates: BattleUnitState[]) {
        const visibleEnemyStates = unitStates
            .filter((unitState) => unitState.team === "enemy")
            .sort((a, b) => a.slotIndex - b.slotIndex);
        const startX = ENEMY_LAYOUT_CENTER_X - ENEMY_LAYOUT_GAP * (visibleEnemyStates.length - 1) / 2;

        visibleEnemyStates.forEach((unitState, index) => {
            const enemyUnit = this.getBattleUnit(unitState.id);

            if (!enemyUnit) {
                return;
            }

            enemyUnit.homeX = startX + ENEMY_LAYOUT_GAP * index;
        });
    }

    private applyUnitState(unit: BattleUnit, unitState?: BattleUnitState) {
        if (!unitState) {
            unit.container
                .setVisible(false)
                .setAlpha(0)
                .setDepth(unit.depth)
                .setX(unit.homeX);
            unit.sprite.clearTint();
            unit.hitFlash?.setAlpha(0);
            this.updateHpBar(unit, 0, 1);

            return;
        }

        unit.container
            .setX(unit.homeX)
            .setDepth(unit.depth)
            .setAlpha(unitState.isAlive === false ? DEAD_UNIT_ALPHA : 1)
            .setVisible(true);
        unit.sprite.clearTint();
        unit.hitFlash?.setAlpha(0);
        this.updateHpBar(unit, unitState.hp, unitState.maxHp);
    }

    private updateHpBar(unit: BattleUnit, hp: number, maxHp: number) {
        const hpRatio = maxHp > 0
            ? Math.min(1, Math.max(0, hp / maxHp))
            : 0;

        unit.hpBarFill
            .setSize(Math.max(1, HP_BAR_WIDTH * hpRatio), HP_BAR_HEIGHT)
            .setFillStyle(hpRatio <= 0.3 ? HP_BAR_DANGER_COLOR : HP_BAR_FILL_COLOR, 1);
    }

    private applyBreathingAnimation(target: GameObjects.Image | GameObjects.Image[], delay = 0) {
        const targets = Array.isArray(target) ? target : [target];

        targets.forEach((singleTarget) => {
            const baseScaleX = singleTarget.scaleX;
            const baseScaleY = singleTarget.scaleY;

            this.tweens.add({
                targets: singleTarget,
                scaleX: baseScaleX * BREATHING_SCALE_X,
                scaleY: baseScaleY * BREATHING_SCALE_Y,
                duration: BREATHING_TWEEN_DURATION,
                delay,
                ease: "Sine.easeInOut",
                yoyo: true,
                repeat: -1,
            });
        });
    }

    private queueBattleAttackEvent = (event: BattleAttackEvent) => {
        if (!this.isSceneActive) {
            return;
        }

        if (this.isWaveTransitionPlaying) {
            return;
        }

        this.attackEventQueue.push(event);

        this.playQueuedBattleAttackEvents();
    };

    private async playQueuedBattleAttackEvents() {
        if (this.isAttackAnimationPlaying) {
            return;
        }

        this.isAttackAnimationPlaying = true;

        try {
            while (this.isSceneActive && this.attackEventQueue.length > 0) {
                const event = this.attackEventQueue.shift();

                if (!event) {
                    continue;
                }

                const attacker = this.getBattleUnit(event.attackerId);
                const target = this.getBattleUnit(event.targetId);

                if (!attacker || !target) {
                    continue;
                }

                await this.performMeleeAttack(attacker, target, event);
            }
        } finally {
            this.isAttackAnimationPlaying = false;
            this.playPendingWaveTransition();
        }
    }

    private playAttackSound(attackerTeam: BattleTeam, eventCreatedAt: number) {
        if (!this.shouldPlayAttackSound(eventCreatedAt)) {
            return;
        }

        const soundKey = attackerTeam === "ally"
            ? ALLY_ATTACK_SOUND_KEY
            : ENEMY_ATTACK_SOUND_KEY;

        try {
            this.sound.play(soundKey);
        } catch {
            // Ignore sound playback failures caused by browser audio policies.
        }
    }

    private shouldPlayAttackSound(eventCreatedAt: number) {
        const now = performance.now();

        if (!this.isDocumentVisible || !this.isWindowFocused) {
            return false;
        }

        if (now - this.lastFocusRestoredAt < ATTACK_SOUND_FOCUS_RESTORE_GRACE_MS) {
            return false;
        }

        return now - eventCreatedAt <= ATTACK_SOUND_MAX_EVENT_AGE_MS;
    }

    private registerAudioFocusListeners() {
        this.updateAudioFocusState();

        if (typeof document !== "undefined") {
            document.addEventListener("visibilitychange", this.handleDocumentVisibilityChange);
        }

        if (typeof window !== "undefined") {
            window.addEventListener("focus", this.handleWindowFocus);
            window.addEventListener("blur", this.handleWindowBlur);
        }
    }

    private unregisterAudioFocusListeners() {
        if (typeof document !== "undefined") {
            document.removeEventListener("visibilitychange", this.handleDocumentVisibilityChange);
        }

        if (typeof window !== "undefined") {
            window.removeEventListener("focus", this.handleWindowFocus);
            window.removeEventListener("blur", this.handleWindowBlur);
        }
    }

    private updateAudioFocusState() {
        const wasAudible = this.isDocumentVisible && this.isWindowFocused;

        this.isDocumentVisible = typeof document === "undefined" || document.visibilityState === "visible";
        this.isWindowFocused = typeof document === "undefined" || document.hasFocus();

        if (!wasAudible && this.isDocumentVisible && this.isWindowFocused) {
            this.lastFocusRestoredAt = performance.now();
        }
    }

    private handleDocumentVisibilityChange = () => {
        this.updateAudioFocusState();
    };

    private handleWindowFocus = () => {
        this.updateAudioFocusState();
    };

    private handleWindowBlur = () => {
        this.updateAudioFocusState();
    };

    private async performMeleeAttack(attacker: BattleUnit, target: BattleUnit, event: BattleAttackEvent) {
        const animationVersion = this.animationVersion;
        const attackX = attacker.team === "ally"
            ? target.homeX - MELEE_ATTACK_GAP
            : target.homeX + MELEE_ATTACK_GAP;

        attacker.container.setDepth(BATTLE_ATTACKER_DEPTH);

        await this.tweenBattleTarget(attacker.container, {
            x: attackX,
            duration: ATTACK_MOVE_DURATION,
            ease: "Sine.easeOut",
        });

        if (!this.isSceneActive || animationVersion !== this.animationVersion) {
            return;
        }

        await this.wait(ATTACK_PRE_HIT_DELAY);

        if (!this.isSceneActive || animationVersion !== this.animationVersion) {
            return;
        }

        this.playAttackSound(attacker.team, event.createdAt);
        this.playHitEffect(target, event);
        await this.wait(ATTACK_POST_HIT_DELAY);

        if (!this.isSceneActive || animationVersion !== this.animationVersion) {
            return;
        }

        await this.tweenBattleTarget(attacker.container, {
            x: attacker.homeX,
            duration: ATTACK_RETURN_DURATION,
            ease: "Sine.easeInOut",
        });

        attacker.container.setX(attacker.homeX);
        attacker.container.setDepth(attacker.depth);
    }

    private playHitEffect(target: BattleUnit, event: BattleAttackEvent) {
        const hitTint = target.team === "ally"
            ? ALLY_HIT_TINT
            : ENEMY_HIT_TINT;

        if (target.team === "enemy") {
            this.playEnemyHitFlash(target);
        } else {
            target.sprite.setTint(hitTint);
            this.time.delayedCall(90, () => {
                target.sprite.clearTint();
            });
        }
        this.updateHpBar(target, event.targetHp, event.targetMaxHp);
        this.playHitShake(target);

        const hitText = this.add
            .text(target.container.x, target.container.y - target.sprite.displayHeight * 0.72, `${event.damage}`, {
                color: "#fff0a8",
                fontFamily: "MabinogiClassic, sans-serif",
                fontSize: "44px",
                stroke: "#5a1b14",
                strokeThickness: 8,
            })
            .setOrigin(0.5)
            .setDepth(BATTLE_ATTACKER_DEPTH + 1);

        this.tweens.add({
            targets: hitText,
            y: hitText.y - 42,
            alpha: 0,
            duration: 360,
            ease: "Sine.easeOut",
            onComplete: () => {
                hitText.destroy();
            },
        });

        if (event.isTargetDead) {
            this.playDeathEffect(target);
        }
    }

    private playEnemyHitFlash(target: BattleUnit) {
        if (!target.hitFlash) {
            target.sprite
                .setTint(ENEMY_HIT_TINT)
                .setTintMode(TintModes.FILL);
            this.time.delayedCall(90, () => {
                target.sprite.clearTint();
            });

            return;
        }

        this.tweens.killTweensOf(target.hitFlash);
        target.hitFlash
            .setTint(ENEMY_HIT_TINT)
            .setTintMode(TintModes.FILL)
            .setAlpha(1);

        this.tweens.add({
            targets: target.hitFlash,
            alpha: 0,
            duration: ENEMY_HIT_FLASH_DURATION,
            ease: "Sine.easeOut",
            onComplete: () => {
                target.hitFlash?.setAlpha(0);
            },
        });
    }

    private playHitShake(target: BattleUnit) {
        const baseX = target.container.x;
        const hitOffset = target.team === "ally"
            ? -HIT_SHAKE_DISTANCE
            : HIT_SHAKE_DISTANCE;

        this.tweens.add({
            targets: target.container,
            x: baseX + hitOffset,
            duration: HIT_SHAKE_DURATION,
            ease: "Sine.easeOut",
            yoyo: true,
            onComplete: () => {
                target.container.setX(baseX);
            },
        });
    }

    private playDeathEffect(target: BattleUnit) {
        this.tweens.add({
            targets: target.container,
            alpha: DEAD_UNIT_ALPHA,
            duration: 180,
            ease: "Sine.easeOut",
        });
    }

    private tweenBattleTarget(
        target: BattleTweenTarget,
        config: BattleTweenConfig
    ) {
        return new Promise<void>((resolve) => {
            const onComplete = config.onComplete;
            const onStop = config.onStop;

            this.tweens.add({
                ...config,
                targets: target,
                onComplete: () => {
                    if (typeof onComplete === "function") {
                        onComplete(this.tweens);
                    }

                    resolve();
                },
                onStop: () => {
                    if (typeof onStop === "function") {
                        onStop(this.tweens);
                    }

                    resolve();
                },
            });
        });
    }

    private wait(duration: number) {
        return new Promise<void>((resolve) => {
            this.time.delayedCall(duration, () => {
                resolve();
            });
        });
    }

    private updateExtendedAreaLayout() {
        const origin = getSafeAreaOrigin(this.scale);
        const frameLeft = -origin.x;
        const frameTop = -origin.y;
        const frameWidth = this.scale.width;
        const frameHeight = this.scale.height;
        const frameCenterX = frameLeft + frameWidth / 2;
        const frameBottom = frameTop + frameHeight;
        const battleHeight = Math.max(1, BATTLE_AREA_BOTTOM_Y - frameTop);
        const cartFarmHeight = Math.max(1, frameBottom - BATTLE_AREA_BOTTOM_Y);

        if (this.battleBackground) {
            const backgroundScale = Math.max(
                frameWidth / this.battleBackground.width,
                battleHeight / this.battleBackground.height
            );
            const backgroundDisplayHeight = this.battleBackground.height * backgroundScale;
            const backgroundY = BATTLE_AREA_BOTTOM_Y - backgroundDisplayHeight / 2;
            const backgroundTop = backgroundY - backgroundDisplayHeight / 2;
            const groundWorldY = backgroundTop + BATTLE_BACKGROUND_GROUND_Y * backgroundScale;

            this.battleBackground
                .setScale(backgroundScale)
                .setPosition(frameCenterX, backgroundY);

            this.updateBattleCharacterGroundY(groundWorldY);
        }

        this.battleSeparator
            ?.setPosition(frameCenterX, BATTLE_AREA_BOTTOM_Y)
            .setSize(frameWidth, 8);

        this.cartFarmBackdrop
            ?.setPosition(frameCenterX, BATTLE_AREA_BOTTOM_Y + cartFarmHeight / 2)
            .setSize(frameWidth, cartFarmHeight);

        this.updateBattleFadeOverlayLayout();
    }

    private updateBattleCharacterGroundY(groundWorldY: number) {
        this.getBattleUnits().forEach((unit) => {
            unit.container.setY(groundWorldY);
        });
    }

    private updateBattleFadeOverlayLayout() {
        const origin = getSafeAreaOrigin(this.scale);
        const frameLeft = -origin.x;
        const frameTop = -origin.y;
        const frameWidth = this.scale.width;
        const battleHeight = Math.max(1, BATTLE_AREA_BOTTOM_Y - frameTop);

        this.battleFadeOverlay
            ?.setPosition(frameLeft + frameWidth / 2, frameTop + battleHeight / 2)
            .setSize(frameWidth, battleHeight);
    }

    private getFrameLeft() {
        return -getSafeAreaOrigin(this.scale).x;
    }

    private getFrameRight() {
        return this.getFrameLeft() + this.scale.width;
    }
}
