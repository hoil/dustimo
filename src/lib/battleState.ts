export type BattleTeam = "ally" | "enemy";

export type BattleUnitId =
    | "ally-1"
    | "ally-2"
    | "ally-3"
    | "ally-4"
    | "enemy-1"
    | "enemy-2"
    | "enemy-3"
    | "enemy-4";

export type BattleUnitState = {
    id: BattleUnitId;
    team: BattleTeam;
    slotIndex: number;
    maxHp: number;
    hp: number;
    attackPower: number;
    isAlive: boolean;
};

export type BattleAttackEvent = {
    id: number;
    waveId: number;
    attackerId: BattleUnitId;
    attackerTeam: BattleTeam;
    targetId: BattleUnitId;
    damage: number;
    targetHp: number;
    targetMaxHp: number;
    isTargetDead: boolean;
    createdAt: number;
};

export type BattleWaveResetEvent = {
    id: number;
    waveId: number;
    units: BattleUnitState[];
    createdAt: number;
};

export type BattleSnapshot = {
    waveId: number;
    units: BattleUnitState[];
};

export type BattleWaveTransitionState = {
    event: BattleWaveResetEvent;
    elapsedMs: number;
};

type BattleAttackEventListener = (event: BattleAttackEvent) => void;
type BattleWaveResetEventListener = (event: BattleWaveResetEvent) => void;
type BattlePhase = "running" | "waiting-wave-transition";

const BATTLE_TURN_INTERVAL_MS = 780;
const WAVE_RESET_EVENT_DELAY_MS = 220;
const ALLY_MAX_HP = 100;
const ALLY_ATTACK_POWER = 10;
const ENEMY_MAX_HP = 40;
const ENEMY_ATTACK_POWER = 0;
const MIN_ENEMY_COUNT_PER_WAVE = 1;
const MAX_ENEMY_COUNT_PER_WAVE = 2;

const battleUnitOrderByTeam = {
    ally: ["ally-1", "ally-2", "ally-3", "ally-4"],
    enemy: ["enemy-1", "enemy-2", "enemy-3", "enemy-4"],
} satisfies Record<BattleTeam, BattleUnitId[]>;

let nextAttackerTeam: BattleTeam = "ally";
let teamTurnIndices: Record<BattleTeam, number> = {
    ally: 0,
    enemy: 0,
};
let eventId = 0;
let waveId = 1;
let timeoutId: ReturnType<typeof setTimeout> | null = null;
let isBattleLoopRunning = false;
let isWaveResetScheduled = false;
let battlePhase: BattlePhase = "running";
let pendingBattleWaveResetEvent: BattleWaveResetEvent | null = null;
let pendingBattleWaveTransitionStartedAt: number | null = null;
let units: BattleUnitState[] = [];
const attackListeners = new Set<BattleAttackEventListener>();
const waveResetListeners = new Set<BattleWaveResetEventListener>();

const cloneUnitState = (unit: BattleUnitState): BattleUnitState => ({ ...unit });

const cloneWaveResetEvent = (event: BattleWaveResetEvent): BattleWaveResetEvent => ({
    ...event,
    units: event.units.map(cloneUnitState),
});

const resetTurnOrderForWaveStart = () => {
    nextAttackerTeam = "ally";
    teamTurnIndices = {
        ally: 0,
        enemy: 0,
    };
};

const createAllyBattleUnits = (): BattleUnitState[] => [
    { id: "ally-1", team: "ally", slotIndex: 1, maxHp: ALLY_MAX_HP, hp: ALLY_MAX_HP, attackPower: ALLY_ATTACK_POWER, isAlive: true },
    { id: "ally-2", team: "ally", slotIndex: 2, maxHp: ALLY_MAX_HP, hp: ALLY_MAX_HP, attackPower: ALLY_ATTACK_POWER, isAlive: true },
    { id: "ally-3", team: "ally", slotIndex: 3, maxHp: ALLY_MAX_HP, hp: ALLY_MAX_HP, attackPower: ALLY_ATTACK_POWER, isAlive: true },
    { id: "ally-4", team: "ally", slotIndex: 4, maxHp: ALLY_MAX_HP, hp: ALLY_MAX_HP, attackPower: ALLY_ATTACK_POWER, isAlive: true },
];

