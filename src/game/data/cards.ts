import {
  PRIEST_CARDS,
  PRIEST_REWARD_POOL,
  PRIEST_STARTER_BY_SPEC,
  PRIEST_STARTER_DECK,
} from './priestCards';
import type { CardDef, ClassId, OpeningSpec } from './types';

/** Gold cost to purchase a card by rarity (shop + extra reward picks). */
export const CARD_BUY_COST: Record<CardDef['rarity'], number> = {
  common: 40,
  rare: 60,
  epic: 85,
  legendary: 120,
};

/** First card removal cost; each later removal costs +CARD_REMOVE_COST_STEP. */
export const CARD_REMOVE_BASE_COST = 20;
export const CARD_REMOVE_COST_STEP = 10;

/** @deprecated Prefer cardRemoveCost(run.cardsRemoved). Kept for call-site migration. */
export const CARD_REMOVE_COST = CARD_REMOVE_BASE_COST;

export function cardRemoveCost(cardsRemoved: number): number {
  return CARD_REMOVE_BASE_COST + Math.max(0, cardsRemoved) * CARD_REMOVE_COST_STEP;
}

/** Base card-offer reroll cost; each reroll costs +1g until a fight resets the counter. */
export const SHOP_REROLL_BASE_COST = 1;

export function shopRerollCost(rerollCount: number): number {
  return SHOP_REROLL_BASE_COST + Math.max(0, rerollCount);
}

/** Skip-card consolations — make passing on a free pick feel worthwhile. */
export const SKIP_GOLD_REWARD = 20;
export const SKIP_HEAL_REWARD = 10;
export const POTION_HEAL_AMOUNT = 22;

/** Floor-scaled rarity weights for reward/shop offers (relative weights). */
export type RarityWeights = Record<CardDef['rarity'], number>;

export function rarityWeightsForFloor(floor: number): RarityWeights {
  if (floor <= 2) return { common: 72, rare: 22, epic: 5, legendary: 1 };
  if (floor <= 5) return { common: 55, rare: 30, epic: 12, legendary: 3 };
  if (floor <= 8) return { common: 40, rare: 35, epic: 18, legendary: 7 };
  return { common: 28, rare: 34, epic: 26, legendary: 12 };
}

