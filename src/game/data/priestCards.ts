import type { CardDef } from './types';

/** Priest cards — Holy / Shadow / Discipline schools (mirrors Druid forms). */
export const PRIEST_CARDS: Record<string, CardDef> = {
  // ── Discipline ──────────────────────────────────────────────────
  smite: {
    id: 'smite',
    name: 'Smite',
    form: 'discipline',
    cost: 1,
    description: 'Deal 9 damage. Draw a random Attack card.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 9 },
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
    description: 'Gain 12 Block. Whenever you gain Block this combat, also Heal 3.',
    target: 'self',
    effects: [
      { kind: 'echo', value: 3, echoFrom: 'block', echoTo: 'heal', duration: 99 },
      { kind: 'block', value: 12 },
    ],
    art: 'card-power-word-shield',
    rarity: 'common',
  },
  power_word_radiance: {
    id: 'power_word_radiance',
    name: 'Power Word: Radiance',
    form: 'discipline',
    cost: 1,
    description: 'Gain 8 Block. Heal 6. Discard 1 card: Draw 1.',
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
    description: 'Discard up to 2 cards. Gain 12 Block + 5 Block per card discarded.',
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
    description: 'Discard 1 card: Draw 2. Gain 1 Energy.',
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
    description: 'Deal 8 damage. Whenever you deal damage this combat, also Heal 2.',
    target: 'enemy',
    effects: [
      { kind: 'echo', value: 2, echoFrom: 'attack', echoTo: 'heal', duration: 99 },
      { kind: 'damage', value: 8 },
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
      'Gain 5 Spell Power. Heal 10. Double your buffs. Shuffle a Nightmare into your deck.',
    target: 'self',
    effects: [
      { kind: 'spellPower', value: 5 },
      { kind: 'heal', value: 10 },
      { kind: 'doubleBuffs', value: 1 },
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
    description: 'Deal 13 damage to a random enemy. Take 2 recoil.',
    target: 'self',
    effects: [
      { kind: 'randomDamage', value: 13 },
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
    description: 'Deal 4 damage + 12 over 3 turns. Apply Weak for 1 turn.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 4 },
      { kind: 'damageOverTime', value: 12, duration: 3 },
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
    description: 'Deal 15 damage over 3 turns. Discard 1 card: Draw 1.',
    target: 'enemy',
    effects: [
      { kind: 'damageOverTime', value: 15, duration: 3 },
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
      'Deal 6 damage + 10 over 3 turns. Heal 6. Copy a random card into your draw pile.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 6 },
      { kind: 'damageOverTime', value: 10, duration: 3 },
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
    description: 'Deal 12 damage (+12 if below half HP). Take 5 recoil.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 12 },
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
    description: 'Deal 5 damage to ALL enemies. Apply Weak and Vulnerable for 2 turns.',
    target: 'allEnemies',
    effects: [
      { kind: 'aoeDamage', value: 5 },
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
    description: 'Deal 10 damage to ALL enemies. Deal 8 to a random enemy.',
    target: 'allEnemies',
    effects: [
      { kind: 'aoeDamage', value: 10 },
      { kind: 'randomDamage', value: 8 },
    ],
    art: 'card-void-eruption',
    rarity: 'epic',
  },
  shadowfiend: {
    id: 'shadowfiend',
    name: 'Shadowfiend',
    form: 'shadow',
    cost: 2,
    description: 'Deal 14 damage. Draw 1. Gain 1 Energy. Shuffle a Nightmare into your deck.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 14 },
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
    description: 'Gain 14 Block. Remove all debuffs. Draw a random Armor card.',
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
    description: 'Heal 14. Draw a random Heal card.',
    target: 'self',
    effects: [
      { kind: 'heal', value: 14 },
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
    description: 'Heal 24 over 5 turns. Whenever you Heal this combat, gain 2 Block.',
    target: 'self',
    effects: [
      { kind: 'echo', value: 2, echoFrom: 'heal', echoTo: 'block', duration: 99 },
      { kind: 'healOverTime', value: 24, duration: 5 },
    ],
    art: 'card-renew',
    rarity: 'common',
  },
  holy_fire: {
    id: 'holy_fire',
    name: 'Holy Fire',
    form: 'holy',
    cost: 1,
    description: 'Deal 8 damage + 8 burn over 3 turns. Deal 5 to a random enemy.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 8 },
      { kind: 'damageOverTime', value: 8, duration: 3 },
      { kind: 'randomDamage', value: 5 },
    ],
    art: 'card-holy-fire',
    rarity: 'common',
  },
  holy_nova: {
    id: 'holy_nova',
    name: 'Holy Nova',
    form: 'holy',
    cost: 1,
    description: 'Deal 6 damage to ALL enemies. Heal 5. Apply Weak for 1 turn.',
    target: 'allEnemies',
    effects: [
      { kind: 'aoeDamage', value: 6 },
      { kind: 'heal', value: 5 },
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
    description: 'Discard 2 cards. Heal 22. Gain 6 Block.',
    target: 'self',
    effects: [
      { kind: 'discardRandom', value: 2 },
      { kind: 'heal', value: 22 },
      { kind: 'block', value: 6 },
    ],
    art: 'card-prayer-of-healing',
    rarity: 'rare',
  },
  holy_word_serenity: {
    id: 'holy_word_serenity',
    name: 'Holy Word: Serenity',
    form: 'holy',
    cost: 2,
    description: 'Heal 22. Play a random Heal card from your discard immediately.',
    target: 'self',
    effects: [
      { kind: 'heal', value: 22 },
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
    description: 'Gain 12 Block. Heal 10. Double your current Block and buffs.',
    target: 'self',
    effects: [
      { kind: 'block', value: 12 },
      { kind: 'heal', value: 10 },
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
    description: 'Heal 22. Gain 10 Block. Remove all debuffs. Shuffle a Nightmare into your deck.',
    target: 'self',
    effects: [
      { kind: 'heal', value: 22 },
      { kind: 'block', value: 10 },
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
    description: 'Remove all debuffs. Gain 5 Block. Discard 1 card: Draw 2.',
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
