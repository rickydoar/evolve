import type { CardDef } from './types';

/** Priest cards — Holy / Shadow / Discipline schools (mirrors Druid forms). */
export const PRIEST_CARDS: Record<string, CardDef> = {
  // ── Discipline ──────────────────────────────────────────────────
  smite: {
    id: 'smite',
    name: 'Smite',
    form: 'discipline',
    cost: 1,
    description: 'Deal 18 damage. Draw 1 random Attack card.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 18 },
      { kind: 'drawTyped', value: 1, cardType: 'attack' },
    ],
    art: 'card-smite',
    rarity: 'common',
  },
  penance: {
    id: 'penance',
    name: 'Penance',
    form: 'discipline',
    cost: 2,
    description: 'Deal damage and Heal equal to half your current Block.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 0 },
      { kind: 'heal', value: 0 },
    ],
    art: 'card-penance',
    rarity: 'rare',
  },
  power_word_shield: {
    id: 'power_word_shield',
    name: 'Power Word: Shield',
    form: 'discipline',
    cost: 1,
    description: 'This turn, whenever you gain Block, also Heal 3. Gain 14 Block.',
    target: 'self',
    effects: [
      { kind: 'echo', value: 3, echoFrom: 'block', echoTo: 'heal', duration: 1 },
      { kind: 'block', value: 14 },
    ],
    art: 'card-power-word-shield',
    rarity: 'common',
  },
  power_word_radiance: {
    id: 'power_word_radiance',
    name: 'Power Word: Radiance',
    form: 'discipline',
    cost: 1,
    description: 'Gain 8 Block. Heal 6 health. Discard 1: Draw 1.',
    target: 'self',
    effects: [
      { kind: 'block', value: 8 },
      { kind: 'heal', value: 6 },
      { kind: 'discardDraw', value: 1, discardCount: 1, drawValue: 1 },
    ],
    art: 'card-power-word-radiance',
    rarity: 'common',
  },
  pain_suppression: {
    id: 'pain_suppression',
    name: 'Pain Suppression',
    form: 'discipline',
    cost: 1,
    description: 'Discard up to 2 cards. Gain 12 Block + 5 per discarded.',
    target: 'self',
    effects: [
      {
        kind: 'discardFor',
        value: 12,
        discardCount: 2,
        bonusPerDiscard: 5,
        payoffKind: 'block',
      },
    ],
    art: 'card-pain-suppression',
    rarity: 'epic',
  },
  power_infusion: {
    id: 'power_infusion',
    name: 'Power Infusion',
    form: 'discipline',
    cost: 1,
    description: 'Discard 1: Draw 2. Gain 1 Energy.',
    target: 'self',
    effects: [
      { kind: 'discardDraw', value: 1, discardCount: 1, drawValue: 2 },
      { kind: 'energy', value: 1 },
    ],
    art: 'card-power-infusion',
    rarity: 'epic',
  },
  atonement: {
    id: 'atonement',
    name: 'Atonement',
    form: 'discipline',
    cost: 1,
    description: 'This turn, whenever you deal damage, also Heal 3. Deal 18 damage.',
    target: 'enemy',
    effects: [
      { kind: 'echo', value: 3, echoFrom: 'attack', echoTo: 'heal', duration: 1 },
      { kind: 'damage', value: 18 },
    ],
    art: 'card-smite',
    rarity: 'rare',
  },
  archangel: {
    id: 'archangel',
    name: 'Archangel',
    form: 'discipline',
    cost: 2,
    description:
      'Spell power +3 for the rest of combat. Heal 10 health. While active this combat, healing also draws 1 card. Shuffle 1 Nightmare into your deck this combat.',
    target: 'self',
    effects: [
      { kind: 'spellPower', value: 3 },
      { kind: 'heal', value: 10 },
      { kind: 'healAlsoDraw', value: 1, duration: 99 },
      { kind: 'shuffleCurse', value: 1 },
    ],
    art: 'card-archangel',
    rarity: 'legendary',
  },

  // ── Shadow ──────────────────────────────────────────────────────
  mind_blast: {
    id: 'mind_blast',
    name: 'Mind Blast',
    form: 'shadow',
    cost: 1,
    description:
      'Deal 24 damage to a random enemy. Refund 1 Energy if any enemy has 2+ DoTs. Take 2 recoil.',
    target: 'self',
    effects: [
      { kind: 'randomDamage', value: 24 },
      { kind: 'recoil', value: 2 },
    ],
    art: 'card-mind-blast',
    rarity: 'common',
  },
  shadow_word_pain: {
    id: 'shadow_word_pain',
    name: 'Shadow Word: Pain',
    form: 'shadow',
    cost: 1,
    description:
      'Deal 8 damage. Deal 28 damage over 3 turns. Apply Weak for 1 turn (enemies deal 25% less).',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 8 },
      { kind: 'damageOverTime', value: 28, duration: 3 },
      { kind: 'weaken', value: 1, duration: 1 },
    ],
    art: 'card-shadow-word-pain',
    rarity: 'common',
  },
  mind_flay: {
    id: 'mind_flay',
    name: 'Mind Flay',
    form: 'shadow',
    cost: 1,
    description:
      'Deal 34 damage over 3 turns. Refund 1 Energy if the target is already DoTted. Discard 1: Draw 1.',
    target: 'enemy',
    effects: [
      { kind: 'refundIfBleed', value: 1 },
      { kind: 'damageOverTime', value: 34, duration: 3 },
      { kind: 'discardDraw', value: 1, discardCount: 1, drawValue: 1 },
    ],
    art: 'card-mind-flay',
    rarity: 'common',
  },
  vampiric_touch: {
    id: 'vampiric_touch',
    name: 'Vampiric Touch',
    form: 'shadow',
    cost: 2,
    description:
      'Deal 12 damage. Deal 24 damage over 3 turns. Heal 6 health. Copy 1 random card into your draw pile.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 12 },
      { kind: 'damageOverTime', value: 24, duration: 3 },
      { kind: 'heal', value: 6 },
      { kind: 'copyCard', value: 1 },
    ],
    art: 'card-vampiric-touch',
    rarity: 'rare',
  },
  shadow_word_death: {
    id: 'shadow_word_death',
    name: 'Shadow Word: Death',
    form: 'shadow',
    cost: 1,
    description: 'Deal 24 damage. Take 5 recoil.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 24 },
      { kind: 'recoil', value: 5 },
    ],
    art: 'card-shadow-word-death',
    rarity: 'rare',
  },
  psychic_scream: {
    id: 'psychic_scream',
    name: 'Psychic Scream',
    form: 'shadow',
    cost: 1,
    description: 'Deal 10 damage to ALL enemies. Apply Weak for 2 turns (enemies deal 25% less). Apply Vulnerable for 2 turns.',
    target: 'allEnemies',
    effects: [
      { kind: 'aoeDamage', value: 10 },
      { kind: 'weaken', value: 1, duration: 2 },
      { kind: 'vulnerable', value: 1, duration: 2 },
    ],
    art: 'card-psychic-scream',
    rarity: 'epic',
  },
  void_eruption: {
    id: 'void_eruption',
    name: 'Void Eruption',
    form: 'shadow',
    cost: 2,
    description:
      'Deal 18 damage to ALL enemies. Then deal +12 per DoT on each enemy. Deal 12 damage to a random enemy.',
    target: 'allEnemies',
    effects: [
      { kind: 'aoeDamage', value: 18 },
      { kind: 'randomDamage', value: 12 },
    ],
    art: 'card-void-eruption',
    rarity: 'epic',
  },
  shadowfiend: {
    id: 'shadowfiend',
    name: 'Shadowfiend',
    form: 'shadow',
    cost: 2,
    description:
      'Enter Voidform for 2 turns (enemy DoTs tick twice). Deal 18 damage. Draw 1. Gain 1 Energy. Shuffle 1 Nightmare into your deck this combat.',
    target: 'enemy',
    effects: [
      { kind: 'voidform', value: 1, duration: 2 },
      { kind: 'damage', value: 18 },
      { kind: 'draw', value: 1 },
      { kind: 'energy', value: 1 },
      { kind: 'shuffleCurse', value: 1 },
    ],
    art: 'card-shadowfiend',
    rarity: 'legendary',
  },
  dispersion: {
    id: 'dispersion',
    name: 'Dispersion',
    form: 'shadow',
    cost: 1,
    description: 'Gain 14 Block. Remove all debuffs from yourself. Draw 1 random Armor card.',
    target: 'self',
    effects: [
      { kind: 'block', value: 14 },
      { kind: 'cleanse', value: 0 },
      { kind: 'drawTyped', value: 1, cardType: 'block' },
    ],
    art: 'card-dispersion',
    rarity: 'rare',
  },

  // ── Holy ────────────────────────────────────────────────────────
  flash_heal: {
    id: 'flash_heal',
    name: 'Flash Heal',
    form: 'holy',
    cost: 1,
    description: 'Heal 12 health. Draw 1 random Heal card.',
    target: 'self',
    effects: [
      { kind: 'heal', value: 12 },
      { kind: 'drawTyped', value: 1, cardType: 'heal' },
    ],
    art: 'card-flash-heal',
    rarity: 'common',
  },
  renew: {
    id: 'renew',
    name: 'Renew',
    form: 'holy',
    cost: 1,
    description: 'This turn, whenever you Heal, also gain 2 Block. Heal 18 health over 5 turns.',
    target: 'self',
    effects: [
      { kind: 'echo', value: 2, echoFrom: 'heal', echoTo: 'block', duration: 1 },
      { kind: 'healOverTime', value: 18, duration: 5 },
    ],
    art: 'card-renew',
    rarity: 'common',
  },
  holy_fire: {
    id: 'holy_fire',
    name: 'Holy Fire',
    form: 'holy',
    cost: 1,
    description: 'Deal 14 damage. Deal 14 damage over 3 turns. Deal 8 damage to a random enemy.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 14 },
      { kind: 'damageOverTime', value: 14, duration: 3 },
      { kind: 'randomDamage', value: 8 },
    ],
    art: 'card-holy-fire',
    rarity: 'common',
  },
  holy_nova: {
    id: 'holy_nova',
    name: 'Holy Nova',
    form: 'holy',
    cost: 1,
    description: 'Deal 10 damage to ALL enemies. Heal 4 health. Apply Weak for 1 turn (enemies deal 25% less).',
    target: 'allEnemies',
    effects: [
      { kind: 'aoeDamage', value: 10 },
      { kind: 'heal', value: 4 },
      { kind: 'weaken', value: 1, duration: 1 },
    ],
    art: 'card-holy-nova',
    rarity: 'common',
  },
  prayer_of_healing: {
    id: 'prayer_of_healing',
    name: 'Prayer of Healing',
    form: 'holy',
    cost: 2,
    description: 'Discard 2 cards. Heal 18 health. Gain 5 Block.',
    target: 'self',
    effects: [
      { kind: 'discardRandom', value: 2 },
      { kind: 'heal', value: 18 },
      { kind: 'block', value: 5 },
    ],
    art: 'card-prayer-of-healing',
    rarity: 'rare',
  },
  holy_word_serenity: {
    id: 'holy_word_serenity',
    name: 'Holy Word: Serenity',
    form: 'holy',
    cost: 2,
    description: 'Heal 18 health. Play a random Heal card from your discard.',
    target: 'self',
    effects: [
      { kind: 'heal', value: 18 },
      { kind: 'retrieveDiscard', value: 1, retrieveMode: 'play', cardType: 'heal' },
    ],
    art: 'card-holy-word-serenity',
    rarity: 'epic',
  },
  guardian_spirit: {
    id: 'guardian_spirit',
    name: 'Guardian Spirit',
    form: 'holy',
    cost: 1,
    description: 'Gain 10 Block. Heal 8 health. Double your current buffs.',
    target: 'self',
    effects: [
      { kind: 'block', value: 10 },
      { kind: 'heal', value: 8 },
      { kind: 'doubleBuffs', value: 1 },
    ],
    art: 'card-guardian-spirit',
    rarity: 'epic',
  },
  divine_hymn: {
    id: 'divine_hymn',
    name: 'Divine Hymn',
    form: 'holy',
    cost: 2,
    description:
      'Heal 16 health. Gain 8 Block. While active this combat, healing also draws 1 card. Remove all debuffs. Shuffle 1 Nightmare into your deck this combat.',
    target: 'self',
    effects: [
      { kind: 'heal', value: 16 },
      { kind: 'block', value: 8 },
      { kind: 'healAlsoDraw', value: 1, duration: 99 },
      { kind: 'cleanse', value: 0 },
      { kind: 'shuffleCurse', value: 1 },
    ],
    art: 'card-divine-hymn',
    rarity: 'legendary',
  },
  purify: {
    id: 'purify',
    name: 'Purify',
    form: 'holy',
    cost: 0,
    description: 'Remove all debuffs from yourself. Gain 5 Block. Discard 1: Draw 2.',
    target: 'self',
    effects: [
      { kind: 'cleanse', value: 0 },
      { kind: 'block', value: 5 },
      { kind: 'discardDraw', value: 1, discardCount: 1, drawValue: 2 },
    ],
    art: 'card-purify',
    rarity: 'rare',
  },
};