export const DRUID_CARDS: Record<string, CardDef> = {
  // ── Bear ────────────────────────────────────────────────────────
  barkskin: {
    id: 'barkskin',
    name: 'Barkskin',
    form: 'bear',
    cost: 1,
    description: 'Gain 12 Block.',
    target: 'self',
    effects: [{ kind: 'block', value: 12 }],
    art: 'card-barkskin',
    rarity: 'rare',
  },
  swipe: {
    id: 'swipe',
    name: 'Swipe',
    form: 'bear',
    cost: 1,
    description: 'Deal 8 damage to up to 4 enemies.',
    target: 'allEnemies',
    effects: [{ kind: 'aoeDamage', value: 8, maxTargets: 4 }],
    art: 'card-swipe',
    rarity: 'common',
  },
  maul: {
    id: 'maul',
    name: 'Maul',
    form: 'bear',
    cost: 2,
    description: 'Deal 12 damage. Gain 10 Block.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 12 },
      { kind: 'block', value: 10 },
    ],
    art: 'card-barkskin',
    rarity: 'common',
  },
  thrash: {
    id: 'thrash',
    name: 'Thrash',
    form: 'bear',
    cost: 1,
    description: 'Deal 5 damage to ALL enemies. Apply 6 bleed over 3 turns.',
    target: 'allEnemies',
    effects: [
      { kind: 'aoeDamage', value: 5 },
      { kind: 'damageOverTime', value: 6, duration: 3 },
    ],
    art: 'card-thrash',
    rarity: 'common',
  },
  mangle: {
    id: 'mangle',
    name: 'Mangle',
    form: 'bear',
    cost: 1,
    description: 'Deal 10 damage. Apply Vulnerable (enemy takes 50% more damage).',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 10 },
      { kind: 'vulnerable', value: 1, duration: 2 },
    ],
    art: 'card-mangle',
    rarity: 'rare',
  },
  ironfur: {
    id: 'ironfur',
    name: 'Ironfur',
    form: 'bear',
    cost: 1,
    description: 'Gain 18 Block.',
    target: 'self',
    effects: [{ kind: 'block', value: 18 }],
    art: 'card-ironfur',
    rarity: 'epic',
  },
  survival_instincts: {
    id: 'survival_instincts',
    name: 'Survival Instincts',
    form: 'bear',
    cost: 2,
    description: 'Gain 25 Block. Heal 15.',
    target: 'self',
    effects: [
      { kind: 'block', value: 25 },
      { kind: 'heal', value: 15 },
    ],
    art: 'card-survival-instincts',
    rarity: 'legendary',
  },

  // ── Cat ─────────────────────────────────────────────────────────
  claw: {
    id: 'claw',
    name: 'Claw',
    form: 'cat',
    cost: 1,
    description: 'Deal 12 damage to a single target.',
    target: 'enemy',
    effects: [{ kind: 'damage', value: 12 }],
    art: 'card-claw',
    rarity: 'common',
  },
  rip: {
    id: 'rip',
    name: 'Rip',
    form: 'cat',
    cost: 2,
    description: 'Deal 24 damage over 3 turns.',
    target: 'enemy',
    effects: [{ kind: 'damageOverTime', value: 24, duration: 3 }],
    art: 'card-rip',
    rarity: 'rare',
  },
  shred: {
    id: 'shred',
    name: 'Shred',
    form: 'cat',
    cost: 0,
    description: 'Deal 6 damage. Draw 1 card.',
    target: 'enemy',
    effects: [{ kind: 'damage', value: 6 }],
    art: 'card-claw',
    rarity: 'common',
  },
  rake: {
    id: 'rake',
    name: 'Rake',
    form: 'cat',
    cost: 1,
    description: 'Deal 4 damage + 12 bleed over 3 turns.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 4 },
      { kind: 'damageOverTime', value: 12, duration: 3 },
    ],
    art: 'card-rake',
    rarity: 'common',
  },
  ferocious_bite: {
    id: 'ferocious_bite',
    name: 'Ferocious Bite',
    form: 'cat',
    cost: 2,
    description: 'Deal 16 damage. Deals +10 if the target is bleeding.',
    target: 'enemy',
    effects: [{ kind: 'damage', value: 16 }],
    art: 'card-ferocious-bite',
    rarity: 'rare',
  },
  tigers_fury: {
    id: 'tigers_fury',
    name: "Tiger's Fury",
    form: 'cat',
    cost: 0,
    description: 'Gain 4 Strength this combat.',
    target: 'self',
    effects: [{ kind: 'strength', value: 4 }],
    art: 'card-tigers-fury',
    rarity: 'epic',
  },
  predatory_strike: {
    id: 'predatory_strike',
    name: 'Predatory Strike',
    form: 'cat',
    cost: 1,
    description: 'Deal 14 damage. Draw 1. Gain 1 Energy.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 14 },
      { kind: 'draw', value: 1 },
      { kind: 'energy', value: 1 },
    ],
    art: 'card-predatory-strike',
    rarity: 'legendary',
  },

  // ── Boomkin ─────────────────────────────────────────────────────
  wrath: {
    id: 'wrath',
    name: 'Wrath',
    form: 'boomkin',
    cost: 1,
    description: 'Deal 11 damage.',
    target: 'enemy',
    effects: [{ kind: 'damage', value: 11 }],
    art: 'card-starfire',
    rarity: 'common',
  },
  starfire: {
    id: 'starfire',
    name: 'Starfire',
    form: 'boomkin',
    cost: 2,
    description: 'Deal 18 damage. Draw 1 card.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 18 },
      { kind: 'draw', value: 1 },
    ],
    art: 'card-starfire',
    rarity: 'rare',
  },
  hurricane: {
    id: 'hurricane',
    name: 'Hurricane',
    form: 'boomkin',
    cost: 2,
    description: 'Deal 10 damage to ALL enemies.',
    target: 'allEnemies',
    effects: [{ kind: 'aoeDamage', value: 10 }],
    art: 'card-hurricane',
    rarity: 'epic',
  },
  starsurge: {
    id: 'starsurge',
    name: 'Starsurge',
    form: 'boomkin',
    cost: 1,
    description:
      'Deal 14 damage. Apply Earth and Moon: next Wrath or Starfire deals +50% damage.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 14 },
      { kind: 'earthAndMoon', value: 50 },
    ],
    art: 'card-starsurge',
    rarity: 'epic',
  },
  moonfire: {
    id: 'moonfire',
    name: 'Moonfire',
    form: 'boomkin',
    cost: 1,
    description: 'Deal 6 damage + 9 over 3 turns.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 6 },
      { kind: 'damageOverTime', value: 9, duration: 3 },
    ],
    art: 'card-starfire',
    rarity: 'common',
  },
  sunfire: {
    id: 'sunfire',
    name: 'Sunfire',
    form: 'boomkin',
    cost: 1,
    description: 'Deal 5 damage to ALL enemies + 6 burn over 3 turns to each.',
    target: 'allEnemies',
    effects: [
      { kind: 'aoeDamage', value: 5 },
      { kind: 'damageOverTime', value: 6, duration: 3 },
    ],
    art: 'card-sunfire',
    rarity: 'common',
  },
  starfall: {
    id: 'starfall',
    name: 'Starfall',
    form: 'boomkin',
    cost: 2,
    description: 'Deal 8 damage to ALL enemies. Draw 1 card.',
    target: 'allEnemies',
    effects: [
      { kind: 'aoeDamage', value: 8 },
      { kind: 'draw', value: 1 },
    ],
    art: 'card-starfall',
    rarity: 'rare',
  },
  celestial_alignment: {
    id: 'celestial_alignment',
    name: 'Celestial Alignment',
    form: 'boomkin',
    cost: 1,
    description: 'Gain 5 Spell Power this combat (spells only).',
    target: 'self',
    effects: [{ kind: 'spellPower', value: 5 }],
    art: 'card-celestial-alignment',
    rarity: 'epic',
  },
  incarnation: {
    id: 'incarnation',
    name: 'Incarnation',
    form: 'boomkin',
    cost: 2,
    description: 'Gain 8 Spell Power (spells only). Deal 12 damage. Draw 2 cards.',
    target: 'enemy',
    effects: [
      { kind: 'spellPower', value: 8 },
      { kind: 'damage', value: 12 },
      { kind: 'draw', value: 2 },
    ],
    art: 'card-incarnation',
    rarity: 'legendary',
  },

  // ── Tree ────────────────────────────────────────────────────────
  innervate: {
    id: 'innervate',
    name: 'Innervate',
    form: 'tree',
    cost: 0,
    description: 'Gain 2 Energy.',
    target: 'self',
    effects: [{ kind: 'energy', value: 2 }],
    art: 'card-innervate',
    rarity: 'rare',
  },
  decurse: {
    id: 'decurse',
    name: 'Decurse',
    form: 'tree',
    cost: 0,
    description: 'Remove all debuffs from yourself. Gain 6 Block.',
    target: 'self',
    effects: [
      { kind: 'cleanse', value: 0 },
      { kind: 'block', value: 6 },
    ],
    art: 'card-decurse',
    rarity: 'rare',
  },
  rejuvenation: {
    id: 'rejuvenation',
    name: 'Rejuvenation',
    form: 'tree',
    cost: 1,
    description: 'Heal 30 health over 5 turns.',
    target: 'self',
    effects: [{ kind: 'healOverTime', value: 30, duration: 5 }],
    art: 'card-rejuvenation',
    rarity: 'common',
  },
  healing_touch: {
    id: 'healing_touch',
    name: 'Healing Touch',
    form: 'tree',
    cost: 2,
    description: 'Heal 22 health.',
    target: 'self',
    effects: [{ kind: 'heal', value: 22 }],
    art: 'card-healing-touch',
    rarity: 'common',
  },
  wild_growth: {
    id: 'wild_growth',
    name: 'Wild Growth',
    form: 'tree',
    cost: 1,
    description: 'Gain 10 Block. Heal 6.',
    target: 'self',
    effects: [
      { kind: 'block', value: 10 },
      { kind: 'heal', value: 6 },
    ],
    art: 'card-rejuvenation',
    rarity: 'common',
  },
  swiftmend: {
    id: 'swiftmend',
    name: 'Swiftmend',
    form: 'tree',
    cost: 1,
    description: 'Heal 16. Draw 1 card.',
    target: 'self',
    effects: [
      { kind: 'heal', value: 16 },
      { kind: 'draw', value: 1 },
    ],
    art: 'card-swiftmend',
    rarity: 'common',
  },
  lifebloom: {
    id: 'lifebloom',
    name: 'Lifebloom',
    form: 'tree',
    cost: 1,
    description: 'Heal 8 now. Heal 20 over 4 turns.',
    target: 'self',
    effects: [
      { kind: 'heal', value: 8 },
      { kind: 'healOverTime', value: 20, duration: 4 },
    ],
    art: 'card-lifebloom',
    rarity: 'rare',
  },
  ironbark: {
    id: 'ironbark',
    name: 'Ironbark',
    form: 'tree',
    cost: 1,
    description: 'Gain 14 Block. Heal 10.',
    target: 'self',
    effects: [
      { kind: 'block', value: 14 },
      { kind: 'heal', value: 10 },
    ],
    art: 'card-ironbark',
    rarity: 'epic',
  },
  tranquility: {
    id: 'tranquility',
    name: 'Tranquility',
    form: 'tree',
    cost: 2,
    description: 'Heal 28. Gain 12 Block. Remove all debuffs.',
    target: 'self',
    effects: [
      { kind: 'heal', value: 28 },
      { kind: 'block', value: 12 },
      { kind: 'cleanse', value: 0 },
    ],
    art: 'card-tranquility',
    rarity: 'legendary',
  },
};

