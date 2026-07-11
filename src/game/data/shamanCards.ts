import type { CardDef, TotemDef } from './types';

/**
 * Totem definitions — duration-based allies (default 3 turns).
 * They no longer block damage or have HP by default.
 * Only one totem per element (replacing same element).
 */
export const TOTEMS: Record<string, TotemDef> = {
  stoneskin_totem: {
    id: 'stoneskin_totem',
    name: 'Stoneskin Totem',
    element: 'earth',
    duration: 5,
    art: 'card-stoneskin-totem',
    aura: { kind: 'stoneskin', value: 5 },
    description: 'While alive: gain 5 Block at the start of your turn and Thorns 5.',
  },
  strength_of_earth_totem: {
    id: 'strength_of_earth_totem',
    name: 'Strength of Earth',
    element: 'earth',
    duration: 5,
    art: 'card-strength-of-earth-totem',
    aura: { kind: 'strength', value: 6 },
    description: 'While alive: +6 Strength.',
  },
  searing_totem: {
    id: 'searing_totem',
    name: 'Searing Totem',
    element: 'fire',
    duration: 5,
    art: 'card-searing-totem',
    aura: { kind: 'searing', value: 16 },
    description:
      'While alive: deal 16 damage to a random enemy and apply/refresh Flame Shock shred.',
  },
  totem_of_wrath: {
    id: 'totem_of_wrath',
    name: 'Totem of Wrath',
    element: 'fire',
    duration: 5,
    art: 'card-totem-of-wrath',
    aura: { kind: 'spellPower', value: 7 },
    description: 'While alive: +7 Spell Power.',
  },
  healing_stream_totem: {
    id: 'healing_stream_totem',
    name: 'Healing Stream',
    element: 'water',
    duration: 5,
    art: 'card-healing-stream-totem',
    aura: { kind: 'regen', value: 4 },
    description: 'While alive: Regen 4 each turn.',
  },
  mana_tide_totem: {
    id: 'mana_tide_totem',
    name: 'Mana Tide Totem',
    element: 'water',
    duration: 4,
    art: 'card-mana-tide-totem',
    aura: { kind: 'manaTide', value: 1 },
    description:
      'While alive: +1 Energy this turn, then +1 more each subsequent turn (unique ramp).',
  },
  windfury_totem: {
    id: 'windfury_totem',
    name: 'Windfury Totem',
    element: 'air',
    duration: 5,
    art: 'card-windfury-totem',
    aura: { kind: 'windfury', value: 85 },
    description: 'While alive: Enhance attacks have an 85% chance to trigger twice.',
  },
  grounding_totem: {
    id: 'grounding_totem',
    name: 'Grounding Totem',
    element: 'air',
    duration: 5,
    art: 'card-grounding-totem',
    aura: { kind: 'grounding', value: 1 },
    description: 'The next hit is redirected to the totem and destroys it.',
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
    description: 'Deal 38 damage. Costs zero if all cards in hand are elemental.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 38 },
      { kind: 'freeIfAllElemental', value: 1 },
    ],
    art: 'card-lightning-bolt',
    rarity: 'common',
  },
  earth_shock: {
    id: 'earth_shock',
    name: 'Earth Shock',
    form: 'elemental',
    cost: 1,
    description: 'Deal 24 damage. Apply Weak for 2 turns (enemies deal 25% less).',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 24 },
      { kind: 'weaken', value: 1, duration: 2 },
    ],
    art: 'card-earth-shock',
    rarity: 'common',
  },
  flame_shock: {
    id: 'flame_shock',
    name: 'Flame Shock',
    form: 'elemental',
    cost: 1,
    description: 'Deal 16 damage. Deal 90 damage over 3 turns.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 16 },
      { kind: 'damageOverTime', value: 90, duration: 3 },
    ],
    art: 'card-flame-shock',
    rarity: 'common',
  },
  lava_burst: {
    id: 'lava_burst',
    name: 'Lava Burst',
    form: 'elemental',
    cost: 2,
    description:
      'Deal 40 damage. Consume a Flame Shock to instantly deal the remaining burn damage. Refund 1 Energy if Flame Shock was present.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 40 },
      { kind: 'refundIfFlameShock', value: 1 },
      { kind: 'consumeFlameShock', value: 1 },
    ],
    art: 'card-lava-burst',
    rarity: 'rare',
  },
  chain_lightning: {
    id: 'chain_lightning',
    name: 'Chain Lightning',
    form: 'elemental',
    cost: 1,
    description: 'Deal 22 damage to ALL enemies. Deal 18 damage to a random enemy.',
    target: 'allEnemies',
    effects: [
      { kind: 'aoeDamage', value: 22 },
      { kind: 'randomDamage', value: 18 },
    ],
    art: 'card-chain-lightning',
    rarity: 'rare',
  },
  thunderstorm: {
    id: 'thunderstorm',
    name: 'Thunderstorm',
    form: 'elemental',
    cost: 1,
    description: 'Deal 18 damage to ALL enemies. Apply Weak for 1 turn (enemies deal 25% less). Gain 9 Block.',
    target: 'allEnemies',
    effects: [
      { kind: 'aoeDamage', value: 18 },
      { kind: 'weaken', value: 1, duration: 1 },
      { kind: 'block', value: 9 },
    ],
    art: 'card-thunderstorm',
    rarity: 'epic',
  },
  searing_totem: {
    id: 'searing_totem',
    name: 'Searing Totem',
    form: 'elemental',
    cost: 1,
    description:
      'Summon Searing Totem for 5 turns. While alive: deal 16 damage to a random enemy and apply/refresh Flame Shock shred. Replaces your Fire totem.',
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
    description:
      'Summon Totem of Wrath for 5 turns. While alive: +7 Spell Power. Replaces your Fire totem.',
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
      'Deal 28 damage. This turn, your next 3 elemental attacks each echo once to a random enemy. Shuffle 1 Nightmare into your deck this combat.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 28 },
      { kind: 'elementalEchoTurn', value: 3 },
      { kind: 'shuffleCurse', value: 1 },
    ],
    art: 'card-elemental-blast',
    rarity: 'legendary',
  },
  master_of_the_elements: {
    id: 'master_of_the_elements',
    name: 'Master of the Elements',
    form: 'elemental',
    cost: 1,
    description: 'Spell power +4 for the rest of combat. Draw 1 card.',
    target: 'self',
    effects: [
      { kind: 'masterElements', value: 4 },
      { kind: 'draw', value: 1 },
    ],
    art: 'card-master-of-the-elements',
    rarity: 'rare',
  },
  echo_of_the_elements: {
    id: 'echo_of_the_elements',
    name: 'Echo of the Elements',
    form: 'elemental',
    cost: 1,
    description:
      'Repeat all elemental attacks played this turn to random enemies. Gain 1 Energy if you echoed at least 2.',
    target: 'self',
    effects: [{ kind: 'echoElements', value: 1 }],
    art: 'card-echo-of-the-elements',
    rarity: 'epic',
  },

  // ── Enhance ─────────────────────────────────────────────────────
  stormstrike: {
    id: 'stormstrike',
    name: 'Stormstrike',
    form: 'enhance',
    cost: 1,
    description: 'Deal 38 damage. The next elemental attack deals 75% more damage on the target.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 38 },
      { kind: 'stormstrikeMark', value: 75 },
    ],
    art: 'card-stormstrike',
    rarity: 'common',
  },
  lava_lash: {
    id: 'lava_lash',
    name: 'Lava Lash',
    form: 'enhance',
    cost: 1,
    description: 'Deal 32 damage. Refund 2 energy if targeting an enemy with Flame Shock.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 32 },
      { kind: 'refundIfFlameShock', value: 2 },
    ],
    art: 'card-lava-lash',
    rarity: 'common',
  },
  frost_shock: {
    id: 'frost_shock',
    name: 'Frost Shock',
    form: 'enhance',
    cost: 1,
    description: 'Deal 28 damage. Apply Weak for 1 turn (enemies deal 25% less). Apply Vulnerable for 1 turn.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 28 },
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
    description: 'Gain 5 Strength this combat. Deal 24 damage to a random enemy.',
    target: 'self',
    effects: [
      { kind: 'strength', value: 5, duration: 99 },
      { kind: 'randomDamage', value: 24 },
    ],
    art: 'card-windfury',
    rarity: 'rare',
  },
  crash_lightning: {
    id: 'crash_lightning',
    name: 'Crash Lightning',
    form: 'enhance',
    cost: 1,
    description: 'Deal 24 damage to ALL enemies. Gain 3 Strength this combat.',
    target: 'allEnemies',
    effects: [
      { kind: 'aoeDamage', value: 24 },
      { kind: 'strength', value: 3, duration: 99 },
    ],
    art: 'card-crash-lightning',
    rarity: 'rare',
  },
  feral_spirit: {
    id: 'feral_spirit',
    name: 'Feral Spirit',
    form: 'enhance',
    cost: 2,
    description: 'Deal 42 damage. Draw 2 cards. Gain 2 Energy.',
    target: 'enemy',
    effects: [
      { kind: 'damage', value: 42 },
      { kind: 'draw', value: 2 },
      { kind: 'energy', value: 2 },
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
      'Summon Strength of Earth for 5 turns. While alive: +6 Strength. Replaces your Earth totem.',
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
    description:
      'Summon Windfury Totem for 5 turns. While alive: Enhance attacks have an 85% chance to trigger twice. Replaces your Air totem.',
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
      'For 2 turns, Windfury always triggers. Attacks cost 1 less this turn. Deal 24 damage to ALL enemies. Draw 1. Shuffle 1 Nightmare into your deck this combat.',
    target: 'allEnemies',
    effects: [
      { kind: 'perfectWindfury', value: 100, duration: 2 },
      { kind: 'aoeDamage', value: 24 },
      { kind: 'draw', value: 1 },
      { kind: 'shuffleCurse', value: 1 },
    ],
    art: 'card-ascendance',
    rarity: 'legendary',
  },
  bloodlust: {
    id: 'bloodlust',
    name: 'Bloodlust',
    form: 'enhance',
    cost: 3,
    description: 'Draw 3 cards. All attacks cost 1 less. Exhaust all cards played this turn.',
    target: 'self',
    effects: [{ kind: 'bloodlust', value: 3 }],
    art: 'card-bloodlust',
    rarity: 'epic',
  },

  // ── Resto ───────────────────────────────────────────────────────
  healing_wave: {
    id: 'healing_wave',
    name: 'Healing Wave',
    form: 'resto',
    cost: 1,
    description: 'Heal 16 health. Draw 1 random Heal card.',
    target: 'self',
    effects: [
      { kind: 'heal', value: 16 },
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
    description: 'This turn, whenever you Heal, also gain 2 Block. Heal 18 health over 4 turns.',
    target: 'self',
    effects: [
      { kind: 'echo', value: 2, echoFrom: 'heal', echoTo: 'block', duration: 1 },
      { kind: 'healOverTime', value: 18, duration: 4 },
    ],
    art: 'card-riptide',
    rarity: 'common',
  },
  healing_surge: {
    id: 'healing_surge',
    name: 'Healing Surge',
    form: 'resto',
    cost: 1,
    description: 'Heal 10 health. Gain 8 Block. Discard 1: Draw 2.',
    target: 'self',
    effects: [
      { kind: 'heal', value: 10 },
      { kind: 'block', value: 8 },
      { kind: 'discardDraw', value: 1, discardCount: 1, drawValue: 2 },
    ],
    art: 'card-healing-surge',
    rarity: 'common',
  },
  chain_heal: {
    id: 'chain_heal',
    name: 'Chain Heal',
    form: 'resto',
    cost: 2,
    description: 'Heal 16 health. Gain 8 Block. Play a random Heal card from your discard.',
    target: 'self',
    effects: [
      { kind: 'heal', value: 16 },
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
    description: 'Remove all totems — Gain 12 life per totem removed.',
    target: 'self',
    effects: [{ kind: 'removeTotemsHeal', value: 12 }],
    art: 'card-spirit-link',
    rarity: 'rare',
  },
  purge: {
    id: 'purge',
    name: 'Purge',
    form: 'resto',
    cost: 0,
    description: 'Remove all buffs from an enemy. Gain 8 Block.',
    target: 'enemy',
    effects: [
      { kind: 'stripEnemyBuffs', value: 1 },
      { kind: 'block', value: 8 },
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
      'Summon Healing Stream for 5 turns. While alive: Regen 4 each turn. Replaces your Water totem.',
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
      'Summon Stoneskin Totem for 5 turns. While alive: gain 5 Block at the start of your turn and Thorns 5. Replaces your Earth totem.',
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
      'Summon Grounding Totem for 5 turns. The next hit is redirected to the totem and destroys it. Replaces your Air totem.',
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
      'Summon Mana Tide Totem for 4 turns. While alive: +1 Energy this turn, then +1 more each subsequent turn (unique ramp). Replaces your Water totem.',
    target: 'self',
    effects: [{ kind: 'summonTotem', value: 1, totemId: 'mana_tide_totem' }],
    art: 'card-mana-tide-totem',
    rarity: 'legendary',
  },
  hex: {
    id: 'hex',
    name: 'Hex',
    form: 'resto',
    cost: 2,
    description: 'Target cannot attack for 2 turns.',
    target: 'enemy',
    effects: [{ kind: 'hex', value: 1, duration: 2 }],
    art: 'card-hex',
    rarity: 'epic',
  },
  water_shield: {
    id: 'water_shield',
    name: 'Water Shield',
    form: 'resto',
    cost: 1,
    description: 'Lasts 3 turns. Gain 2 energy next turn every time you are attacked.',
    target: 'self',
    effects: [{ kind: 'waterShield', value: 2, duration: 3 }],
    art: 'card-water-shield',
    rarity: 'rare',
  },
  spirit_walkers_grace: {
    id: 'spirit_walkers_grace',
    name: "Spirit Walker's Grace",
    form: 'resto',
    cost: 3,
    description: 'Lasts 3 turns. All healing does 60% damage to a random enemy.',
    target: 'self',
    effects: [{ kind: 'spiritWalkersGrace', value: 60, duration: 3 }],
    art: 'card-spirit-walkers-grace',
    rarity: 'epic',
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
