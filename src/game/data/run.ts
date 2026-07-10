import {
  CARDS,
  POTION_HEAL_AMOUNT,
  REWARD_POOLS,
  buildStarterDeck,
  rarityWeightsForFloor,
} from './cards';
import { getClass } from './classes';
import {
  ACT_NAMES,
  BARRENS_BOSS_ID,
  BARRENS_ELITE_POOL,
  BARRENS_ENCOUNTER_TABLE,
  ELITE_ENCOUNTERS,
  ENCOUNTER_TABLE,
  ENEMIES,
  LATE_ELITE_ENCOUNTERS,
} from './enemies';
import type { ActId, ClassId, MapNode, NodeType, OpeningSpec, RunState } from './types';

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function defaultSpec(classId: ClassId): OpeningSpec {
  return classId === 'priest' ? 'holy' : 'feral';
}

export function createRun(
  classId: ClassId = 'druid',
  openingSpec?: OpeningSpec,
): RunState {
  const cls = getClass(classId);
  const spec = openingSpec ?? defaultSpec(classId);
  const map = generateMap(1);
  return {
    classId,
    openingSpec: spec,
    hp: cls.maxHp,
    maxHp: cls.maxHp,
    gold: cls.startingGold,
    floor: 0,
    act: 1,
    deck: buildStarterDeck(classId, spec),
    discard: [],
    drawPile: [],
    hand: [],
    map,
    currentNodeId: null,
    energyMax: 3,
    spellPowerBonus: 0,
    victories: 0,
    talentPoints: 0,
    talents: {},
    shopRerollCount: 0,
    potions: 0,
    cardsRemoved: 0,
    items: [],
  };
}

/** Advance from Grove into The Barrens after the Act 1 boss. */
export function advanceToBarrens(run: RunState): void {
  run.act = 2;
  run.map = generateMap(2);
  run.currentNodeId = null;
  run.floor = 0;
  // Soft heal between acts so the climb into Barrens is fair
  run.hp = Math.min(run.maxHp, Math.max(run.hp, Math.floor(run.maxHp * 0.6)));
  run.shopRerollCount = 0;
}

export function actName(act: ActId): string {
  return ACT_NAMES[act];
}

export function generateMap(act: ActId = 1): MapNode[] {
  const nodes: MapNode[] = [];
  // Floors 0–7: path; 8–9: harder late path; 10: boss
  const floors = 11;
  const perFloor = [1, 2, 3, 2, 3, 2, 2, 1, 2, 1, 1];

  for (let floor = 0; floor < floors; floor++) {
    const count = perFloor[floor]!;
    for (let i = 0; i < count; i++) {
      const type = nodeTypeFor(floor, i, count);
      nodes.push({
        id: uid(`n${floor}`),
        floor,
        index: i,
        type,
        enemyIds: [],
        connections: [],
        cleared: false,
      });
    }
  }

  for (const node of nodes) {
    node.enemyIds = enemiesFor(node.type, node.floor, act);
  }

  // Connect each floor to the next using lane proximity (no far cross-jumps).
  for (let floor = 0; floor < floors - 1; floor++) {
    const curr = nodes.filter((n) => n.floor === floor);
    const next = nodes.filter((n) => n.floor === floor + 1);
    connectFloors(curr, next);
  }

  return nodes;
}

/** Horizontal lane position in [0, 1] for proximity matching across floors. */
function lanePos(index: number, count: number): number {
  if (count <= 1) return 0.5;
  return index / (count - 1);
}

function laneDist(a: MapNode, aCount: number, b: MapNode, bCount: number): number {
  return Math.abs(lanePos(a.index, aCount) - lanePos(b.index, bCount));
}

/**
 * Wire curr → next so each node only links to nearby lanes.
 * Guarantees every next-floor node has at least one incoming edge.
 */
function connectFloors(curr: MapNode[], next: MapNode[]): void {
  if (!curr.length || !next.length) return;

  if (next.length === 1) {
    for (const c of curr) c.connections = [next[0]!.id];
    return;
  }

  // How far (in normalized lane space) a connection may jump.
  // ~0.55 covers same-side + center when floors differ in width (2↔3).
  const maxDist = 0.55;

  for (const c of curr) {
    const ranked = [...next].sort(
      (a, b) =>
        laneDist(c, curr.length, a, next.length) -
        laneDist(c, curr.length, b, next.length),
    );
    const nearby = ranked.filter(
      (n) => laneDist(c, curr.length, n, next.length) <= maxDist,
    );
    const pool = nearby.length > 0 ? nearby : ranked.slice(0, 1);
    const linkCount = pool.length > 1 && Math.random() < 0.55 ? 2 : 1;
    c.connections = pool.slice(0, linkCount).map((t) => t.id);
  }

  // Ensure every next node is reachable — attach from the closest current node.
  for (const n of next) {
    const hasIncoming = curr.some((c) => c.connections.includes(n.id));
    if (hasIncoming) continue;
    const closest = [...curr].sort(
      (a, b) =>
        laneDist(a, curr.length, n, next.length) -
        laneDist(b, curr.length, n, next.length),
    )[0]!;
    if (!closest.connections.includes(n.id)) {
      closest.connections.push(n.id);
    }
  }
}

