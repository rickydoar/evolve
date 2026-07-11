import type { EnemyDef } from './types';

/**
 * Enemy definitions.
 * Grove (Act 1) stats are ~25% above the original baseline.
 * Barrens (Act 2) enemies are a harder tier with distinct kits.
 * Combat also applies per-floor scaling (+ Act 2 flat bump) and scales summons.
 */
export const ENEMIES: Record<string, EnemyDef> = {
  // ─── Act 1: The Grove ───────────────────────────────────────────────
  wolf: {
    id: 'wolf',
    name: 'Timber Wolf',
    maxHp: 53,
    art: 'enemy-wolf',
    intents: [
      { type: 'attack', value: 10, label: 'Bite 10' },
      { type: 'attack', value: 15, label: 'Maul 15' },
      { type: 'defend', value: 8, label: 'Guard 8' },
    ],
  },
  spider: {
    id: 'spider',
    name: 'Venom Spider',
    maxHp: 45,
    art: 'enemy-spider',
    intents: [
      { type: 'attack', value: 8, label: 'Bite 8' },
      { type: 'debuff', value: 5, label: 'Venom 5' },
      { type: 'attack', value: 13, label: 'Lunge 13' },
    ],
  },
  treant: {
    id: 'treant',
    name: 'Corrupted Treant',
    maxHp: 69,
    art: 'enemy-treant',
    intents: [
      { type: 'defend', value: 13, label: 'Bark 13' },
      { type: 'attack', value: 14, label: 'Smash 14' },
      { type: 'buff', value: 4, label: 'Grow +4' },
    ],
  },
  harpy: {
    id: 'harpy',
    name: 'Forest Harpy',
    maxHp: 48,
    art: 'enemy-harpy',
    intents: [
      { type: 'attack', value: 11, label: 'Talon 11' },
      { type: 'debuff', value: 2, label: 'Screech' },
      { type: 'attack', value: 18, label: 'Dive 18' },
    ],
  },
  bog_beast: {
    id: 'bog_beast',
    name: 'Bog Beast',
    maxHp: 88,
    art: 'enemy-bog',
    intents: [
      { type: 'attack', value: 16, label: 'Slam 16' },
      { type: 'defend', value: 15, label: 'Mud 15' },
      { type: 'attack', value: 23, label: 'Crush 23' },
      { type: 'heal', value: 10, label: 'Regrow 10' },
    ],
  },
  /** Fragile add spawned by Grove summoners. */
  grove_wisp: {
    id: 'grove_wisp',
    name: 'Grove Wisp',
    maxHp: 20,
    art: 'enemy-wisp',
    intents: [
      { type: 'attack', value: 6, label: 'Spark 6' },
      { type: 'attack', value: 10, label: 'Flare 10' },
      { type: 'debuff', value: 2, label: 'Daze' },
    ],
  },
  blight_stag: {
    id: 'blight_stag',
    name: 'Blight Stag',
    maxHp: 98,
    art: 'enemy-stag',
    intents: [
      { type: 'attack', value: 18, label: 'Gore 18' },
      { type: 'debuff', value: 6, label: 'Venom 6' },
      { type: 'heal', value: 13, label: 'Sap 13' },
      { type: 'attack', value: 25, label: 'Charge 25' },
    ],
    enrageIntents: [
      { type: 'attack', value: 28, label: 'Frenzy 28' },
      { type: 'debuff', value: 8, label: 'Venom 8' },
      { type: 'heal', value: 18, label: 'Sap 18' },
    ],
  },
  mycelium_queen: {
    id: 'mycelium_queen',
    name: 'Mycelium Queen',
    maxHp: 119,
    art: 'enemy-mycelium',
    isElite: true,
    intents: [
      { type: 'summon', value: 1, label: 'Spawn Wisp', summonId: 'grove_wisp' },
      { type: 'heal', value: 15, label: 'Spore Heal 15' },
      { type: 'debuff', value: 6, label: 'Venom 6' },
      { type: 'attack', value: 19, label: 'Tendril 19' },
      { type: 'defend', value: 18, label: 'Mycelium 18' },
    ],
    enrageIntents: [
      { type: 'summon', value: 1, label: 'Spawn Wisp', summonId: 'grove_wisp' },
      { type: 'summon', value: 1, label: 'Spawn Wisp', summonId: 'grove_wisp' },
      { type: 'heal', value: 23, label: 'Spore Heal 23' },
      { type: 'attack', value: 25, label: 'Tendril 25' },
      { type: 'debuff', value: 8, label: 'Venom 8' },
    ],
  },
  thorn_colossus: {
    id: 'thorn_colossus',
    name: 'Thorn Colossus',
    maxHp: 138,
    art: 'enemy-colossus',
    isElite: true,
    intents: [
      { type: 'buff', value: 5, label: 'Thorns +5' },
      { type: 'defend', value: 20, label: 'Harden 20' },
      { type: 'attack', value: 23, label: 'Impale 23' },
      { type: 'attack', value: 30, label: 'Crush 30' },
      { type: 'debuff', value: 2, label: 'Pin' },
    ],
    enrageIntents: [
      { type: 'buff', value: 8, label: 'Rage +8' },
      { type: 'attack', value: 35, label: 'Rampage 35' },
      { type: 'attack', value: 28, label: 'Impale 28' },
      { type: 'defend', value: 25, label: 'Harden 25' },
    ],
  },
  nightmare: {
    id: 'nightmare',
    name: 'Nightmare of the Grove',
    maxHp: 250,
    art: 'enemy-boss',
    isBoss: true,
    intents: [
      { type: 'attack', value: 20, label: 'Shadow 20' },
      { type: 'debuff', value: 6, label: 'Curse 6' },
      { type: 'defend', value: 19, label: 'Veil 19' },
      { type: 'summon', value: 1, label: 'Call Wisp', summonId: 'grove_wisp' },
      { type: 'heal', value: 18, label: 'Dark Bloom 18' },
      { type: 'buff', value: 5, label: 'Empower +5' },
      { type: 'attack', value: 30, label: 'Nightmare 30' },
    ],
    enrageIntents: [
      { type: 'summon', value: 1, label: 'Call Wisp', summonId: 'grove_wisp' },
      { type: 'buff', value: 8, label: 'Awaken +8' },
      { type: 'heal', value: 25, label: 'Dark Bloom 25' },
      { type: 'attack', value: 38, label: 'Nightmare 38' },
      { type: 'debuff', value: 8, label: 'Curse 8' },
      { type: 'attack', value: 28, label: 'Shadow 28' },
    ],
  },

  // ─── Act 2: The Barrens ─────────────────────────────────────────────
  razormane: {
    id: 'razormane',
    name: 'Razormane Quilboar',
    maxHp: 95,
    art: 'enemy-razormane',
    intents: [
      { type: 'defend', value: 16, label: 'Tusk Guard 16' },
      { type: 'attack', value: 18, label: 'Spear 18' },
      { type: 'buff', value: 3, label: 'War Cry +3' },
      { type: 'attack', value: 24, label: 'Gore 24' },
    ],
  },
  thunder_lizard: {
    id: 'thunder_lizard',
    name: 'Thunder Lizard',
    maxHp: 110,
    art: 'enemy-thunder-lizard',
    intents: [
      { type: 'attack', value: 16, label: 'Bolt 16' },
      { type: 'attack', value: 22, label: 'Shock 22' },
      { type: 'debuff', value: 2, label: 'Static' },
      { type: 'defend', value: 12, label: 'Scale 12' },
    ],
  },
  barrens_raptor: {
    id: 'barrens_raptor',
    name: 'Barrens Raptor',
    maxHp: 78,
    art: 'enemy-raptor',
    intents: [
      { type: 'attack', value: 20, label: 'Rake 20' },
      { type: 'attack', value: 14, label: 'Snap 14' },
      { type: 'debuff', value: 2, label: 'Tear' },
      { type: 'attack', value: 28, label: 'Pounce 28' },
    ],
  },
  savannah_cat: {
    id: 'savannah_cat',
    name: 'Savannah Huntress',
    maxHp: 85,
    art: 'enemy-savannah',
    intents: [
      { type: 'attack', value: 17, label: 'Claw 17' },
      { type: 'debuff', value: 2, label: 'Mark' },
      { type: 'attack', value: 25, label: 'Ambush 25' },
      { type: 'buff', value: 4, label: 'Frenzy +4' },
    ],
  },
  kolkar: {
    id: 'kolkar',
    name: 'Kolkar Marauder',
    maxHp: 105,
    art: 'enemy-kolkar',
    intents: [
      { type: 'attack', value: 19, label: 'Axe 19' },
      { type: 'buff', value: 4, label: 'Charge +4' },
      { type: 'defend', value: 14, label: 'Shield 14' },
      { type: 'attack', value: 27, label: 'Trample 27' },
    ],
  },
  witchwing: {
    id: 'witchwing',
    name: 'Witchwing Harpy',
    maxHp: 72,
    art: 'enemy-witchwing',
    intents: [
      { type: 'debuff', value: 2, label: 'Screech' },
      { type: 'attack', value: 15, label: 'Talon 15' },
      { type: 'attack', value: 26, label: 'Dive 26' },
      { type: 'debuff', value: 5, label: 'Venom 5' },
    ],
  },
  dust_scorpion: {
    id: 'dust_scorpion',
    name: 'Dust Scorpion',
    maxHp: 68,
    art: 'enemy-scorpion',
    intents: [
      { type: 'debuff', value: 6, label: 'Venom 6' },
      { type: 'attack', value: 14, label: 'Sting 14' },
      { type: 'defend', value: 10, label: 'Carapace 10' },
      { type: 'attack', value: 21, label: 'Pinch 21' },
    ],
  },
  /** Fragile Barrens add — deviate serpent. */
  deviate_python: {
    id: 'deviate_python',
    name: 'Deviate Python',
    maxHp: 32,
    art: 'enemy-python',
    intents: [
      { type: 'attack', value: 9, label: 'Bite 9' },
      { type: 'debuff', value: 4, label: 'Venom 4' },
      { type: 'attack', value: 13, label: 'Coil 13' },
    ],
  },
  scorched_kodo: {
    id: 'scorched_kodo',
    name: 'Scorched Kodo',
    maxHp: 130,
    art: 'enemy-kodo',
    intents: [
      { type: 'attack', value: 22, label: 'Stomp 22' },
      { type: 'defend', value: 18, label: 'Hide 18' },
      { type: 'attack', value: 30, label: 'Trample 30' },
      { type: 'heal', value: 12, label: 'Grit 12' },
    ],
    enrageIntents: [
      { type: 'attack', value: 34, label: 'Rampage 34' },
      { type: 'buff', value: 5, label: 'Fury +5' },
      { type: 'attack', value: 26, label: 'Stomp 26' },
    ],
  },

  // ─── Barrens elites: Wailing Caverns bosses (random per run) ─────────
  /** Caster fanglord — sleep, lightning, heal, thorns aura. */
  lady_anacondra: {
    id: 'lady_anacondra',
    name: 'Lady Anacondra',
    maxHp: 155,
    art: 'enemy-anacondra',
    isElite: true,
    intents: [
      { type: 'attack', value: 18, label: 'Lightning 18' },
      { type: 'debuff', value: 2, label: 'Slumber' },
      { type: 'heal', value: 16, label: 'Healing Touch 16' },
      { type: 'buff', value: 4, label: 'Thorns +4' },
      { type: 'defend', value: 14, label: 'Serpent Ward 14' },
    ],
    enrageIntents: [
      { type: 'attack', value: 26, label: 'Lightning 26' },
      { type: 'heal', value: 22, label: 'Healing Touch 22' },
      { type: 'buff', value: 6, label: 'Thorns +6' },
      { type: 'debuff', value: 3, label: 'Slumber' },
    ],
  },
  /** Poison fanglord — summons pythons; serpent form enrage. */
  lord_cobrahn: {
    id: 'lord_cobrahn',
    name: 'Lord Cobrahn',
    maxHp: 165,
    art: 'enemy-cobrahn',
    isElite: true,
    intents: [
      { type: 'debuff', value: 6, label: 'Venom 6' },
      { type: 'attack', value: 17, label: 'Lightning 17' },
      { type: 'summon', value: 1, label: 'Call Python', summonId: 'deviate_python' },
      { type: 'debuff', value: 2, label: 'Slumber' },
      { type: 'heal', value: 14, label: 'Healing Touch 14' },
    ],
    enrageIntents: [
      { type: 'buff', value: 8, label: 'Serpent Form +8' },
      { type: 'attack', value: 32, label: 'Fang Strike 32' },
      { type: 'debuff', value: 8, label: 'Venom 8' },
      { type: 'summon', value: 1, label: 'Call Python', summonId: 'deviate_python' },
    ],
  },
  /** Thunderclap fanglord — armor shred + nature damage. */
  lord_pythas: {
    id: 'lord_pythas',
    name: 'Lord Pythas',
    maxHp: 170,
    art: 'enemy-pythas',
    isElite: true,
    intents: [
      { type: 'debuff', value: 2, label: 'Thunderclap' },
      { type: 'attack', value: 20, label: 'Lightning 20' },
      { type: 'heal', value: 15, label: 'Healing Touch 15' },
      { type: 'debuff', value: 2, label: 'Slumber' },
      { type: 'attack', value: 28, label: 'Crack 28' },
    ],
    enrageIntents: [
      { type: 'debuff', value: 2, label: 'Thunderclap' },
      { type: 'attack', value: 34, label: 'Thunder 34' },
      { type: 'heal', value: 20, label: 'Healing Touch 20' },
      { type: 'attack', value: 24, label: 'Lightning 24' },
    ],
  },
  /** Turtle tank — crushing bite shreds armor; huge block. */
  kresh: {
    id: 'kresh',
    name: 'Kresh',
    maxHp: 190,
    art: 'enemy-kresh',
    isElite: true,
    intents: [
      { type: 'defend', value: 22, label: 'Shell 22' },
      { type: 'debuff', value: 2, label: 'Crushing Bite' },
      { type: 'attack', value: 18, label: 'Snap 18' },
      { type: 'attack', value: 26, label: 'Chomp 26' },
      { type: 'heal', value: 10, label: 'Withdraw 10' },
    ],
    enrageIntents: [
      { type: 'debuff', value: 2, label: 'Crushing Bite' },
      { type: 'attack', value: 32, label: 'Chomp 32' },
      { type: 'defend', value: 28, label: 'Shell 28' },
      { type: 'attack', value: 24, label: 'Snap 24' },
    ],
  },
  /** Thunder lizard — chained bolt pressure. */
  skum: {
    id: 'skum',
    name: 'Skum',
    maxHp: 150,
    art: 'enemy-skum',
    isElite: true,
    intents: [
      { type: 'attack', value: 14, label: 'Chain Bolt 14' },
      { type: 'attack', value: 14, label: 'Chain Bolt 14' },
      { type: 'attack', value: 24, label: 'Surge 24' },
      { type: 'debuff', value: 2, label: 'Static' },
      { type: 'defend', value: 12, label: 'Hide 12' },
    ],
    enrageIntents: [
      { type: 'attack', value: 18, label: 'Chain Bolt 18' },
      { type: 'attack', value: 18, label: 'Chain Bolt 18' },
      { type: 'attack', value: 30, label: 'Thunder 30' },
      { type: 'buff', value: 4, label: 'Charge +4' },
    ],
  },
  /** Massive bog elemental — grasping vines lock you down. */
  verdan: {
    id: 'verdan',
    name: 'Verdan the Everliving',
    maxHp: 220,
    art: 'enemy-verdan',
    isElite: true,
    intents: [
      { type: 'debuff', value: 2, label: 'Grasping Vines' },
      { type: 'attack', value: 24, label: 'Smash 24' },
      { type: 'defend', value: 20, label: 'Rootwall 20' },
      { type: 'heal', value: 16, label: 'Everliving 16' },
      { type: 'attack', value: 18, label: 'Lash 18' },
    ],
    enrageIntents: [
      { type: 'debuff', value: 3, label: 'Grasping Vines' },
      { type: 'attack', value: 34, label: 'Smash 34' },
      { type: 'heal', value: 24, label: 'Everliving 24' },
      { type: 'attack', value: 28, label: 'Lash 28' },
    ],
  },

  // ─── Barrens floor boss (always the same) ───────────────────────────
  mutanus: {
    id: 'mutanus',
    name: 'Mutanus the Devourer',
    maxHp: 340,
    art: 'enemy-mutanus',
    isBoss: true,
    intents: [
      { type: 'debuff', value: 3, label: "Naralex's Nightmare" },
      { type: 'attack', value: 22, label: 'Thundercrack 22' },
      { type: 'debuff', value: 2, label: 'Terrify' },
      { type: 'summon', value: 1, label: 'Spawn Python', summonId: 'deviate_python' },
      { type: 'defend', value: 18, label: 'Carapace 18' },
      { type: 'heal', value: 20, label: 'Devour 20' },
      { type: 'attack', value: 32, label: 'Bite 32' },
    ],
    enrageIntents: [
      { type: 'debuff', value: 3, label: "Naralex's Nightmare" },
      { type: 'summon', value: 1, label: 'Spawn Python', summonId: 'deviate_python' },
      { type: 'attack', value: 40, label: 'Thundercrack 40' },
      { type: 'debuff', value: 2, label: 'Terrify' },
      { type: 'buff', value: 6, label: 'Hunger +6' },
      { type: 'heal', value: 28, label: 'Devour 28' },
      { type: 'attack', value: 36, label: 'Bite 36' },
    ],
  },
};

