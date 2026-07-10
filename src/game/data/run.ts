import { REWARD_POOLS } from './cards';
import { getClass } from './classes';
import {
  ELITE_ENCOUNTERS,
  ENCOUNTER_TABLE,
  ENEMIES,
  LATE_ELITE_ENCOUNTERS,
} from './enemies';
import type { ClassId, MapNode, NodeType, RunState } from './types';
import { CARDS } from './cards';

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function createRun(classId: ClassId = 'druid'): RunState {
  const cls = getClass(classId);
  const map = generateMap();
  return {
    classId,
    hp: cls.maxHp,
    maxHp: cls.maxHp,
    gold: cls.startingGold,
    floor: 0,
    deck: [...cls.starterDeck],
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
  };
}

export function generateMap(): MapNode[] {
  const nodes: MapNode[] = [];
  // Floors 0–7: original path; 8–9: harder late path; 10: boss
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
        enemyIds: enemiesFor(type, floor),
        connections: [],
        cleared: false,
      });
    }
  }

  // Connect each floor to next
  for (let floor = 0; floor < floors - 1; floor++) {
    const curr = nodes.filter((n) => n.floor === floor);
    const next = nodes.filter((n) => n.floor === floor + 1);
    for (const c of curr) {
      if (next.length === 1) {
        c.connections = [next[0]!.id];
      } else {
        const targets = shuffle(next).slice(0, Math.min(2, next.length));
        c.connections = targets.map((t) => t.id);
      }
    }
    // Ensure every next node is reachable
    for (const n of next) {
      const hasIncoming = curr.some((c) => c.connections.includes(n.id));
      if (!hasIncoming) {
        pick(curr).connections.push(n.id);
      }
    }
  }

  return nodes;
}

function nodeTypeFor(floor: number, index: number, count: number): NodeType {
  if (floor === 0) return 'combat';
  if (floor === 10) return 'boss';
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

function enemiesFor(type: NodeType, floor: number): string[] {
  if (type === 'boss') return ['nightmare'];
  if (type === 'rest' || type === 'treasure' || type === 'shop') return [];
  if (type === 'elite') {
    const pool = floor >= 8 ? LATE_ELITE_ENCOUNTERS : ELITE_ENCOUNTERS;
    return [...pick(pool)];
  }
  const idx = Math.min(floor, ENCOUNTER_TABLE.length - 1);
  // Mix nearby encounters
  const pool = ENCOUNTER_TABLE.slice(Math.max(0, idx - 1), idx + 2);
  return [...pick(pool.length ? pool : ENCOUNTER_TABLE)];
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

export function randomRewards(count = 3, classId: ClassId = 'druid'): string[] {
  const pool = REWARD_POOLS[classId] ?? REWARD_POOLS.druid;
  return shuffle([...pool]).slice(0, count);
}

/** Remove one copy of a card from the run deck by index. */
export function removeCardAt(run: RunState, index: number): boolean {
  if (index < 0 || index >= run.deck.length) return false;
  run.deck.splice(index, 1);
  return true;
}
