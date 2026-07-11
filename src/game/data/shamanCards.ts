import type { CardDef, TotemDef } from './types';

/**
 * Totem definitions — fragile allies that absorb damage before the Shaman
 * and grant strong auras while alive. Only one totem per element.
 */
export const TOTEMS: Record<string, TotemDef> = {
  stoneskin_totem: {
    id: 'stoneskin_totem',
    name: 'Stoneskin Totem',
    element: 'earth',
    maxHp: 14,
    art: 'card-stoneskin-totem',
    aura: { kind: 'blockPerTurn', value: 6 },
    description: 'While alive: gain 6 Block at the start of your turn.',
  },
  strength_of_earth_totem: {
    id: 'strength_of_earth_totem',
    name: 'Strength of Earth',
    element: 'earth',
    maxHp: 12,
    art: 'card-strength-of-earth-totem',
    aura: { kind: 'strength', value: 4 },
    description: 'While alive: +4 Strength.',
  },
  searing_totem: {
    id: 'searing_totem',
    name: 'Searing Totem',
    element: 'fire',
    maxHp: 10,
    art: 'card-searing-totem',
    aura: { kind: 'thorns', value: 5 },
    description: 'While alive: Thorns 5.',
  },
  totem_of_wrath: {
    id: 'totem_of_wrath',
    name: 'Totem of Wrath',
    element: 'fire',
    maxHp: 10,
    art: 'card-totem-of-wrath',
    aura: { kind: 'spellPower', value: 4 },
    description: 'While alive: +4 Spell Power.',
  },
  healing_stream_totem: {
    id: 'healing_stream_totem',
    name: 'Healing Stream',
    element: 'water',
    maxHp: 12,
    art: 'card-healing-stream-totem',
    aura: { kind: 'regen', value: 5 },
    description: 'While alive: Regen 5 each turn.',
  },
  mana_tide_totem: {
    id: 'mana_tide_totem',
    name: 'Mana Tide Totem',
    element: 'water',
    maxHp: 10,
    art: 'card-mana-tide-totem',
    aura: { kind: 'energyOnTurn', value: 1 },
    description: 'While alive: +1 Energy at the start of your turn.',
  },
  windfury_totem: {
    id: 'windfury_totem',
    name: 'Windfury Totem',
    element: 'air',
    maxHp: 10,
    art: 'card-windfury-totem',
    aura: { kind: 'strength', value: 3 },
    description: 'While alive: +3 Strength.',
  },
  grounding_totem: {
    id: 'grounding_totem',
    name: 'Grounding Totem',
    element: 'air',
    maxHp: 16,
    art: 'card-grounding-totem',
    aura: { kind: 'blockPerTurn', value: 4 },
    description: 'Sturdy air totem. While alive: gain 4 Block each turn.',
  },
};