export const PRIEST_STARTER_CORE: string[] = [
  'smite',
  'power_word_shield',
  'mind_blast',
  'flash_heal',
  'renew',
  'shadow_word_pain',
  'holy_fire',
  'purify',
];

export const PRIEST_SPEC_PACKAGE: Record<'holy' | 'shadow' | 'discipline', string[]> = {
  holy: ['flash_heal', 'renew', 'holy_nova', 'prayer_of_healing', 'holy_fire'],
  shadow: ['mind_blast', 'shadow_word_pain', 'mind_flay', 'vampiric_touch', 'shadow_word_death'],
  discipline: ['smite', 'penance', 'power_word_shield', 'power_word_radiance', 'atonement'],
};

export const PRIEST_SPEC_TRIM: Record<'holy' | 'shadow' | 'discipline', string[]> = {
  holy: ['mind_blast', 'shadow_word_pain', 'smite', 'power_word_shield'],
  shadow: ['flash_heal', 'renew', 'holy_fire', 'purify'],
  discipline: ['mind_blast', 'shadow_word_pain', 'holy_fire', 'renew'],
};

export function buildPriestStarter(spec: string): string[] {
  const school: 'holy' | 'shadow' | 'discipline' =
    spec === 'shadow' || spec === 'discipline' ? spec : 'holy';
  const trim = new Set(PRIEST_SPEC_TRIM[school]);
  const core = PRIEST_STARTER_CORE.filter((id) => !trim.has(id));
  return [...core, ...PRIEST_SPEC_PACKAGE[school]];
}

export const PRIEST_STARTER_BY_SPEC: Record<string, string[]> = {
  holy: buildPriestStarter('holy'),
  shadow: buildPriestStarter('shadow'),
  discipline: buildPriestStarter('discipline'),
};

/** Fallback / legacy flat starter (Holy-leaning). Prefer buildPriestStarter. */
export const PRIEST_STARTER_DECK: string[] = PRIEST_STARTER_BY_SPEC.holy!;

export const PRIEST_REWARD_POOL: string[] = Object.keys(PRIEST_CARDS);
