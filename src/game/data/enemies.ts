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
    isBoss: false,
  },
  nightmare: {
    id: 'nightmare',
    name: 'Nightmare of the Grove',
    maxHp: 160,
    art: 'enemy-boss',
    intents: [
      { type: 'attack', value: 16, label: 'Shadow 16' },
      { type: 'debuff', value: 5, label: 'Curse 5' },
      { type: 'defend', value: 15, label: 'Veil 15' },
      { type: 'attack', value: 24, label: 'Nightmare 24' },
      { type: 'buff', value: 4, label: 'Empower +4' },
    ],
    isBoss: true,
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
];

export const ELITE_ENCOUNTERS: string[][] = [
  ['bog_beast', 'spider'],
  ['treant', 'treant'],
  ['harpy', 'harpy', 'wolf'],
];
