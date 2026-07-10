import type { Form, OpeningSpec, StatusEffect } from './types';

/** Passive relics offered after elite victories. */
export type ItemTrigger =
  | 'combatStart'
  | 'turnStart'
  | 'onPlayCard'
  | 'onDealDamage'
  | 'onGainBlock'
  | 'onHeal'
  | 'onEnemyDotTick'
  | 'onKill'
  | 'onRecoil'
  | 'onApplyDot'
  | 'onGainThorns'
  | 'onPickup';

export type ItemEffectKind =
  | 'draw'
  | 'block'
  | 'heal'
  | 'energy'
  | 'spellPower'
  | 'strength'
  | 'damageRandom'
  | 'damageLowest'
  | 'damageAll'
  | 'dotBonusPerTick'
  | 'dotExtraDuration'
  | 'healOnDotTick'
  | 'reduceRecoilPct'
  | 'energyOnRecoil'
  | 'applyVulnerable'
  | 'applyWeaken'
  | 'applyBleed'
  | 'blockCarryoverPct'
  | 'cleanseOne'
  | 'gold'
  | 'potion'
  | 'energyMax'
  | 'doubleRandomHalf'
  | 'thornsBonusBlock'
  | 'vulnerableBonusDuration'
  | 'flag'; // sets a combat flag consumed elsewhere

export interface ItemEffect {
  trigger: ItemTrigger;
  kind: ItemEffectKind;
  value: number;
  forms?: Form[];
  cardIds?: string[];
  /** Only fire if card cost >= this (play trigger). */
  minCost?: number;
  /** Only fire if card cost === this. */
  exactCost?: number;
  oncePerTurn?: boolean;
  oncePerCombat?: boolean;
  /** For onHeal: only if healed amount >= this. */
  minHeal?: number;
  /** For onGainBlock: only if block gain >= this. */
  minBlock?: number;
  /** Require player HP ratio at or below this (0–1). */
  maxHpRatio?: number;
  /** Require player at full HP. */
  requireFullHp?: boolean;
  /** Require any living enemy bleeding. */
  requireBleed?: boolean;
  statusDuration?: number;
}

export interface ItemDef {
  id: string;
  name: string;
  description: string;
  /** null = offered to every specialization. */
  spec: OpeningSpec | null;
  rarity: 'common' | 'rare' | 'epic';
  effects: ItemEffect[];
}