const getRandomEnemyCount = () => {
    return MIN_ENEMY_COUNT_PER_WAVE + Math.floor(Math.random() * (MAX_ENEMY_COUNT_PER_WAVE - MIN_ENEMY_COUNT_PER_WAVE + 1));
};

const createEnemyBattleUnits = (): BattleUnitState[] => {
    const enemyCount = getRandomEnemyCount();

    return battleUnitOrderByTeam.enemy.slice(0, enemyCount).map((enemyId, index) => ({
        id: enemyId,
        team: "enemy",
        slotIndex: index + 1,
        maxHp: ENEMY_MAX_HP,
        hp: ENEMY_MAX_HP,
        attackPower: ENEMY_ATTACK_POWER,
        isAlive: true,
    }));
};

const createInitialBattleUnits = (): BattleUnitState[] => [
    ...createAllyBattleUnits(),
    ...createEnemyBattleUnits(),
];

const ensureBattleUnits = () => {
    if (units.length === 0) {
        units = createInitialBattleUnits();
    }
};

const getUnit = (unitId: BattleUnitId) => {
    ensureBattleUnits();

    return units.find((unit) => unit.id === unitId) ?? null;
};

const getOpposingTeam = (team: BattleTeam): BattleTeam => {
    return team === "ally" ? "enemy" : "ally";
};

const getNextAliveAttacker = (team: BattleTeam) => {
    ensureBattleUnits();

    const turnOrder = battleUnitOrderByTeam[team];

    for (let index = 0; index < turnOrder.length; index += 1) {
        const unitIndex = teamTurnIndices[team] % turnOrder.length;
        const unitId = turnOrder[unitIndex];
        const unit = getUnit(unitId);

        teamTurnIndices[team] = unitIndex + 1;

        if (unit?.isAlive) {
            return unit;
        }
    }

    return null;
};

const getFrontAliveTarget = (targetTeam: BattleTeam) => {
    ensureBattleUnits();

    return [...units]
        .filter((unit) => unit.team === targetTeam && unit.isAlive)
        .sort((a, b) => a.slotIndex - b.slotIndex)[0] ?? null;
};

const calculateDamage = (attacker: BattleUnitState) => {
    return Math.max(0, attacker.attackPower);
};

const emitAttackEvent = (event: BattleAttackEvent) => {
    attackListeners.forEach((listener) => listener(event));
};

const stopBattleLoopTimer = () => {
    isBattleLoopRunning = false;

    if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
    }
};

const createWaveResetEvent = () => {
    const waveResetEvent = {
        id: eventId,
        waveId,
        units: units.map(cloneUnitState),
        createdAt: performance.now(),
    } satisfies BattleWaveResetEvent;

    eventId += 1;

    return waveResetEvent;
};

const emitWaveResetEvent = (event: BattleWaveResetEvent) => {
    waveResetListeners.forEach((listener) => listener(event));
};

const resetEnemyWave = () => {
    if (isWaveResetScheduled) {
        return;
    }

    isWaveResetScheduled = true;
    setTimeout(() => {
        waveId += 1;
        resetTurnOrderForWaveStart();
        units = createInitialBattleUnits();
        isWaveResetScheduled = false;
        pendingBattleWaveResetEvent = createWaveResetEvent();
        pendingBattleWaveTransitionStartedAt = null;
        battlePhase = "waiting-wave-transition";
        stopBattleLoopTimer();
        emitWaveResetEvent(pendingBattleWaveResetEvent);
    }, WAVE_RESET_EVENT_DELAY_MS);
};