/** Lean shared core — every Druid opens with these, then swaps in a form package. */
export const DRUID_STARTER_CORE: string[] = [
  'swipe',
  'claw',
  'wrath',
  'rejuvenation',
  'barkskin',
  'healing_touch',
  'moonfire',
  'decurse',
];

/**
 * Form packages (5 cards) swapped onto the core at run start.
 * Specialization starts at minute one — not after two removes.
 */
export const DRUID_SPEC_PACKAGE: Record<'bear' | 'cat' | 'boomkin' | 'tree', string[]> = {
  bear: ['swipe', 'maul', 'thrash', 'mangle', 'ironfur'],
  cat: ['claw', 'shred', 'rip', 'rake', 'ferocious_bite'],
  boomkin: ['wrath', 'starfire', 'starsurge', 'sunfire', 'hurricane'],
  tree: ['rejuvenation', 'healing_touch', 'wild_growth', 'lifebloom', 'swiftmend'],
};

/** Cards removed from the core when a form package is applied (keeps deck lean). */
export const DRUID_SPEC_TRIM: Record<'bear' | 'cat' | 'boomkin' | 'tree', string[]> = {
  bear: ['moonfire', 'decurse', 'wrath', 'claw'],
  cat: ['moonfire', 'decurse', 'wrath', 'healing_touch'],
  boomkin: ['decurse', 'claw', 'barkskin', 'healing_touch'],
  tree: ['moonfire', 'claw', 'wrath', 'barkskin'],
};