function nodeTypeFor(floor: number, index: number, count: number): NodeType {
  if (floor === 0) return 'combat';
  if (floor === 10) return 'boss';
  // Early shop so Act 1 card removal is a real skill check
  if (floor === 2 && index === 0) return 'shop';
  if (floor === 3 || floor === 6 || floor === 8) {
    if (index === 0) return 'elite';
    if (index === count - 1) return 'rest';
  }
  if (floor === 4 && index === 1) return 'treasure';
  if (floor === 5 && index === 0) return 'shop';
  if (floor === 7 || floor === 9) return Math.random() < 0.55 ? 'elite' : 'combat';
  const roll = Math.random();
  if (roll < 0.1) return 'rest';
  if (roll < 0.16) return 'treasure';
  if (roll < 0.24) return 'shop';
  if (roll < 0.36) return 'elite';
  return 'combat';
}

function enemiesFor(type: NodeType, floor: number, act: ActId): string[] {
  if (type === 'rest' || type === 'treasure' || type === 'shop') return [];
  if (type === 'boss') {
    return act === 2 ? [BARRENS_BOSS_ID] : ['nightmare'];
  }
  if (type === 'elite') {
    if (act === 2) return [pick(BARRENS_ELITE_POOL)];
    const pool = floor >= 8 ? LATE_ELITE_ENCOUNTERS : ELITE_ENCOUNTERS;
    return [...pick(pool)];
  }
  const table = act === 2 ? BARRENS_ENCOUNTER_TABLE : ENCOUNTER_TABLE;
  const idx = Math.min(floor, table.length - 1);
  const pool = table.slice(Math.max(0, idx - 1), idx + 2);
  return [...pick(pool.length ? pool : table)];
}

export function availableNodes(run: RunState): MapNode[] {
  if (!run.currentNodeId) {
    return run.map.filter((n) => n.floor === 0);
  }
  const current = run.map.find((n) => n.id === run.currentNodeId);
  if (!current) return [];
  return run.map.filter((n) => current.connections.includes(n.id));
}

export function getCard(id: string) {
  return CARDS[id];
}

export function getEnemy(id: string) {
  return ENEMIES[id];
}

function rewardFloor(run?: RunState | null): number {
  if (!run) return 0;
  let floor = 0;
  if (run.currentNodeId) {
    const node = run.map.find((n) => n.id === run.currentNodeId);
    if (node) floor = node.floor;
    else floor = Math.max(run.floor, run.victories);
  } else {
    floor = Math.max(run.floor, run.victories);
  }
  // Act 2 rewards use late-game rarity weights
  return run.act === 2 ? floor + 10 : floor;
}

function pickWeightedRarity(
  weights: Record<string, number>,
): keyof typeof weights {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * total;
  for (const [rarity, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return rarity;
  }
  return entries[0]![0];
}

/**
 * Draw reward/shop cards with floor-scaled rarity weights.
 * Commons dominate early; legendaries stay scarce until late floors.
 */
export function randomRewards(
  count = 3,
  classId: ClassId = 'druid',
  floorOrRun: number | RunState = 0,
): string[] {
  const floor = typeof floorOrRun === 'number' ? floorOrRun : rewardFloor(floorOrRun);
  const pool = REWARD_POOLS[classId] ?? REWARD_POOLS.druid;
  const byRarity: Record<string, string[]> = {
    common: [],
    rare: [],
    epic: [],
    legendary: [],
  };
  for (const id of pool) {
    const card = CARDS[id];
    if (!card) continue;
    byRarity[card.rarity]?.push(id);
  }

  const weights = rarityWeightsForFloor(floor);
  const picked: string[] = [];
  const used = new Set<string>();

  for (let i = 0; i < count; i++) {
    let rarity = pickWeightedRarity(weights) as 'common' | 'rare' | 'epic' | 'legendary';
    // Fall back down the rarity ladder if a tier is empty / exhausted
    const order: Array<'common' | 'rare' | 'epic' | 'legendary'> = [
      rarity,
      'common',
      'rare',
      'epic',
      'legendary',
    ];
    let chosen: string | undefined;
    for (const r of order) {
      const candidates = (byRarity[r] ?? []).filter((id) => !used.has(id));
      if (candidates.length) {
        chosen = pick(candidates);
        rarity = r;
        break;
      }
    }
    if (!chosen) {
      // Absolute fallback: any unused pool card
      const remaining = pool.filter((id) => !used.has(id));
      if (!remaining.length) break;
      chosen = pick(remaining);
    }
    used.add(chosen);
    picked.push(chosen);
  }

  return picked;
}

/** Remove one copy of a card from the run deck by index. */
export function removeCardAt(run: RunState, index: number): boolean {
  if (index < 0 || index >= run.deck.length) return false;
  run.deck.splice(index, 1);
  return true;
}

/** Drink one heal potion from the map. Returns HP actually restored. */
export function usePotion(run: RunState): number {
  if (run.potions <= 0 || run.hp >= run.maxHp) return 0;
  run.potions -= 1;
  const before = run.hp;
  run.hp = Math.min(run.maxHp, run.hp + POTION_HEAL_AMOUNT);
  return run.hp - before;
}
