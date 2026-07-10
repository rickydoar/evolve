import type { EnemyDef } from './types';

export const ENEMIES: Record<string, EnemyDef> = {
  wolf: {
    id: 'wolf',
    name: 'Timber Wolf',
    maxHp: 42,
    art: 'enemy-wolf',
    intents: [
      { type: 'attack', value: 8, label: 'Bite 8' },
      { type: 'attack', value: 12, label: 'Maul 12' },
      { type: 'defend', value: 6, label: 'Guard 6' },
    ],
  },
  spider: {
    id: 'spider',
    name: 'Venom Spider',
    maxHp: 36,
    art: 'enemy-spider',
    intents: [
      { type: 'attack', value: 6, label: 'Bite 6' },
      { type: 'debuff', value: 4, label: 'Venom 4' },
      { type: 'attack', value: 10, label: 'Lunge 10' },
    ],
  },
  treant: {
    id: 'treant',
    name: 'Corrupted Treant',
    maxHp: 55,
    art: 'enemy-treant',
    intents: [
      { type: 'defend', value: 10, label: 'Bark 10' },
      { type: 'attack', value: 11, label: 'Smash 11' },
      { type: 'buff', value: 3, label: 'Grow +3' },
    ],
  },
  harpy: {
    id: 'harpy',
    name: 'Forest Harpy',
    maxHp: 38,
    art: 'enemy-harpy',
    intents: [
      { type: 'attack', value: 9, label: 'Talon 9' },
      { type: 'debuff', value: 2, label: 'Screech' },
      { type: 'attack', value: 14, label: 'Dive 14' },
    ],
  },
  bog_beast: {
    id: 'bog_beast',
    name: 'Bog Beast',
    maxHp: 70,
    art: 'enemy-bog',
    intents: [
      { type: 'attack', value: 13, label: 'Slam 13' },
      { type: 'defend', value: 12, label: 'Mud 12' },
      { type: 'attack', value: 18, label: 'Crush 18' },
      { type: 'heal', value: 8, label: 'Regrow 8' },
    ],
  },
  /** Fragile add spawned by summoners. */
  grove_wisp: {
    id: 'grove_wisp',
    name: 'Grove Wisp',
    maxHp: 16,
    art: 'enemy-wisp',
    intents: [
      { type: 'attack', value: 5, label: 'Spark 5' },
      { type: 'attack', value: 8, label: 'Flare 8' },
      { type: 'debuff', value: 2, label: 'Daze' },
    ],
  },
  /** Late-game combat enemy: poison + self-heal. */
  blight_stag: {
    id: 'blight_stag',
    name: 'Blight Stag',
    maxHp: 78,
    art: 'enemy-stag',
    intents: [
      { type: 'attack', value: 14, label: 'Gore 14' },
      { type: 'debuff', value: 5, label: 'Venom 5' },
      { type: 'heal', value: 10, label: 'Sap 10' },
      { type: 'attack', value: 20, label: 'Charge 20' },
    ],
    enrageIntents: [
      { type: 'attack', value: 22, label: 'Frenzy 22' },
      { type: 'debuff', value: 6, label: 'Venom 6' },
      { type: 'heal', value: 14, label: 'Sap 14' },
    ],
  },
  /** Elite: summons wisps and regenerates. */
  mycelium_queen: {
    id: 'mycelium_queen',
    name: 'Mycelium Queen',
    maxHp: 95,
    art: 'enemy-mycelium',
    isElite: true,
    intents: [
      { type: 'summon', value: 1, label: 'Spawn Wisp', summonId: 'grove_wisp' },
      { type: 'heal', value: 12, label: 'Spore Heal 12' },
      { type: 'debuff', value: 5, label: 'Venom 5' },
      { type: 'attack', value: 15, label: 'Tendril 15' },
      { type: 'defend', value: 14, label: 'Mycelium 14' },
    ],
    enrageIntents: [
      { type: 'summon', value: 1, label: 'Spawn Wisp', summonId: 'grove_wisp' },
      { type: 'summon', value: 1, label: 'Spawn Wisp', summonId: 'grove_wisp' },
      { type: 'heal', value: 18, label: 'Spore Heal 18' },
      { type: 'attack', value: 20, label: 'Tendril 20' },
      { type: 'debuff', value: 6, label: 'Venom 6' },
    ],
  },
  /** Elite: stacks Strength, then hits like a truck. */
  thorn_colossus: {
    id: 'thorn_colossus',
    name: 'Thorn Colossus',
    maxHp: 110,
    art: 'enemy-colossus',
    isElite: true,
    intents: [
      { type: 'buff', value: 4, label: 'Thorns +4' },
      { type: 'defend', value: 16, label: 'Harden 16' },
      { type: 'attack', value: 18, label: 'Impale 18' },
      { type: 'attack', value: 24, label: 'Crush 24' },
      { type: 'debuff', value: 2, label: 'Pin' },
    ],
    enrageIntents: [
      { type: 'buff', value: 6, label: 'Rage +6' },
      { type: 'attack', value: 28, label: 'Rampage 28' },
      { type: 'attack', value: 22, label: 'Impale 22' },
      { type: 'defend', value: 20, label: 'Harden 20' },
    ],
  },
  nightmare: {
    id: 'nightmare',
    name: 'Nightmare of the Grove',
    maxHp: 200,
    art: 'enemy-boss',
    isBoss: true,
    intents: [
      { type: 'attack', value: 16, label: 'Shadow 16' },
      { type: 'debuff', value: 5, label: 'Curse 5' },
      { type: 'defend', value: 15, label: 'Veil 15' },
      { type: 'summon', value: 1, label: 'Call Wisp', summonId: 'grove_wisp' },
      { type: 'heal', value: 14, label: 'Dark Bloom 14' },
      { type: 'buff', value: 4, label: 'Empower +4' },
      { type: 'attack', value: 24, label: 'Nightmare 24' },
    ],
    enrageIntents: [
      { type: 'summon', value: 1, label: 'Call Wisp', summonId: 'grove_wisp' },
      { type: 'buff', value: 6, label: 'Awaken +6' },
      { type: 'heal', value: 20, label: 'Dark Bloom 20' },
      { type: 'attack', value: 30, label: 'Nightmare 30' },
      { type: 'debuff', value: 6, label: 'Curse 6' },
      { type: 'attack', value: 22, label: 'Shadow 22' },
    ],
  },
};

export const ENCOUNTER_TABLE: string[][] = [
  ['wolf'],
  ['spider'],
  ['wolf', 'spider'],
  ['treant'],
  ['harpy', 'wolf'],
  ['spider', 'spider'],
  ['treant', 'harpy'],
  ['bog_beast'],
  // Floors 8–9: harder packs
  ['blight_stag'],
  ['bog_beast', 'harpy'],
  ['blight_stag', 'spider'],
  ['treant', 'blight_stag'],
  ['bog_beast', 'blight_stag'],
];

/** Early / mid-run elite packs. */
export const ELITE_ENCOUNTERS: string[][] = [
  ['bog_beast', 'spider'],
  ['treant', 'treant'],
  ['harpy', 'harpy', 'wolf'],
];

/** Late-run elite packs (floors 8+). */
export const LATE_ELITE_ENCOUNTERS: string[][] = [
  ['mycelium_queen'],
  ['thorn_colossus'],
  ['mycelium_queen', 'grove_wisp'],
  ['thorn_colossus', 'spider'],
  ['blight_stag', 'bog_beast'],
];