export function buildDruidStarter(spec: OpeningSpec): string[] {
  const form: 'bear' | 'cat' | 'boomkin' | 'tree' =
    spec === 'cat' || spec === 'boomkin' || spec === 'tree' ? spec : 'bear';
  const trim = new Set(DRUID_SPEC_TRIM[form]);
  const core = DRUID_STARTER_CORE.filter((id) => !trim.has(id));
  return [...core, ...DRUID_SPEC_PACKAGE[form]];
}

/** Fallback / legacy flat starter (Bear-leaning). Prefer buildDruidStarter. */
export const STARTER_DECK: string[] = buildDruidStarter('bear');

export const REWARD_POOL: string[] = [
  'barkskin',
  'swipe',
  'maul',
  'thrash',
  'mangle',
  'ironfur',
  'survival_instincts',
  'claw',
  'rip',
  'shred',
  'rake',
  'ferocious_bite',
  'tigers_fury',
  'predatory_strike',
  'wrath',
  'starfire',
  'hurricane',
  'starsurge',
  'moonfire',
  'sunfire',
  'starfall',
  'celestial_alignment',
  'incarnation',
  'innervate',
  'decurse',
  'rejuvenation',
  'healing_touch',
  'wild_growth',
  'swiftmend',
  'lifebloom',
  'ironbark',
  'tranquility',
];