export const ITEMS: Record<string, ItemDef> = {
  // ════════════════════════════════════════════════════════════════
  // GENERAL (20) — every specialization
  // ════════════════════════════════════════════════════════════════
  travelers_boots: {
    id: 'travelers_boots',
    name: "Traveler's Boots",
    description: 'At the start of combat, gain 8 Block.',
    spec: null,
    rarity: 'common',
    effects: [{ trigger: 'combatStart', kind: 'block', value: 8 }],
  },
  sharpened_fang: {
    id: 'sharpened_fang',
    name: 'Sharpened Fang',
    description: 'Your attacks deal +1 damage.',
    spec: null,
    rarity: 'common',
    effects: [{ trigger: 'onDealDamage', kind: 'flag', value: 1 }],
  },
  soothing_balm: {
    id: 'soothing_balm',
    name: 'Soothing Balm',
    description: 'Heals restore +2 HP.',
    spec: null,
    rarity: 'common',
    effects: [{ trigger: 'onHeal', kind: 'flag', value: 2 }],
  },
  iron_buckler: {
    id: 'iron_buckler',
    name: 'Iron Buckler',
    description: 'Block gains are increased by 2.',
    spec: null,
    rarity: 'common',
    effects: [{ trigger: 'onGainBlock', kind: 'flag', value: 2 }],
  },
  lucky_coin: {
    id: 'lucky_coin',
    name: 'Lucky Coin',
    description: 'Gain 30 Gold.',
    spec: null,
    rarity: 'common',
    effects: [{ trigger: 'onPickup', kind: 'gold', value: 30 }],
  },
  spare_flask: {
    id: 'spare_flask',
    name: 'Spare Flask',
    description: 'Gain 1 Potion.',
    spec: null,
    rarity: 'common',
    effects: [{ trigger: 'onPickup', kind: 'potion', value: 1 }],
  },
  heavy_bracer: {
    id: 'heavy_bracer',
    name: 'Heavy Bracer',
    description: 'At the start of your turn, gain 4 Block.',
    spec: null,
    rarity: 'common',
    effects: [{ trigger: 'turnStart', kind: 'block', value: 4 }],
  },
  crow_feather: {
    id: 'crow_feather',
    name: 'Crow Feather',
    description: 'When you kill an enemy, draw 1 card.',
    spec: null,
    rarity: 'rare',
    effects: [{ trigger: 'onKill', kind: 'draw', value: 1 }],
  },
  blood_pact: {
    id: 'blood_pact',
    name: 'Blood Pact',
    description: 'When you kill an enemy, heal 5.',
    spec: null,
    rarity: 'rare',
    effects: [{ trigger: 'onKill', kind: 'heal', value: 5 }],
  },
  ember_charm: {
    id: 'ember_charm',
    name: 'Ember Charm',
    description: 'At the start of combat, gain 1 Spell Power.',
    spec: null,
    rarity: 'common',
    effects: [{ trigger: 'combatStart', kind: 'spellPower', value: 1 }],
  },
  war_paint: {
    id: 'war_paint',
    name: 'War Paint',
    description: 'At the start of combat, gain 2 Strength.',
    spec: null,
    rarity: 'rare',
    effects: [{ trigger: 'combatStart', kind: 'strength', value: 2 }],
  },
  restless_mind: {
    id: 'restless_mind',
    name: 'Restless Mind',
    description: 'Draw 1 extra card at the start of each turn.',
    spec: null,
    rarity: 'epic',
    effects: [{ trigger: 'turnStart', kind: 'draw', value: 1 }],
  },
  second_wind: {
    id: 'second_wind',
    name: 'Second Wind',
    description: 'The first time you heal each turn, gain 4 Block.',
    spec: null,
    rarity: 'rare',
    effects: [
      {
        trigger: 'onHeal',
        kind: 'block',
        value: 4,
        oncePerTurn: true,
        minHeal: 1,
      },
    ],
  },
  adrenaline_vial: {
    id: 'adrenaline_vial',
    name: 'Adrenaline Vial',
    description: 'While below 40% HP, gain +1 Energy at turn start.',
    spec: null,
    rarity: 'epic',
    effects: [
      {
        trigger: 'turnStart',
        kind: 'energy',
        value: 1,
        maxHpRatio: 0.4,
      },
    ],
  },
  monk_beads: {
    id: 'monk_beads',
    name: 'Monk Beads',
    description: 'At the start of your turn, remove 1 debuff.',
    spec: null,
    rarity: 'rare',
    effects: [{ trigger: 'turnStart', kind: 'cleanseOne', value: 1 }],
  },
  venom_vial: {
    id: 'venom_vial',
    name: 'Venom Vial',
    description: 'Damage-over-time effects you apply last 1 extra turn.',
    spec: null,
    rarity: 'rare',
    effects: [{ trigger: 'onApplyDot', kind: 'dotExtraDuration', value: 1 }],
  },
  crystal_lens: {
    id: 'crystal_lens',
    name: 'Crystal Lens',
    description: 'Vulnerable you apply lasts 1 extra turn.',
    spec: null,
    rarity: 'rare',
    effects: [
      { trigger: 'onPlayCard', kind: 'vulnerableBonusDuration', value: 1 },
    ],
  },
  scavenger_pouch: {
    id: 'scavenger_pouch',
    name: 'Scavenger Pouch',
    description: 'At combat start, gain 15 Gold.',
    spec: null,
    rarity: 'common',
    effects: [{ trigger: 'combatStart', kind: 'gold', value: 15 }],
  },
  tempered_heart: {
    id: 'tempered_heart',
    name: 'Tempered Heart',
    description: 'At the start of combat, heal 8.',
    spec: null,
    rarity: 'common',
    effects: [{ trigger: 'combatStart', kind: 'heal', value: 8 }],
  },
  focus_band: {
    id: 'focus_band',
    name: 'Focus Band',
    description: 'At the start of combat, gain 1 Energy.',
    spec: null,
    rarity: 'rare',
    effects: [{ trigger: 'combatStart', kind: 'energy', value: 1 }],
  },

  // ════════════════════════════════════════════════════════════════
  // FERAL (5)
  // ════════════════════════════════════════════════════════════════
  bloodfang_charm: {
    id: 'bloodfang_charm',
    name: 'Bloodfang Charm',
    description: 'Bleed ticks deal +4 damage.',
    spec: 'feral',
    rarity: 'rare',
    effects: [{ trigger: 'onEnemyDotTick', kind: 'dotBonusPerTick', value: 4 }],
  },
  ironpelt_totem: {
    id: 'ironpelt_totem',
    name: 'Ironpelt Totem',
    description: 'Whenever you gain Block, deal 3 damage to a random enemy.',
    spec: 'feral',
    rarity: 'epic',
    effects: [{ trigger: 'onGainBlock', kind: 'damageRandom', value: 3 }],
  },
  frenzy_claw: {
    id: 'frenzy_claw',
    name: 'Frenzy Claw',
    description: 'After you play a 0-cost card, deal 6 damage to the lowest-HP enemy.',
    spec: 'feral',
    rarity: 'rare',
    effects: [
      {
        trigger: 'onPlayCard',
        kind: 'damageLowest',
        value: 6,
        exactCost: 0,
      },
    ],
  },
  alpha_mark: {
    id: 'alpha_mark',
    name: 'Alpha Mark',
    description: 'The first Cat card you play each turn applies Vulnerable for 1 turn.',
    spec: 'feral',
    rarity: 'rare',
    effects: [
      {
        trigger: 'onPlayCard',
        kind: 'applyVulnerable',
        value: 1,
        forms: ['cat'],
        oncePerTurn: true,
        statusDuration: 1,
      },
    ],
  },
  thick_hide_wraps: {
    id: 'thick_hide_wraps',
    name: 'Thick Hide Wraps',
    description: 'Whenever you play a Bear card, gain 5 Block.',
    spec: 'feral',
    rarity: 'rare',
    effects: [
      {
        trigger: 'onPlayCard',
        kind: 'block',
        value: 5,
        forms: ['bear'],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // BOOMKIN (5)
  // ════════════════════════════════════════════════════════════════
  celestial_orb: {
    id: 'celestial_orb',
    name: 'Celestial Orb',
    description: 'At the start of combat, gain 3 Spell Power.',
    spec: 'boomkin',
    rarity: 'rare',
    effects: [{ trigger: 'combatStart', kind: 'spellPower', value: 3 }],
  },
  thornwoven_cloak: {
    id: 'thornwoven_cloak',
    name: 'Thornwoven Cloak',
    description: 'When you gain Thorns, also gain 8 Block.',
    spec: 'boomkin',
    rarity: 'epic',
    effects: [{ trigger: 'onGainThorns', kind: 'thornsBonusBlock', value: 8 }],
  },
  twin_star: {
    id: 'twin_star',
    name: 'Twin Star',
    description: 'Random damage also hits another enemy for half (rounded up).',
    spec: 'boomkin',
    rarity: 'rare',
    effects: [{ trigger: 'onDealDamage', kind: 'doubleRandomHalf', value: 1 }],
  },
  hurricane_eye: {
    id: 'hurricane_eye',
    name: 'Hurricane Eye',
    description: 'Your Boomkin AoE also applies 6 bleed over 2 turns.',
    spec: 'boomkin',
    rarity: 'rare',
    effects: [
      {
        trigger: 'onPlayCard',
        kind: 'applyBleed',
        value: 6,
        forms: ['boomkin'],
        cardIds: ['hurricane', 'starfall', 'sunfire'],
        statusDuration: 2,
      },
    ],
  },
  astral_battery: {
    id: 'astral_battery',
    name: 'Astral Battery',
    description: 'Once per turn, after playing a 2+ cost Boomkin card, gain 1 Energy.',
    spec: 'boomkin',
    rarity: 'epic',
    effects: [
      {
        trigger: 'onPlayCard',
        kind: 'energy',
        value: 1,
        forms: ['boomkin'],
        minCost: 2,
        oncePerTurn: true,
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // TREE (5)
  // ════════════════════════════════════════════════════════════════
  verdant_lash: {
    id: 'verdant_lash',
    name: 'Verdant Lash',
    description: 'Whenever you heal, deal 4 damage to a random enemy.',
    spec: 'tree',
    rarity: 'epic',
    effects: [{ trigger: 'onHeal', kind: 'damageRandom', value: 4, minHeal: 1 }],
  },
  lifebloom_crown: {
    id: 'lifebloom_crown',
    name: 'Lifebloom Crown',
    description: 'Your HoT ticks also grant 2 Block.',
    spec: 'tree',
    rarity: 'rare',
    effects: [{ trigger: 'combatStart', kind: 'flag', value: 2 }],
  },
  grove_battery: {
    id: 'grove_battery',
    name: 'Grove Battery',
    description: 'After playing your second Tree card each turn, gain 1 Energy.',
    spec: 'tree',
    rarity: 'rare',
    effects: [
      {
        trigger: 'onPlayCard',
        kind: 'energy',
        value: 1,
        forms: ['tree'],
        oncePerTurn: true,
      },
    ],
  },
  barkbreaker_seed: {
    id: 'barkbreaker_seed',
    name: 'Barkbreaker Seed',
    description: 'The first time you gain 10+ Block in a turn, deal 10 to ALL enemies.',
    spec: 'tree',
    rarity: 'epic',
    effects: [
      {
        trigger: 'onGainBlock',
        kind: 'damageAll',
        value: 10,
        oncePerTurn: true,
      },
    ],
  },
  swiftroot_charm: {
    id: 'swiftroot_charm',
    name: 'Swiftroot Charm',
    description: 'Tree cards cost 1 less (minimum 0).',
    spec: 'tree',
    rarity: 'epic',
    effects: [{ trigger: 'onPlayCard', kind: 'flag', value: 1 }],
  },

  // ════════════════════════════════════════════════════════════════
  // HOLY (5)
  // ════════════════════════════════════════════════════════════════
  radiant_censer: {
    id: 'radiant_censer',
    name: 'Radiant Censer',
    description: 'Whenever you play a Holy heal, deal 5 damage to the lowest-HP enemy.',
    spec: 'holy',
    rarity: 'epic',
    effects: [
      {
        trigger: 'onPlayCard',
        kind: 'damageLowest',
        value: 5,
        forms: ['holy'],
        cardIds: [
          'flash_heal',
          'renew',
          'prayer_of_healing',
          'holy_word_serenity',
          'guardian_spirit',
          'divine_hymn',
        ],
      },
    ],
  },
  serenity_bell: {
    id: 'serenity_bell',
    name: 'Serenity Bell',
    description: 'When you play a heal that costs 2+, draw 1 card.',
    spec: 'holy',
    rarity: 'rare',
    effects: [
      {
        trigger: 'onPlayCard',
        kind: 'draw',
        value: 1,
        forms: ['holy'],
        minCost: 2,
        cardIds: [
          'prayer_of_healing',
          'holy_word_serenity',
          'divine_hymn',
          'flash_heal',
          'renew',
          'guardian_spirit',
        ],
      },
    ],
  },
  sacred_flame: {
    id: 'sacred_flame',
    name: 'Sacred Flame',
    description: 'Holy Fire and Holy Nova deal +5 damage.',
    spec: 'holy',
    rarity: 'rare',
    effects: [{ trigger: 'onDealDamage', kind: 'flag', value: 5 }],
  },
  martyr_rosary: {
    id: 'martyr_rosary',
    name: 'Martyr Rosary',
    description: 'When you heal while at full HP, gain 8 Block.',
    spec: 'holy',
    rarity: 'rare',
    effects: [
      {
        trigger: 'onHeal',
        kind: 'block',
        value: 8,
        requireFullHp: true,
      },
    ],
  },
  hymn_book: {
    id: 'hymn_book',
    name: 'Hymn Book',
    description: 'Once per turn, after playing a Holy card, gain 6 Block.',
    spec: 'holy',
    rarity: 'epic',
    effects: [
      {
        trigger: 'onPlayCard',
        kind: 'block',
        value: 6,
        forms: ['holy'],
        oncePerTurn: true,
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // SHADOW (5)
  // ════════════════════════════════════════════════════════════════
  void_leech: {
    id: 'void_leech',
    name: 'Void Leech',
    description: 'When an enemy DoT ticks, heal 4.',
    spec: 'shadow',
    rarity: 'epic',
    effects: [{ trigger: 'onEnemyDotTick', kind: 'healOnDotTick', value: 4 }],
  },
  pain_amplifier: {
    id: 'pain_amplifier',
    name: 'Pain Amplifier',
    description: 'Damage-over-time effects you apply last 1 extra turn and deal +2 per tick.',
    spec: 'shadow',
    rarity: 'rare',
    effects: [
      { trigger: 'onApplyDot', kind: 'dotExtraDuration', value: 1 },
      { trigger: 'onEnemyDotTick', kind: 'dotBonusPerTick', value: 2 },
    ],
  },
  scream_mask: {
    id: 'scream_mask',
    name: 'Scream Mask',
    description: 'When you apply Weak, also apply Vulnerable for 1 turn.',
    spec: 'shadow',
    rarity: 'rare',
    effects: [
      {
        trigger: 'onPlayCard',
        kind: 'applyVulnerable',
        value: 1,
        cardIds: ['psychic_scream', 'shadow_word_pain'],
        statusDuration: 1,
      },
    ],
  },
  shadow_absorb: {
    id: 'shadow_absorb',
    name: 'Shadow Absorb',
    description: 'Recoil damage is reduced by 50%.',
    spec: 'shadow',
    rarity: 'epic',
    effects: [{ trigger: 'onRecoil', kind: 'reduceRecoilPct', value: 50 }],
  },
  death_wish: {
    id: 'death_wish',
    name: 'Death Wish',
    description: 'When you take recoil, gain 1 Energy.',
    spec: 'shadow',
    rarity: 'rare',
    effects: [{ trigger: 'onRecoil', kind: 'energyOnRecoil', value: 1 }],
  },

  // ════════════════════════════════════════════════════════════════
  // DISCIPLINE (5)
  // ════════════════════════════════════════════════════════════════
  shield_spike: {
    id: 'shield_spike',
    name: 'Shield Spike',
    description: 'Whenever you gain Block, deal 3 damage to a random enemy.',
    spec: 'discipline',
    rarity: 'epic',
    effects: [{ trigger: 'onGainBlock', kind: 'damageRandom', value: 3 }],
  },
  penitent_brand: {
    id: 'penitent_brand',
    name: 'Penitent Brand',
    description: 'Penance also applies Vulnerable for 2 turns.',
    spec: 'discipline',
    rarity: 'rare',
    effects: [
      {
        trigger: 'onPlayCard',
        kind: 'applyVulnerable',
        value: 1,
        cardIds: ['penance'],
        statusDuration: 2,
      },
    ],
  },
  borrowed_timepiece: {
    id: 'borrowed_timepiece',
    name: 'Borrowed Timepiece',
    description: '25% of your Block carries over between turns.',
    spec: 'discipline',
    rarity: 'epic',
    effects: [{ trigger: 'turnStart', kind: 'blockCarryoverPct', value: 25 }],
  },
  smite_echo: {
    id: 'smite_echo',
    name: 'Smite Echo',
    description: 'Discipline attacks heal you for 4.',
    spec: 'discipline',
    rarity: 'rare',
    effects: [
      {
        trigger: 'onDealDamage',
        kind: 'heal',
        value: 4,
        forms: ['discipline'],
      },
    ],
  },
  radiance_loop: {
    id: 'radiance_loop',
    name: 'Radiance Loop',
    description: 'Once per turn, after playing a Discipline block card, draw 1.',
    spec: 'discipline',
    rarity: 'rare',
    effects: [
      {
        trigger: 'onPlayCard',
        kind: 'draw',
        value: 1,
        forms: ['discipline'],
        cardIds: [
          'power_word_shield',
          'power_word_radiance',
          'pain_suppression',
        ],
        oncePerTurn: true,
      },
    ],
  },
};

export const GENERAL_ITEM_IDS: string[] = Object.values(ITEMS)
  .filter((i) => i.spec === null)
  .map((i) => i.id);

export const SPEC_ITEM_IDS: Record<OpeningSpec, string[]> = {
  feral: Object.values(ITEMS).filter((i) => i.spec === 'feral').map((i) => i.id),
  boomkin: Object.values(ITEMS).filter((i) => i.spec === 'boomkin').map((i) => i.id),
  tree: Object.values(ITEMS).filter((i) => i.spec === 'tree').map((i) => i.id),
  holy: Object.values(ITEMS).filter((i) => i.spec === 'holy').map((i) => i.id),
  shadow: Object.values(ITEMS).filter((i) => i.spec === 'shadow').map((i) => i.id),
  discipline: Object.values(ITEMS)
    .filter((i) => i.spec === 'discipline')
    .map((i) => i.id),
};

export function getItem(id: string): ItemDef | undefined {
  return ITEMS[id];
}

export function itemPoolForSpec(spec: OpeningSpec): string[] {
  return [...GENERAL_ITEM_IDS, ...SPEC_ITEM_IDS[spec]];
}

/** Offer 3 random unowned items from general + current spec pools. */
export function randomItemOffers(
  spec: OpeningSpec,
  owned: string[],
  count = 3,
): string[] {
  const ownedSet = new Set(owned);
  const pool = itemPoolForSpec(spec).filter((id) => !ownedSet.has(id));
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  // Prefer mixing: try to include at least one spec item when available
  const specAvail = SPEC_ITEM_IDS[spec].filter((id) => !ownedSet.has(id));
  const generalAvail = GENERAL_ITEM_IDS.filter((id) => !ownedSet.has(id));
  const picks: string[] = [];
  if (specAvail.length) {
    picks.push(specAvail[Math.floor(Math.random() * specAvail.length)]!);
  }
  const rest = shuffled.filter((id) => !picks.includes(id));
  while (picks.length < count && rest.length) {
    picks.push(rest.shift()!);
  }
  // If still short (owned almost everything), refill from any remaining
  while (picks.length < count && generalAvail.length) {
    const id = generalAvail[Math.floor(Math.random() * generalAvail.length)]!;
    if (!picks.includes(id)) picks.push(id);
    else break;
  }
  return picks.slice(0, count);
}

export function applyItemPickup(run: {
  gold: number;
  potions: number;
  items: string[];
}, itemId: string): void {
  if (run.items.includes(itemId)) return;
  run.items.push(itemId);
  const def = ITEMS[itemId];
  if (!def) return;
  for (const fx of def.effects) {
    if (fx.trigger !== 'onPickup') continue;
    if (fx.kind === 'gold') run.gold += fx.value;
    if (fx.kind === 'potion') run.potions += fx.value;
  }
}

/** Flat bonuses read by combat (damage/heal/block pads). */
export function itemFlatDamageBonus(items: string[]): number {
  return items.includes('sharpened_fang') ? 1 : 0;
}

export function itemFlatHealBonus(items: string[]): number {
  return items.includes('soothing_balm') ? 2 : 0;
}

export function itemFlatBlockBonus(items: string[]): number {
  return items.includes('iron_buckler') ? 2 : 0;
}

export function itemSacredFlameBonus(items: string[], cardId: string): number {
  if (!items.includes('sacred_flame')) return 0;
  return cardId === 'holy_fire' || cardId === 'holy_nova' ? 5 : 0;
}

export function itemTreeCostReduce(items: string[]): number {
  return items.includes('swiftroot_charm') ? 1 : 0;
}

export function itemRecoilReducePct(items: string[]): number {
  return items.includes('shadow_absorb') ? 50 : 0;
}

export function itemBlockCarryoverPct(items: string[]): number {
  return items.includes('borrowed_timepiece') ? 25 : 0;
}

export function itemLifebloomCrown(items: string[]): boolean {
  return items.includes('lifebloom_crown');
}

export function itemTwinStar(items: string[]): boolean {
  return items.includes('twin_star');
}

export type CombatItemFlags = {
  turn: Record<string, boolean>;
  combat: Record<string, boolean>;
  /** Heal cards played this turn (grove_battery). */
  healPlaysThisTurn: number;
  /** Block gained this turn before current gain (barkbreaker). */
  blockGainedThisTurn: number;
  /** Discard happened via card effect this turn (hymn_book). */
  discardedThisTurn: boolean;
};

export function createItemFlags(): CombatItemFlags {
  return {
    turn: {},
    combat: {},
    healPlaysThisTurn: 0,
    blockGainedThisTurn: 0,
    discardedThisTurn: false,
  };
}

export function resetItemTurnFlags(flags: CombatItemFlags): void {
  flags.turn = {};
  flags.healPlaysThisTurn = 0;
  flags.blockGainedThisTurn = 0;
  flags.discardedThisTurn = false;
}

/** Debuff kinds cleansable by monk beads. */
export const ITEM_CLEANSE_KINDS: StatusEffect['kind'][] = [
  'poison',
  'bleed',
  'weak',
  'vulnerable',
];