/** Shaman cards — Resto / Enhance / Elemental schools. */
export const SHAMAN_CARDS: Record<string, CardDef> = {
  // ── Elemental ───────────────────────────────────────────────────
  lightning_bolt: {
    id: 'lightning_bolt',
    name: 'Lightning Bolt',
    form: 'elemental',
    cost: 1,
    description: 'Deal 11 damage. Draw a random Attack card.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 11 },
      { kind: 'drawTyped', value: 1, cardType: 'attack' },
    ],
    art: 'card-lightning-bolt',
    rarity: 'common',
  },
  earth_shock: {
    id: 'earth_shock',
    name: 'Earth Shock',
    form: 'elemental',
    cost: 1,
    description: 'Deal 8 damage. Apply Weak for 1 turn. Gain 4 Block.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 8 },
      { kind: 'weaken', value: 1, duration: 1 },
      { kind: 'block', value: 4 },
    ],
    art: 'card-earth-shock',
    rarity: 'common',
  },
  flame_shock: {
    id: 'flame_shock',
    name: 'Flame Shock',
    form: 'elemental',
    cost: 1,
    description: 'Deal 5 damage + 12 burn over 3 turns. Deal 4 to a random enemy.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 5 },
      { kind: 'damageOverTime', value: 12, duration: 3 },
      { kind: 'randomDamage', value: 4 },
    ],
    art: 'card-flame-shock',
    rarity: 'common',
  },
  lava_burst: {
    id: 'lava_burst',
    name: 'Lava Burst',
    form: 'elemental',
    cost: 2,
    description: 'Deal 18 damage. Gain 2 Spell Power.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 18 },
      { kind: 'spellPower', value: 2 },
    ],
    art: 'card-lava-burst',
    rarity: 'rare',
  },
  chain_lightning: {
    id: 'chain_lightning',
    name: 'Chain Lightning',
    form: 'elemental',
    cost: 1,
    description: 'Deal 7 damage to ALL enemies. Deal 6 to a random enemy.',
    target: 'allEnemies',
    effects: [
      { kind: 'aoeDamage', value: 7 },
      { kind: 'randomDamage', value: 6 },
    ],
    art: 'card-chain-lightning',
    rarity: 'rare',
  },
  thunderstorm: {
    id: 'thunderstorm',
    name: 'Thunderstorm',
    form: 'elemental',
    cost: 1,
    description: 'Deal 6 damage to ALL enemies. Apply Weak for 1 turn. Gain 6 Block.',
    target: 'allEnemies',
    effects: [
      { kind: 'aoeDamage', value: 6 },
      { kind: 'weaken', value: 1, duration: 1 },
      { kind: 'block', value: 6 },
    ],
    art: 'card-thunderstorm',
    rarity: 'epic',
  },
  searing_totem: {
    id: 'searing_totem',
    name: 'Searing Totem',
    form: 'elemental',
    cost: 1,
    description: 'Summon Searing Totem (10 HP). While alive: Thorns 5. Replaces your Fire totem.',
    target: 'self',
    effects: [{ kind: 'summonTotem', value: 1, totemId: 'searing_totem' }],
    art: 'card-searing-totem',
    rarity: 'common',
  },
  totem_of_wrath: {
    id: 'totem_of_wrath',
    name: 'Totem of Wrath',
    form: 'elemental',
    cost: 1,
    description: 'Summon Totem of Wrath (10 HP). While alive: +4 Spell Power. Replaces your Fire totem.',
    target: 'self',
    effects: [{ kind: 'summonTotem', value: 1, totemId: 'totem_of_wrath' }],
    art: 'card-totem-of-wrath',
    rarity: 'rare',
  },
  elemental_blast: {
    id: 'elemental_blast',
    name: 'Elemental Blast',
    form: 'elemental',
    cost: 2,
    description:
      'Deal 16 damage. Gain 4 Spell Power. Double your buffs. Shuffle a Nightmare into your deck this combat.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 16 },
      { kind: 'spellPower', value: 4 },
      { kind: 'doubleBuffs', value: 1 },
      { kind: 'shuffleCurse', value: 1 },
    ],
    art: 'card-elemental-blast',
    rarity: 'legendary',
  },

  // ── Enhance ─────────────────────────────────────────────────────
  stormstrike: {
    id: 'stormstrike',
    name: 'Stormstrike',
    form: 'enhance',
    cost: 1,
    description: 'Deal 12 damage. Draw a random Attack card.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 12 },
      { kind: 'drawTyped', value: 1, cardType: 'attack' },
    ],
    art: 'card-stormstrike',
    rarity: 'common',
  },
  lava_lash: {
    id: 'lava_lash',
    name: 'Lava Lash',
    form: 'enhance',
    cost: 1,
    description: 'Deal 10 damage. Discard 1 card: Draw 1.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 10 },
      { kind: 'discardDraw', value: 1, discardCount: 1, drawValue: 1 },
    ],
    art: 'card-lava-lash',
    rarity: 'common',
  },
  frost_shock: {
    id: 'frost_shock',
    name: 'Frost Shock',
    form: 'enhance',
    cost: 1,
    description: 'Deal 9 damage. Apply Weak and Vulnerable for 1 turn.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 9 },
      { kind: 'weaken', value: 1, duration: 1 },
      { kind: 'vulnerable', value: 1, duration: 1 },
    ],
    art: 'card-frost-shock',
    rarity: 'common',
  },
  windfury: {
    id: 'windfury',
    name: 'Windfury',
    form: 'enhance',
    cost: 1,
    description: 'Gain 3 Strength. Deal 8 damage to a random enemy.',
    target: 'self',
    effects: [
      { kind: 'strength', value: 3, duration: 99 },
      { kind: 'randomDamage', value: 8 },
    ],
    art: 'card-windfury',
    rarity: 'rare',
  },
  crash_lightning: {
    id: 'crash_lightning',
    name: 'Crash Lightning',
    form: 'enhance',
    cost: 1,
    description: 'Deal 8 damage to ALL enemies. Gain 2 Strength.',
    target: 'allEnemies',
    effects: [
      { kind: 'aoeDamage', value: 8 },
      { kind: 'strength', value: 2, duration: 99 },
    ],
    art: 'card-crash-lightning',
    rarity: 'rare',
  },
  feral_spirit: {
    id: 'feral_spirit',
    name: 'Feral Spirit',
    form: 'enhance',
    cost: 2,
    description: 'Deal 14 damage. Draw 1. Gain 1 Energy.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 14 },
      { kind: 'draw', value: 1 },
      { kind: 'energy', value: 1 },
    ],
    art: 'card-feral-spirit',
    rarity: 'epic',
  },
  strength_of_earth_totem: {
    id: 'strength_of_earth_totem',
    name: 'Strength of Earth',
    form: 'enhance',
    cost: 1,
    description:
      'Summon Strength of Earth Totem (12 HP). While alive: +4 Strength. Replaces your Earth totem.',
    target: 'self',
    effects: [{ kind: 'summonTotem', value: 1, totemId: 'strength_of_earth_totem' }],
    art: 'card-strength-of-earth-totem',
    rarity: 'common',
  },
  windfury_totem: {
    id: 'windfury_totem',
    name: 'Windfury Totem',
    form: 'enhance',
    cost: 1,
    description: 'Summon Windfury Totem (10 HP). While alive: +3 Strength. Replaces your Air totem.',
    target: 'self',
    effects: [{ kind: 'summonTotem', value: 1, totemId: 'windfury_totem' }],
    art: 'card-windfury-totem',
    rarity: 'rare',
  },
  ascendance: {
    id: 'ascendance',
    name: 'Ascendance',
    form: 'enhance',
    cost: 2,
    description:
      'Gain 4 Strength. Deal 12 damage to ALL enemies. Shuffle a Nightmare into your deck this combat.',
    target: 'allEnemies',
    effects: [
      { kind: 'strength', value: 4, duration: 99 },
      { kind: 'aoeDamage', value: 12 },
      { kind: 'shuffleCurse', value: 1 },
    ],
    art: 'card-ascendance',
    rarity: 'legendary',
  },

  // ── Resto ───────────────────────────────────────────────────────
  healing_wave: {
    id: 'healing_wave',
    name: 'Healing Wave',
    form: 'resto',
    cost: 1,
    description: 'Heal 14. Draw a random Heal card.',
    target: 'self',
    effects: [
      { kind: 'heal', value: 14 },
      { kind: 'drawTyped', value: 1, cardType: 'heal' },
    ],
    art: 'card-healing-wave',
    rarity: 'common',
  },
  riptide: {
    id: 'riptide',
    name: 'Riptide',
    form: 'resto',
    cost: 1,
    description: 'Heal 20 over 4 turns. Whenever you Heal this turn, gain 2 Block.',
    target: 'self',
    effects: [
      { kind: 'echo', value: 2, echoFrom: 'heal', echoTo: 'block', duration: 1 },
      { kind: 'healOverTime', value: 20, duration: 4 },
    ],
    art: 'card-riptide',
    rarity: 'common',
  },
  healing_surge: {
    id: 'healing_surge',
    name: 'Healing Surge',
    form: 'resto',
    cost: 1,
    description: 'Heal 10. Gain 8 Block. Discard 1 card: Draw 1.',
    target: 'self',
    effects: [
      { kind: 'heal', value: 10 },
      { kind: 'block', value: 8 },
      { kind: 'discardDraw', value: 1, discardCount: 1, drawValue: 1 },
    ],
    art: 'card-healing-surge',
    rarity: 'common',
  },
  chain_heal: {
    id: 'chain_heal',
    name: 'Chain Heal',
    form: 'resto',
    cost: 2,
    description: 'Heal 18. Gain 8 Block. Play a random Heal card from your discard.',
    target: 'self',
    effects: [
      { kind: 'heal', value: 18 },
      { kind: 'block', value: 8 },
      { kind: 'retrieveDiscard', value: 1, retrieveMode: 'play', cardType: 'heal' },
    ],
    art: 'card-chain-heal',
    rarity: 'rare',
  },
  spirit_link: {
    id: 'spirit_link',
    name: 'Spirit Link',
    form: 'resto',
    cost: 1,
    description: 'Gain 14 Block. Whenever you gain Block this turn, also Heal 3.',
    target: 'self',
    effects: [
      { kind: 'echo', value: 3, echoFrom: 'block', echoTo: 'heal', duration: 1 },
      { kind: 'block', value: 14 },
    ],
    art: 'card-spirit-link',
    rarity: 'rare',
  },
  purge: {
    id: 'purge',
    name: 'Purge',
    form: 'resto',
    cost: 0,
    description: 'Remove all debuffs. Gain 5 Block. Discard 1 card: Draw 2.',
    target: 'self',
    effects: [
      { kind: 'cleanse', value: 0 },
      { kind: 'block', value: 5 },
      { kind: 'discardDraw', value: 1, discardCount: 1, drawValue: 2 },
    ],
    art: 'card-purge',
    rarity: 'rare',
  },
  healing_stream_totem: {
    id: 'healing_stream_totem',
    name: 'Healing Stream',
    form: 'resto',
    cost: 1,
    description:
      'Summon Healing Stream Totem (12 HP). While alive: Regen 5 each turn. Replaces your Water totem.',
    target: 'self',
    effects: [{ kind: 'summonTotem', value: 1, totemId: 'healing_stream_totem' }],
    art: 'card-healing-stream-totem',
    rarity: 'common',
  },
  stoneskin_totem: {
    id: 'stoneskin_totem',
    name: 'Stoneskin Totem',
    form: 'resto',
    cost: 1,
    description:
      'Summon Stoneskin Totem (14 HP). While alive: gain 6 Block each turn. Replaces your Earth totem.',
    target: 'self',
    effects: [{ kind: 'summonTotem', value: 1, totemId: 'stoneskin_totem' }],
    art: 'card-stoneskin-totem',
    rarity: 'common',
  },
  grounding_totem: {
    id: 'grounding_totem',
    name: 'Grounding Totem',
    form: 'resto',
    cost: 1,
    description:
      'Summon Grounding Totem (16 HP). Absorbs hits before you. While alive: +4 Block/turn.',
    target: 'self',
    effects: [{ kind: 'summonTotem', value: 1, totemId: 'grounding_totem' }],
    art: 'card-grounding-totem',
    rarity: 'epic',
  },
  mana_tide_totem: {
    id: 'mana_tide_totem',
    name: 'Mana Tide Totem',
    form: 'resto',
    cost: 2,
    description:
      'Summon Mana Tide Totem (10 HP). While alive: +1 Energy each turn. Heal 12. Shuffle a Nightmare into your deck this combat.',
    target: 'self',
    effects: [
      { kind: 'summonTotem', value: 1, totemId: 'mana_tide_totem' },
      { kind: 'heal', value: 12 },
      { kind: 'shuffleCurse', value: 1 },
    ],
    art: 'card-mana-tide-totem',
    rarity: 'legendary',
  },
};