const resolveOneTurn = () => {
    if (isWaveResetScheduled) {
        return;
    }

    const attackerTeam = nextAttackerTeam;
    nextAttackerTeam = getOpposingTeam(nextAttackerTeam);

    const attacker = getNextAliveAttacker(attackerTeam);

    if (!attacker) {
        if (attackerTeam === "enemy") {
            resetEnemyWave();
        }

        return;
    }

    const targetTeam = getOpposingTeam(attacker.team);
    const target = getFrontAliveTarget(targetTeam);

    if (!target) {
        resetEnemyWave();
        return;
    }

    const damage = calculateDamage(attacker);

    target.hp = Math.max(0, target.hp - damage);

    if (target.hp <= 0) {
        target.isAlive = false;
    }

    const attackEvent = {
        id: eventId,
        waveId,
        attackerId: attacker.id,
        attackerTeam: attacker.team,
        targetId: target.id,
        damage,
        targetHp: target.hp,
        targetMaxHp: target.maxHp,
        isTargetDead: !target.isAlive,
        createdAt: performance.now(),
    } satisfies BattleAttackEvent;

    eventId += 1;
    emitAttackEvent(attackEvent);

    if (target.team === "enemy" && !units.some((unit) => unit.team === "enemy" && unit.isAlive)) {
        resetEnemyWave();
    }
};

const scheduleNextTurn = (delay = BATTLE_TURN_INTERVAL_MS) => {
    if (!isBattleLoopRunning || timeoutId !== null || battlePhase !== "running") {
        return;
    }

    timeoutId = setTimeout(() => {
        timeoutId = null;
        resolveOneTurn();
        scheduleNextTurn();
    }, delay);
};

export const startBattleLoop = () => {
    ensureBattleUnits();

    if (battlePhase !== "running") {
        return;
    }

    if (!isBattleLoopRunning) {
        isBattleLoopRunning = true;
    }

    scheduleNextTurn();
};

export const resumeBattleLoop = () => {
    ensureBattleUnits();

    if (battlePhase !== "running") {
        return;
    }

    if (isBattleLoopRunning && timeoutId !== null) {
        return;
    }

    isBattleLoopRunning = true;
    scheduleNextTurn();
};

export const resumeBattleLoopImmediately = () => {
    ensureBattleUnits();

    if (battlePhase !== "running") {
        return;
    }

    if (isBattleLoopRunning && timeoutId !== null) {
        return;
    }

    isBattleLoopRunning = true;
    scheduleNextTurn(0);
};

export const pauseBattleLoop = () => {
    stopBattleLoopTimer();
};

export const getPendingBattleWaveResetEvent = () => {
    return pendingBattleWaveResetEvent
        ? cloneWaveResetEvent(pendingBattleWaveResetEvent)
        : null;
};

export const markBattleWaveTransitionStarted = (eventIdToStart: number) => {
    if (pendingBattleWaveResetEvent?.id !== eventIdToStart) {
        return false;
    }

    if (pendingBattleWaveTransitionStartedAt === null) {
        pendingBattleWaveTransitionStartedAt = performance.now();
    }

    return true;
};

export const getPendingBattleWaveTransitionState = (): BattleWaveTransitionState | null => {
    if (!pendingBattleWaveResetEvent) {
        return null;
    }

    return {
        event: cloneWaveResetEvent(pendingBattleWaveResetEvent),
        elapsedMs: pendingBattleWaveTransitionStartedAt === null
            ? 0
            : Math.max(0, performance.now() - pendingBattleWaveTransitionStartedAt),
    };
};

export const consumePendingBattleWaveResetEvent = (eventIdToConsume: number) => {
    if (pendingBattleWaveResetEvent?.id !== eventIdToConsume) {
        return false;
    }

    pendingBattleWaveResetEvent = null;
    pendingBattleWaveTransitionStartedAt = null;
    battlePhase = "running";

    return true;
};

export const getBattleSnapshot = (): BattleSnapshot => {
    ensureBattleUnits();

    return {
        waveId,
        units: units.map(cloneUnitState),
    };
};

export const subscribeBattleAttackEvents = (listener: BattleAttackEventListener) => {
    attackListeners.add(listener);
    startBattleLoop();

    return () => {
        attackListeners.delete(listener);
    };
};

export const subscribeBattleWaveResetEvents = (listener: BattleWaveResetEventListener) => {
    waveResetListeners.add(listener);
    startBattleLoop();

    return () => {
        waveResetListeners.delete(listener);
    };
};
