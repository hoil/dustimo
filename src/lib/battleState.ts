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

type BattleAttackEventListener = (event: BattleAttackEvent) => void;
type BattleWaveResetEventListener = (event: BattleWaveResetEvent) => void;

const BATTLE_TURN_INTERVAL_MS = 620;
const WAVE_RESET_EVENT_DELAY_MS = 220;
const ALLY_MAX_HP = 100;
const ALLY_ATTACK_POWER = 10;
const ENEMY_MAX_HP = 20;
const ENEMY_ATTACK_POWER = 0;

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
let units: BattleUnitState[] = [];
const attackListeners = new Set<BattleAttackEventListener>();
const waveResetListeners = new Set<BattleWaveResetEventListener>();

const cloneUnitState = (unit: BattleUnitState): BattleUnitState => ({ ...unit });

const createInitialBattleUnits = (): BattleUnitState[] => [
    { id: "ally-1", team: "ally", slotIndex: 1, maxHp: ALLY_MAX_HP, hp: ALLY_MAX_HP, attackPower: ALLY_ATTACK_POWER, isAlive: true },
    { id: "ally-2", team: "ally", slotIndex: 2, maxHp: ALLY_MAX_HP, hp: ALLY_MAX_HP, attackPower: ALLY_ATTACK_POWER, isAlive: true },
    { id: "ally-3", team: "ally", slotIndex: 3, maxHp: ALLY_MAX_HP, hp: ALLY_MAX_HP, attackPower: ALLY_ATTACK_POWER, isAlive: true },
    { id: "ally-4", team: "ally", slotIndex: 4, maxHp: ALLY_MAX_HP, hp: ALLY_MAX_HP, attackPower: ALLY_ATTACK_POWER, isAlive: true },
    { id: "enemy-1", team: "enemy", slotIndex: 1, maxHp: ENEMY_MAX_HP, hp: ENEMY_MAX_HP, attackPower: ENEMY_ATTACK_POWER, isAlive: true },
    { id: "enemy-2", team: "enemy", slotIndex: 2, maxHp: ENEMY_MAX_HP, hp: ENEMY_MAX_HP, attackPower: ENEMY_ATTACK_POWER, isAlive: true },
    { id: "enemy-3", team: "enemy", slotIndex: 3, maxHp: ENEMY_MAX_HP, hp: ENEMY_MAX_HP, attackPower: ENEMY_ATTACK_POWER, isAlive: true },
    { id: "enemy-4", team: "enemy", slotIndex: 4, maxHp: ENEMY_MAX_HP, hp: ENEMY_MAX_HP, attackPower: ENEMY_ATTACK_POWER, isAlive: true },
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

const emitWaveResetEvent = () => {
    const event = {
        id: eventId,
        waveId,
        units: units.map(cloneUnitState),
        createdAt: performance.now(),
    } satisfies BattleWaveResetEvent;

    eventId += 1;
    waveResetListeners.forEach((listener) => listener(event));
};

const resetEnemyWave = () => {
    if (isWaveResetScheduled) {
        return;
    }

    isWaveResetScheduled = true;
    setTimeout(() => {
        waveId += 1;
        nextAttackerTeam = "ally";
        teamTurnIndices = {
            ally: 0,
            enemy: 0,
        };
        units = createInitialBattleUnits();
        isWaveResetScheduled = false;
        emitWaveResetEvent();
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
    if (!isBattleLoopRunning || timeoutId !== null) {
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

    if (!isBattleLoopRunning) {
        isBattleLoopRunning = true;
    }

    scheduleNextTurn();
};

export const resumeBattleLoop = () => {
    ensureBattleUnits();
    isBattleLoopRunning = true;

    if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
    }

    scheduleNextTurn(0);
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