/** Act 1 (Grove) normal combat packs by map depth. */
export const ENCOUNTER_TABLE: string[][] = [
  ['wolf'],
  ['spider'],
  ['wolf', 'spider'],
  ['treant'],
  ['harpy', 'wolf'],
  ['spider', 'spider'],
  ['treant', 'harpy'],
  ['bog_beast'],
  ['blight_stag'],
  ['bog_beast', 'harpy'],
  ['blight_stag', 'spider'],
  ['treant', 'blight_stag'],
  ['bog_beast', 'blight_stag'],
];

/** Act 1 early / mid-run elite packs. */
export const ELITE_ENCOUNTERS: string[][] = [
  ['bog_beast', 'spider'],
  ['treant', 'treant'],
  ['harpy', 'harpy', 'wolf'],
];

/** Act 1 late-run elite packs (floors 8+). */
export const LATE_ELITE_ENCOUNTERS: string[][] = [
  ['mycelium_queen'],
  ['thorn_colossus'],
  ['mycelium_queen', 'grove_wisp'],
  ['thorn_colossus', 'spider'],
  ['blight_stag', 'bog_beast'],
];

/** Act 2 (Barrens) normal combat packs — harder than Grove. */
export const BARRENS_ENCOUNTER_TABLE: string[][] = [
  ['razormane'],
  ['dust_scorpion'],
  ['barrens_raptor'],
  ['razormane', 'dust_scorpion'],
  ['thunder_lizard'],
  ['witchwing', 'barrens_raptor'],
  ['savannah_cat', 'dust_scorpion'],
  ['kolkar'],
  ['thunder_lizard', 'razormane'],
  ['scorched_kodo'],
  ['kolkar', 'witchwing'],
  ['scorched_kodo', 'barrens_raptor'],
  ['kolkar', 'thunder_lizard'],
  ['scorched_kodo', 'savannah_cat'],
];

/**
 * Wailing Caverns bosses used as Barrens elites.
 * Each elite node randomly picks one from this pool (repeats allowed).
 */
export const BARRENS_ELITE_POOL: string[] = [
  'lady_anacondra',
  'lord_cobrahn',
  'lord_pythas',
  'kresh',
  'skum',
  'verdan',
];

export const BARRENS_BOSS_ID = 'mutanus';

export const ACT_NAMES: Record<1 | 2, string> = {
  1: 'The Corrupted Grove',
  2: 'The Barrens',
};