/** All cards across classes (ids must be unique). */
export const CARDS: Record<string, CardDef> = {
  ...DRUID_CARDS,
  ...PRIEST_CARDS,
};

export function buildStarterDeck(classId: ClassId, spec: OpeningSpec): string[] {
  if (classId === 'priest') {
    return [...(PRIEST_STARTER_BY_SPEC[spec] ?? PRIEST_STARTER_BY_SPEC.holy)];
  }
  return buildDruidStarter(spec);
}

export const STARTER_DECKS: Record<ClassId, string[]> = {
  druid: STARTER_DECK,
  priest: PRIEST_STARTER_DECK,
};

export const REWARD_POOLS: Record<ClassId, string[]> = {
  druid: REWARD_POOL,
  priest: PRIEST_REWARD_POOL,
};

export const FORM_COLORS: Record<string, number> = {
  bear: 0x8b5a2b,
  cat: 0xc9a227,
  boomkin: 0x5b7cfa,
  tree: 0x3d9b6a,
  holy: 0xf0c75e,
  shadow: 0x7c3aed,
  discipline: 0xe8e0d0,
};

export const FORM_LABELS: Record<string, string> = {
  bear: 'Bear',
  cat: 'Cat',
  boomkin: 'Boomkin',
  tree: 'Tree',
  holy: 'Holy',
  shadow: 'Shadow',
  discipline: 'Discipline',
};

export const SPEC_BLURBS: Record<OpeningSpec, string> = {
  bear: 'Tank & AoE — Swipe, Maul, Ironfur',
  cat: 'Single-target claws — Rip, Shred, Bite',
  boomkin: 'Big spells — Wrath, Starfire, Starsurge',
  tree: 'Healing grove — Rejuv, Lifebloom, Swiftmend',
  holy: 'Direct heals — Flash Heal, Renew, Nova',
  shadow: 'DoTs & void — Pain, Mind Blast, Death',
  discipline: 'Shields & atonement — Smite, Penance, Shield',
};

export const RARITY_LABELS: Record<CardDef['rarity'], string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

export const RARITY_COLORS: Record<CardDef['rarity'], string> = {
  common: '#94a3b8',
  rare: '#60a5fa',
  epic: '#c084fc',
  legendary: '#fbbf24',
};

export function cardBuyCost(cardId: string): number {
  const card = CARDS[cardId];
  if (!card) return CARD_BUY_COST.common;
  return CARD_BUY_COST[card.rarity];
}
