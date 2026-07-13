import { GameObjects, Scene } from "phaser";

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
    getBattleSnapshot,
    resumeBattleLoop,
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
const BREATHING_TWEEN_DURATION = 1050;
const BREATHING_SCALE_X = 1.035;
const BREATHING_SCALE_Y = 0.965;
const ATTACK_MOVE_DURATION = 150;
const ATTACK_RETURN_DURATION = 160;
const ATTACK_IMPACT_HOLD_DURATION = 35;
const MELEE_ATTACK_GAP = 82;
const HP_BAR_WIDTH = 92;
const HP_BAR_HEIGHT = 12;
const HP_BAR_Y = 22;
const HP_BAR_BG_COLOR = 0x2b1417;
const HP_BAR_FILL_COLOR = 0x62d85f;
const HP_BAR_DANGER_COLOR = 0xff6b59;
const DEAD_UNIT_ALPHA = 0.25;
const WAVE_ALLY_EXIT_DURATION = 520;
const WAVE_ALLY_ENTER_DURATION = 560;
const WAVE_FADE_DURATION = 320;
const WAVE_FADE_HOLD_DURATION = 120;
const WAVE_OFFSCREEN_PADDING = 180;

type BattleUnit = {
    key: BattleUnitId;
    team: BattleTeam;
    container: GameObjects.Container;
    sprite: GameObjects.Image;
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
        this.events.once("shutdown", () => {
            this.resetRuntimeFlowState();
            this.unsubscribeBattleAttackEvents?.();
            this.unsubscribeBattleAttackEvents = null;
            this.unsubscribeBattleWaveResetEvents?.();
            this.unsubscribeBattleWaveResetEvents = null;
            this.scale.off("resize", this.updateExtendedAreaLayout, this);
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
        resumeBattleLoop();
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
            const hpBarBg = this.createHpBarBackground();
            const hpBarFill = this.createHpBarFill();
            const container = this.add
                .container(layout.x, BATTLE_AREA_BOTTOM_Y, [enemy, hpBarBg, hpBarFill])
                .setDepth(BATTLE_CHARACTER_DEPTH + this.allyUnits.length + index);

            this.applyBreathingAnimation(enemy, 260 + index * 130);

            const battleUnit: BattleUnit = {
                key: layout.key,
                team: "enemy",
                container,
                sprite: enemy,
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

    private async playWaveTransition(event: BattleWaveResetEvent) {
        if (this.isWaveTransitionPlaying) {
            this.attackEventQueue = [];
            this.pendingWaveResetEvent = event;
            this.applyUnitStates(event.units);

            return;
        }

        this.attackEventQueue = [];
        this.isWaveTransitionPlaying = true;
        this.animationVersion += 1;
        this.getBattleUnits().forEach((unit) => {
            this.tweens.killTweensOf(unit.container);
        });
        this.allyUnits.forEach((unit) => {
            unit.container
                .setAlpha(1)
                .setVisible(true)
                .setDepth(BATTLE_ATTACKER_DEPTH);
        });

        await this.runAlliesOffscreenRight();

        if (!this.isSceneActive) {
            return;
        }

        await this.fadeBattleAreaToBlack();

        if (!this.isSceneActive) {
            return;
        }

        this.applyUnitStates(event.units);
        this.placeAlliesOffscreenLeft();
        await this.wait(WAVE_FADE_HOLD_DURATION);

        if (!this.isSceneActive) {
            return;
        }

        await this.fadeBattleAreaFromBlack();

        if (!this.isSceneActive) {
            return;
        }

        await this.runAlliesToHome();

        this.attackEventQueue = [];
        this.applyUnitStates(getBattleSnapshot().units);
        this.allyUnits.forEach((unit) => {
            unit.container.setDepth(unit.depth);
        });
        this.isAttackAnimationPlaying = false;
        this.isWaveTransitionPlaying = false;
        this.pendingWaveResetEvent = null;
        resumeBattleLoop();
    }

    private runAlliesOffscreenRight() {
        const exitX = this.getFrameRight() + WAVE_OFFSCREEN_PADDING;

        return this.tweenBattleTarget(this.allyUnits.map((unit) => unit.container), {
            x: exitX,
            duration: WAVE_ALLY_EXIT_DURATION,
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

    private runAlliesToHome() {
        return Promise.all(
            this.allyUnits.map((unit, index) => this.tweenBattleTarget(unit.container, {
                x: unit.homeX,
                duration: WAVE_ALLY_ENTER_DURATION,
                delay: index * 55,
                ease: "Sine.easeOut",
            }))
        ).then(() => undefined);
    }

    private fadeBattleAreaToBlack() {
        this.updateBattleFadeOverlayLayout();
        this.battleFadeOverlay
            ?.setAlpha(0)
            .setVisible(true);

        return this.tweenBattleTarget(this.battleFadeOverlay ? [this.battleFadeOverlay] : [], {
            alpha: 1,
            duration: WAVE_FADE_DURATION,
            ease: "Sine.easeInOut",
        });
    }

    private async fadeBattleAreaFromBlack() {
        await this.tweenBattleTarget(this.battleFadeOverlay ? [this.battleFadeOverlay] : [], {
            alpha: 0,
            duration: WAVE_FADE_DURATION,
            ease: "Sine.easeInOut",
        });

        this.battleFadeOverlay?.setVisible(false);
    }

    private applyUnitStates(unitStates: BattleUnitState[]) {
        const unitStateById = new Map(
            unitStates.map((unitState) => [unitState.id, unitState])
        );

        this.getBattleUnits().forEach((unit) => {
            this.applyUnitState(unit, unitStateById.get(unit.key));
        });
    }

    private applyUnitState(unit: BattleUnit, unitState?: BattleUnitState) {
        unit.container
            .setX(unit.homeX)
            .setDepth(unit.depth)
            .setAlpha(unitState?.isAlive === false ? DEAD_UNIT_ALPHA : 1)
            .setVisible(true);
        unit.sprite.clearTint();
        this.updateHpBar(unit, unitState?.hp ?? 1, unitState?.maxHp ?? 1);
    }

    private updateHpBar(unit: BattleUnit, hp: number, maxHp: number) {
        const hpRatio = maxHp > 0
            ? Math.min(1, Math.max(0, hp / maxHp))
            : 0;

        unit.hpBarFill
            .setSize(Math.max(1, HP_BAR_WIDTH * hpRatio), HP_BAR_HEIGHT)
            .setFillStyle(hpRatio <= 0.3 ? HP_BAR_DANGER_COLOR : HP_BAR_FILL_COLOR, 1);
    }

    private applyBreathingAnimation(target: GameObjects.Image, delay = 0) {
        const baseScaleX = target.scaleX;
        const baseScaleY = target.scaleY;

        this.tweens.add({
            targets: target,
            scaleX: baseScaleX * BREATHING_SCALE_X,
            scaleY: baseScaleY * BREATHING_SCALE_Y,
            duration: BREATHING_TWEEN_DURATION,
            delay,
            ease: "Sine.easeInOut",
            yoyo: true,
            repeat: -1,
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

    private playAttackSound(attackerTeam: BattleTeam) {
        const soundKey = attackerTeam === "ally"
            ? ALLY_ATTACK_SOUND_KEY
            : ENEMY_ATTACK_SOUND_KEY;

        try {
            this.sound.play(soundKey);
        } catch {
            // Ignore sound playback failures caused by browser audio policies.
        }
    }

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

        this.playAttackSound(attacker.team);
        this.playHitEffect(target, event);
        await this.wait(ATTACK_IMPACT_HOLD_DURATION);

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
        target.sprite.setTint(0xffffff);
        this.time.delayedCall(90, () => {
            target.sprite.clearTint();
        });
        this.updateHpBar(target, event.targetHp, event.targetMaxHp);

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