export const SHAMAN_STARTER_CORE: string[] = [
  'lightning_bolt',
  'earth_shock',
  'stormstrike',
  'healing_wave',
  'riptide',
  'flame_shock',
  'stoneskin_totem',
  'purge',
];

export const SHAMAN_SPEC_PACKAGE: Record<'resto' | 'enhance' | 'elemental', string[]> = {
  resto: ['lightning_bolt', 'lightning_bolt', 'chain_heal', 'healing_surge', 'healing_stream_totem'],
  enhance: ['stormstrike', 'lava_lash', 'windfury', 'frost_shock', 'strength_of_earth_totem'],
  elemental: ['lightning_bolt', 'flame_shock', 'lava_burst', 'chain_lightning', 'searing_totem'],
};

export const SHAMAN_SPEC_TRIM: Record<'resto' | 'enhance' | 'elemental', string[]> = {
  resto: ['stormstrike', 'flame_shock', 'earth_shock', 'purge'],
  enhance: ['healing_wave', 'riptide', 'flame_shock', 'purge'],
  elemental: ['stormstrike', 'healing_wave', 'riptide', 'purge'],
};

export function buildShamanStarter(spec: string): string[] {
  const school: 'resto' | 'enhance' | 'elemental' =
    spec === 'enhance' || spec === 'elemental' ? spec : 'resto';
  const trim = new Set(SHAMAN_SPEC_TRIM[school]);
  const core = SHAMAN_STARTER_CORE.filter((id) => !trim.has(id));
  return [...core, ...SHAMAN_SPEC_PACKAGE[school]];
}

export const SHAMAN_STARTER_BY_SPEC: Record<string, string[]> = {
  resto: buildShamanStarter('resto'),
  enhance: buildShamanStarter('enhance'),
  elemental: buildShamanStarter('elemental'),
};

export const SHAMAN_STARTER_DECK: string[] = SHAMAN_STARTER_BY_SPEC.resto!;

export const SHAMAN_REWARD_POOL: string[] = Object.keys(SHAMAN_CARDS);
