import {
  PRIEST_CARDS,
  PRIEST_REWARD_POOL,
  PRIEST_STARTER_BY_SPEC,
  PRIEST_STARTER_DECK,
} from './priestCards';
import {
  SHAMAN_CARDS,
  SHAMAN_REWARD_POOL,
  SHAMAN_STARTER_BY_SPEC,
  SHAMAN_STARTER_DECK,
} from './shamanCards';
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

export const CURSE_CARD_ID = 'nightmare';

export const CURSE_CARDS: Record<string, CardDef> = {
  nightmare: {
    id: 'nightmare',
    name: 'Nightmare',
    form: 'shadow',
    cost: 0,
    description: 'Unplayable. When drawn, take 5 damage.',
    target: 'none',
    effects: [],
    art: 'card-shadow-word-pain',
    rarity: 'common',
    unplayable: true,
    curse: true,
  },
};

export const DRUID_CARDS: Record<string, CardDef> = {
  // ── Bear ────────────────────────────────────────────────────────
  barkskin: {
    id: 'barkskin',
    name: 'Barkskin',
    form: 'bear',
    cost: 1,
    description: 'Gain 10 Block. Whenever you gain Block this turn, also Heal 4.',
    target: 'self',
    effects: [
      { kind: 'echo', value: 4, echoFrom: 'block', echoTo: 'heal', duration: 1 },
      { kind: 'block', value: 10 },
    ],
    art: 'card-barkskin',
    rarity: 'rare',
  },
  swipe: {
    id: 'swipe',
    name: 'Swipe',
    form: 'bear',
    cost: 1,
    description: 'Deal 7 damage to up to 4 enemies. Apply Weak for 1 turn.',
    target: 'allEnemies',
    effects: [
      { kind: 'aoeDamage', value: 7, maxTargets: 4 },
      { kind: 'weaken', value: 1, duration: 1 },
    ],
    art: 'card-swipe',
    rarity: 'common',
  },
  maul: {
    id: 'maul',
    name: 'Maul',
    form: 'bear',
    cost: 2,
    description: 'Deal 11 damage. Gain 8 Block. Discard 1 card: Draw 1.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 11 },
      { kind: 'block', value: 8 },
      { kind: 'discardDraw', value: 1, discardCount: 1, drawValue: 1 },
    ],
    art: 'card-barkskin',
    rarity: 'common',
  },
  thrash: {
    id: 'thrash',
    name: 'Thrash',
    form: 'bear',
    cost: 1,
    description:
      'Deal 4 damage to ALL enemies. Apply 6 bleed over 3 turns. Deal 5 to a random enemy.',
    target: 'allEnemies',
    effects: [
      { kind: 'aoeDamage', value: 4 },
      { kind: 'damageOverTime', value: 6, duration: 3 },
      { kind: 'randomDamage', value: 5 },
    ],
    art: 'card-thrash',
    rarity: 'common',
  },
  mangle: {
    id: 'mangle',
    name: 'Mangle',
    form: 'bear',
    cost: 1,
    description: 'Deal 9 damage. Apply Vulnerable and Weak for 2 turns.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 9 },
      { kind: 'vulnerable', value: 1, duration: 2 },
      { kind: 'weaken', value: 1, duration: 2 },
    ],
    art: 'card-mangle',
    rarity: 'rare',
  },
  ironfur: {
    id: 'ironfur',
    name: 'Ironfur',
    form: 'bear',
    cost: 1,
    description: 'Discard up to 2 cards. Gain 10 Block + 6 Block per card discarded.',
    target: 'self',
    effects: [
      {
        kind: 'discardFor',
        value: 10,
        discardCount: 2,
        bonusPerDiscard: 6,
        payoffKind: 'block',
      },
    ],
    art: 'card-ironfur',
    rarity: 'epic',
  },
  survival_instincts: {
    id: 'survival_instincts',
    name: 'Survival Instincts',
    form: 'bear',
    cost: 2,
    description: 'Gain 22 Block. Heal 14. Shuffle a Nightmare into your deck.',
    target: 'self',
    effects: [
      { kind: 'block', value: 22 },
      { kind: 'heal', value: 14 },
      { kind: 'shuffleCurse', value: 1 },
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
    description: 'Deal 10 damage. Draw a random Attack card.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 10 },
      { kind: 'drawTyped', value: 1, cardType: 'attack' },
    ],
    art: 'card-claw',
    rarity: 'common',
  },
  rip: {
    id: 'rip',
    name: 'Rip',
    form: 'cat',
    cost: 2,
    description: 'Deal 18 damage over 3 turns. Copy a random card into your draw pile.',
    target: 'enemy',
    effects: [
      { kind: 'damageOverTime', value: 18, duration: 3 },
      { kind: 'copyCard', value: 1 },
    ],
    art: 'card-rip',
    rarity: 'rare',
  },
  shred: {
    id: 'shred',
    name: 'Shred',
    form: 'cat',
    cost: 0,
    description: 'Deal 5 damage. Discard 1 card: Draw 2.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 5 },
      { kind: 'discardDraw', value: 1, discardCount: 1, drawValue: 2 },
    ],
    art: 'card-claw',
    rarity: 'common',
  },
  rake: {
    id: 'rake',
    name: 'Rake',
    form: 'cat',
    cost: 1,
    description: 'Deal 4 damage + 12 bleed over 3 turns. Take 3 recoil.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 4 },
      { kind: 'damageOverTime', value: 12, duration: 3 },
      { kind: 'recoil', value: 3 },
    ],
    art: 'card-rake',
    rarity: 'common',
  },
  ferocious_bite: {
    id: 'ferocious_bite',
    name: 'Ferocious Bite',
    form: 'cat',
    cost: 2,
    description: 'Deal 18 damage (+10 if bleeding). Take 6 recoil.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 18 },
      { kind: 'recoil', value: 6 },
    ],
    art: 'card-ferocious-bite',
    rarity: 'rare',
  },
  tigers_fury: {
    id: 'tigers_fury',
    name: "Tiger's Fury",
    form: 'cat',
    cost: 0,
    description: 'Gain 3 Strength. Double your current Strength and Block.',
    target: 'self',
    effects: [
      { kind: 'strength', value: 3 },
      { kind: 'doubleBuffs', value: 1 },
    ],
    art: 'card-tigers-fury',
    rarity: 'epic',
  },
  predatory_strike: {
    id: 'predatory_strike',
    name: 'Predatory Strike',
    form: 'cat',
    cost: 1,
    description: 'Deal 16 damage. Draw 1. Gain 1 Energy. Shuffle a Nightmare into your deck.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 16 },
      { kind: 'draw', value: 1 },
      { kind: 'energy', value: 1 },
      { kind: 'shuffleCurse', value: 1 },
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
    description: 'Deal 10 damage to a random enemy.',
    target: 'self',
    effects: [{ kind: 'randomDamage', value: 10 }],
    art: 'card-starfire',
    rarity: 'common',
  },
  starfire: {
    id: 'starfire',
    name: 'Starfire',
    form: 'boomkin',
    cost: 2,
    description: 'Deal 16 damage. Put a random card from your discard on top of your draw pile.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 16 },
      { kind: 'retrieveDiscard', value: 1, retrieveMode: 'top' },
    ],
    art: 'card-starfire',
    rarity: 'rare',
  },
  hurricane: {
    id: 'hurricane',
    name: 'Hurricane',
    form: 'boomkin',
    cost: 2,
    description: 'Deal 8 damage to ALL enemies. Apply Weak for 2 turns.',
    target: 'allEnemies',
    effects: [
      { kind: 'aoeDamage', value: 8 },
      { kind: 'weaken', value: 1, duration: 2 },
    ],
    art: 'card-hurricane',
    rarity: 'epic',
  },
  starsurge: {
    id: 'starsurge',
    name: 'Starsurge',
    form: 'boomkin',
    cost: 1,
    description:
      'Deal 12 damage. Apply Earth and Moon (+50% next Wrath/Starfire). Draw a random Attack card.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 12 },
      { kind: 'earthAndMoon', value: 50 },
      { kind: 'drawTyped', value: 1, cardType: 'attack' },
    ],
    art: 'card-starsurge',
    rarity: 'epic',
  },
  moonfire: {
    id: 'moonfire',
    name: 'Moonfire',
    form: 'boomkin',
    cost: 1,
    description:
      'Deal 5 damage + 9 over 3 turns. Whenever you deal damage this turn, gain 2 Block.',
    target: 'enemy',
    effects: [
      { kind: 'echo', value: 2, echoFrom: 'attack', echoTo: 'block', duration: 1 },
      { kind: 'damage', value: 5 },
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
    description:
      'Deal 4 damage to ALL enemies + 6 burn over 3 turns. Deal 6 to a random enemy.',
    target: 'allEnemies',
    effects: [
      { kind: 'aoeDamage', value: 4 },
      { kind: 'damageOverTime', value: 6, duration: 3 },
      { kind: 'randomDamage', value: 6 },
    ],
    art: 'card-sunfire',
    rarity: 'common',
  },
  starfall: {
    id: 'starfall',
    name: 'Starfall',
    form: 'boomkin',
    cost: 2,
    description: 'Deal 7 damage to ALL enemies. Add a random card from your discard to your hand.',
    target: 'allEnemies',
    effects: [
      { kind: 'aoeDamage', value: 7 },
      { kind: 'retrieveDiscard', value: 1, retrieveMode: 'hand' },
    ],
    art: 'card-starfall',
    rarity: 'rare',
  },
  celestial_alignment: {
    id: 'celestial_alignment',
    name: 'Celestial Alignment',
    form: 'boomkin',
    cost: 1,
    description: 'Gain 4 Spell Power. Double your current buffs (Spell Power, Block, Strength…).',
    target: 'self',
    effects: [
      { kind: 'spellPower', value: 4 },
      { kind: 'doubleBuffs', value: 1 },
    ],
    art: 'card-celestial-alignment',
    rarity: 'epic',
  },
  thorns: {
    id: 'thorns',
    name: 'Thorns',
    form: 'boomkin',
    cost: 1,
    description: 'Gain Thorns for 3 turns: whenever an enemy damages you, deal 15 back.',
    target: 'self',
    effects: [{ kind: 'thorns', value: 15, duration: 3 }],
    art: 'card-sunfire',
    rarity: 'rare',
  },
  incarnation: {
    id: 'incarnation',
    name: 'Incarnation',
    form: 'boomkin',
    cost: 2,
    description:
      'Gain 6 Spell Power. Deal 14 damage. Draw 2. Shuffle a Nightmare into your deck.',
    target: 'enemy',
    effects: [
      { kind: 'spellPower', value: 6 },
      { kind: 'damage', value: 14 },
      { kind: 'draw', value: 2 },
      { kind: 'shuffleCurse', value: 1 },
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
    description: 'Gain 2 Energy. Discard 1 card: Draw 1.',
    target: 'self',
    effects: [
      { kind: 'energy', value: 2 },
      { kind: 'discardDraw', value: 1, discardCount: 1, drawValue: 1 },
    ],
    art: 'card-innervate',
    rarity: 'rare',
  },
  decurse: {
    id: 'decurse',
    name: 'Decurse',
    form: 'tree',
    cost: 0,
    description: 'Remove all debuffs. Gain 6 Block. Draw a random Heal card.',
    target: 'self',
    effects: [
      { kind: 'cleanse', value: 0 },
      { kind: 'block', value: 6 },
      { kind: 'drawTyped', value: 1, cardType: 'heal' },
    ],
    art: 'card-decurse',
    rarity: 'rare',
  },
  rejuvenation: {
    id: 'rejuvenation',
    name: 'Rejuvenation',
    form: 'tree',
    cost: 1,
    description: 'Heal 24 over 5 turns. Whenever you Heal this turn, gain 3 Block.',
    target: 'self',
    effects: [
      { kind: 'echo', value: 3, echoFrom: 'heal', echoTo: 'block', duration: 1 },
      { kind: 'healOverTime', value: 24, duration: 5 },
    ],
    art: 'card-rejuvenation',
    rarity: 'common',
  },
  healing_touch: {
    id: 'healing_touch',
    name: 'Healing Touch',
    form: 'tree',
    cost: 2,
    description: 'Discard 2 cards. Heal 26.',
    target: 'self',
    effects: [
      { kind: 'discardRandom', value: 2 },
      { kind: 'heal', value: 26 },
    ],
    art: 'card-healing-touch',
    rarity: 'common',
  },
  wild_growth: {
    id: 'wild_growth',
    name: 'Wild Growth',
    form: 'tree',
    cost: 1,
    description:
      'Gain 8 Block. Heal 5. Whenever you gain Block this turn, deal 2 to a random enemy.',
    target: 'self',
    effects: [
      { kind: 'echo', value: 2, echoFrom: 'block', echoTo: 'attack', duration: 1 },
      { kind: 'block', value: 8 },
      { kind: 'heal', value: 5 },
    ],
    art: 'card-rejuvenation',
    rarity: 'common',
  },
  swiftmend: {
    id: 'swiftmend',
    name: 'Swiftmend',
    form: 'tree',
    cost: 1,
    description: 'Heal 14. Play a random Heal card from your discard immediately.',
    target: 'self',
    effects: [
      { kind: 'heal', value: 14 },
      { kind: 'retrieveDiscard', value: 1, retrieveMode: 'play', cardType: 'heal' },
    ],
    art: 'card-swiftmend',
    rarity: 'common',
  },
  lifebloom: {
    id: 'lifebloom',
    name: 'Lifebloom',
    form: 'tree',
    cost: 1,
    description: 'Heal 8 now. Heal 16 over 4 turns. Copy a random card into your draw pile.',
    target: 'self',
    effects: [
      { kind: 'heal', value: 8 },
      { kind: 'healOverTime', value: 16, duration: 4 },
      { kind: 'copyCard', value: 1 },
    ],
    art: 'card-lifebloom',
    rarity: 'rare',
  },
  ironbark: {
    id: 'ironbark',
    name: 'Ironbark',
    form: 'tree',
    cost: 1,
    description: 'Gain 12 Block. Heal 8. Double your current Block and buffs.',
    target: 'self',
    effects: [
      { kind: 'block', value: 12 },
      { kind: 'heal', value: 8 },
      { kind: 'doubleBuffs', value: 1 },
    ],
    art: 'card-ironbark',
    rarity: 'epic',
  },
  tranquility: {
    id: 'tranquility',
    name: 'Tranquility',
    form: 'tree',
    cost: 2,
    description: 'Heal 24. Gain 10 Block. Remove all debuffs. Shuffle a Nightmare into your deck.',
    target: 'self',
    effects: [
      { kind: 'heal', value: 24 },
      { kind: 'block', value: 10 },
      { kind: 'cleanse', value: 0 },
      { kind: 'shuffleCurse', value: 1 },
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
 * Spec packages (5 cards) swapped onto the core at run start.
 * Specialization starts at minute one — not after two removes.
 * Feral mixes Bear tank tools with Cat tempo / finishers.
 */
export const DRUID_SPEC_PACKAGE: Record<'feral' | 'boomkin' | 'tree', string[]> = {
  feral: ['swipe', 'maul', 'claw', 'shred', 'rip'],
  boomkin: ['wrath', 'starfire', 'starsurge', 'thorns', 'hurricane'],
  tree: ['rejuvenation', 'healing_touch', 'wild_growth', 'lifebloom', 'swiftmend'],
};

/** Cards removed from the core when a form package is applied (keeps deck lean). */
export const DRUID_SPEC_TRIM: Record<'feral' | 'boomkin' | 'tree', string[]> = {
  feral: ['moonfire', 'decurse', 'wrath', 'healing_touch'],
  boomkin: ['decurse', 'claw', 'barkskin', 'healing_touch'],
  tree: ['moonfire', 'claw', 'wrath', 'barkskin'],
};

export function buildDruidStarter(spec: OpeningSpec): string[] {
  const form: 'feral' | 'boomkin' | 'tree' =
    spec === 'boomkin' || spec === 'tree' ? spec : 'feral';
  const trim = new Set(DRUID_SPEC_TRIM[form]);
  const core = DRUID_STARTER_CORE.filter((id) => !trim.has(id));
  return [...core, ...DRUID_SPEC_PACKAGE[form]];
}

/** Fallback / legacy flat starter (Feral). Prefer buildDruidStarter. */
export const STARTER_DECK: string[] = buildDruidStarter('feral');

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
  'thorns',
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
  ...SHAMAN_CARDS,
  ...CURSE_CARDS,
};

export function buildStarterDeck(classId: ClassId, spec: OpeningSpec): string[] {
  if (classId === 'priest') {
    return [...(PRIEST_STARTER_BY_SPEC[spec] ?? PRIEST_STARTER_BY_SPEC.holy)];
  }
  if (classId === 'shaman') {
    return [...(SHAMAN_STARTER_BY_SPEC[spec] ?? SHAMAN_STARTER_BY_SPEC.resto)];
  }
  return buildDruidStarter(spec);
}

export const STARTER_DECKS: Record<ClassId, string[]> = {
  druid: STARTER_DECK,
  priest: PRIEST_STARTER_DECK,
  shaman: SHAMAN_STARTER_DECK,
};

export const REWARD_POOLS: Record<ClassId, string[]> = {
  druid: REWARD_POOL,
  priest: PRIEST_REWARD_POOL,
  shaman: SHAMAN_REWARD_POOL,
};

export const FORM_COLORS: Record<string, number> = {
  feral: 0xc9a227,
  bear: 0x8b5a2b,
  cat: 0xc9a227,
  boomkin: 0x5b7cfa,
  tree: 0x3d9b6a,
  holy: 0xf0c75e,
  shadow: 0x7c3aed,
  discipline: 0xe8e0d0,
  resto: 0x38bdf8,
  enhance: 0xf97316,
  elemental: 0x818cf8,
};

export const FORM_LABELS: Record<string, string> = {
  feral: 'Feral',
  bear: 'Bear',
  cat: 'Cat',
  boomkin: 'Boomkin',
  tree: 'Tree',
  holy: 'Holy',
  shadow: 'Shadow',
  discipline: 'Discipline',
  resto: 'Resto',
  enhance: 'Enhance',
  elemental: 'Elemental',
};

export const SPEC_BLURBS: Record<OpeningSpec, string> = {
  feral: 'Claws & hide — Swipe Weak, Maul discard, shred cycles, Rip',
  boomkin: 'Spells & Thorns — random Wrath, double SP, reflect',
  tree: 'Grove engine — heal echoes, discard heals, discard plays',
  holy: 'Heals with teeth — typed draws, discard hymns, echoes',
  shadow: 'Void gambits — weaken, recoil Death, Nightmare power',
  discipline: 'Shields that answer — block echoes, discard armor, Penance',
  resto: 'Tides & totems — HoTs, stream regen, grounding walls',
  enhance: 'Storm strikes — Strength totems, Windfury, dual shocks',
  elemental: 'Lightning & lava — shocks, Chain Lightning, Wrath totem',
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
