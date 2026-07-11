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
    description: 'Unplayable. When drawn, take 5 damage. Removed after combat.',
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
    description: 'This turn, whenever you gain Block, also Heal 3. Gain 10 Block.',
    target: 'self',
    effects: [
      { kind: 'echo', value: 3, echoFrom: 'block', echoTo: 'heal', duration: 1 },
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
    description: 'Deal 14 damage to up to 4 enemies. Apply Weak for 1 turn (enemies deal 25% less).',
    target: 'allEnemies',
    effects: [
      { kind: 'aoeDamage', value: 14, maxTargets: 4 },
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
    description: 'Deal 22 damage. Gain 8 Block. Discard 1: Draw 1.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 22 },
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
    description: 'Deal 8 damage to ALL enemies. Deal 12 damage over 3 turns. Deal 10 damage to a random enemy.',
    target: 'allEnemies',
    effects: [
      { kind: 'aoeDamage', value: 8 },
      { kind: 'damageOverTime', value: 12, duration: 3 },
      { kind: 'randomDamage', value: 10 },
    ],
    art: 'card-thrash',
    rarity: 'common',
  },
  mangle: {
    id: 'mangle',
    name: 'Mangle',
    form: 'bear',
    cost: 1,
    description: 'Deal 18 damage. Apply Vulnerable for 2 turns. Apply Weak for 2 turns (enemies deal 25% less).',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 18 },
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
    description: 'Discard up to 2 cards. Gain 10 Block + 6 per discarded.',
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
    description: 'Gain 22 Block. Heal 14 health. Shuffle 1 Nightmare into your deck this combat.',
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
    description: 'Deal 22 damage. Draw 1 random Attack card.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 22 },
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
    description:
      'Deal 48 damage over 3 turns. Refund 1 Energy if the target is already bleeding. Copy 1 random card into your draw pile.',
    target: 'enemy',
    effects: [
      { kind: 'refundIfBleed', value: 1 },
      { kind: 'damageOverTime', value: 48, duration: 3 },
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
    description: 'Deal 14 damage. Refund 1 Energy if the target is bleeding. Discard 1: Draw 2.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 14 },
      { kind: 'refundIfBleed', value: 1 },
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
    description:
      'Deal 12 damage. Deal 36 damage over 3 turns. Refund 1 Energy if the target is already bleeding.',
    target: 'enemy',
    effects: [
      { kind: 'refundIfBleed', value: 1 },
      { kind: 'damage', value: 12 },
      { kind: 'damageOverTime', value: 36, duration: 3 },
    ],
    art: 'card-rake',
    rarity: 'common',
  },
  ferocious_bite: {
    id: 'ferocious_bite',
    name: 'Ferocious Bite',
    form: 'cat',
    cost: 2,
    description:
      'Deal 34 damage. Consume all bleeds on the target, dealing remaining DoT damage instantly. Take 2 recoil.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 34 },
      { kind: 'consumeBleeds', value: 1 },
      { kind: 'recoil', value: 2 },
    ],
    art: 'card-ferocious-bite',
    rarity: 'rare',
  },
  tigers_fury: {
    id: 'tigers_fury',
    name: "Tiger's Fury",
    form: 'cat',
    cost: 0,
    description: 'Gain 4 Strength this combat. Double your current buffs.',
    target: 'self',
    effects: [
      { kind: 'strength', value: 4 },
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
    description: 'Deal 32 damage. Draw 1 card. Gain 1 Energy. Shuffle 1 Nightmare into your deck this combat.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 32 },
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
    description: 'Deal 28 damage to a random enemy. Gain 1 Astral Power.',
    target: 'self',
    effects: [
      { kind: 'randomDamage', value: 28 },
      { kind: 'gainAstral', value: 1 },
    ],
    art: 'card-starfire',
    rarity: 'common',
  },
  starfire: {
    id: 'starfire',
    name: 'Starfire',
    form: 'boomkin',
    cost: 2,
    description: 'Deal 38 damage. Put a random discard card on top of your draw pile. Gain 1 Astral Power.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 38 },
      { kind: 'retrieveDiscard', value: 1, retrieveMode: 'top' },
      { kind: 'gainAstral', value: 1 },
    ],
    art: 'card-starfire',
    rarity: 'rare',
  },
  hurricane: {
    id: 'hurricane',
    name: 'Hurricane',
    form: 'boomkin',
    cost: 2,
    description: 'Deal 20 damage to ALL enemies. Apply Weak for 2 turns (enemies deal 25% less).',
    target: 'allEnemies',
    effects: [
      { kind: 'aoeDamage', value: 20 },
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
      'Deal 30 damage. Spend all Astral Power: +18 damage per stack and refund 1 Energy if spending 2+. Apply Earth and Moon: next Wrath or Starfire deals +50% damage.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 30 },
      { kind: 'spendAstral', value: 18 },
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
    description:
      'This turn, whenever you deal damage, also gain 2 Block. Deal 12 damage. Deal 26 damage over 3 turns. Gain 1 Astral Power.',
    target: 'enemy',
    effects: [
      { kind: 'echo', value: 2, echoFrom: 'attack', echoTo: 'block', duration: 1 },
      { kind: 'damage', value: 12 },
      { kind: 'damageOverTime', value: 26, duration: 3 },
      { kind: 'gainAstral', value: 1 },
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
      'Deal 12 damage to ALL enemies. Deal 18 damage over 3 turns. Deal 14 damage to a random enemy. Gain 1 Astral Power.',
    target: 'allEnemies',
    effects: [
      { kind: 'aoeDamage', value: 12 },
      { kind: 'damageOverTime', value: 18, duration: 3 },
      { kind: 'randomDamage', value: 14 },
      { kind: 'gainAstral', value: 1 },
    ],
    art: 'card-sunfire',
    rarity: 'common',
  },
  starfall: {
    id: 'starfall',
    name: 'Starfall',
    form: 'boomkin',
    cost: 2,
    description: 'Deal 16 damage to ALL enemies. Add a random card from your discard to your hand.',
    target: 'allEnemies',
    effects: [
      { kind: 'aoeDamage', value: 16 },
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
    description: 'Spell power +3 for the rest of combat. Gain 3 Astral Power. Double your current buffs.',
    target: 'self',
    effects: [
      { kind: 'spellPower', value: 3 },
      { kind: 'gainAstral', value: 3 },
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
    description: 'Gain Thorns 15 for 3 turns.',
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
      'Enter Eclipse: enemy DoTs tick twice this turn. Gain 4 Astral Power. Deal 24 damage. Draw 2 cards. Shuffle 1 Nightmare into your deck this combat.',
    target: 'enemy',
    effects: [
      { kind: 'doubleDotTicks', value: 1, duration: 1 },
      { kind: 'gainAstral', value: 4 },
      { kind: 'damage', value: 24 },
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
    description: 'Gain 1 Energy. Discard 1: Draw 1.',
    target: 'self',
    effects: [
      { kind: 'energy', value: 1 },
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
    description: 'Remove all debuffs from yourself. Gain 6 Block. Draw 1 random Heal card.',
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
    description: 'This turn, whenever you Heal, also gain 2 Block. Heal 14 health over 5 turns.',
    target: 'self',
    effects: [
      { kind: 'echo', value: 2, echoFrom: 'heal', echoTo: 'block', duration: 1 },
      { kind: 'healOverTime', value: 14, duration: 5 },
    ],
    art: 'card-rejuvenation',
    rarity: 'common',
  },
  healing_touch: {
    id: 'healing_touch',
    name: 'Healing Touch',
    form: 'tree',
    cost: 2,
    description: 'Discard 2 cards. Heal 16 health.',
    target: 'self',
    effects: [
      { kind: 'discardRandom', value: 2 },
      { kind: 'heal', value: 16 },
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
      'This turn, whenever you gain Block, also deal 2 damage to a random enemy. Gain 5 Block. Heal 3 health.',
    target: 'self',
    effects: [
      { kind: 'echo', value: 2, echoFrom: 'block', echoTo: 'attack', duration: 1 },
      { kind: 'block', value: 5 },
      { kind: 'heal', value: 3 },
    ],
    art: 'card-rejuvenation',
    rarity: 'common',
  },
  swiftmend: {
    id: 'swiftmend',
    name: 'Swiftmend',
    form: 'tree',
    cost: 1,
    description: 'Heal 9 health. Play a random Heal card from your discard.',
    target: 'self',
    effects: [
      { kind: 'heal', value: 9 },
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
    description: 'Heal 5 health. Heal 10 health over 4 turns. Copy 1 random card into your draw pile.',
    target: 'self',
    effects: [
      { kind: 'heal', value: 5 },
      { kind: 'healOverTime', value: 10, duration: 4 },
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
    description: 'Gain 7 Block. Heal 4 health. Double your current buffs.',
    target: 'self',
    effects: [
      { kind: 'block', value: 7 },
      { kind: 'heal', value: 4 },
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
    description:
      'Heal 14 health. Gain 6 Block. While active this combat, healing also draws 1 card. Remove all debuffs. Shuffle 1 Nightmare into your deck this combat.',
    target: 'self',
    effects: [
      { kind: 'heal', value: 14 },
      { kind: 'block', value: 6 },
      { kind: 'healAlsoDraw', value: 1, duration: 99 },
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
