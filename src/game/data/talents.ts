import { talentTreesForClass } from './classes';
import { PRIEST_TALENTS } from './priestTalents';
import type {
  CardDef,
  CardEffect,
  ClassId,
  EffectKind,
  Form,
  TalentDef,
  TalentTree,
} from './types';

/** @deprecated Prefer talentTreesForClass(run.classId) — kept for Druid-only callers. */
export const TALENT_TREES: TalentTree[] = ['feral', 'resto', 'balance'];

/** Points spent in a tree required to unlock each tier (tier 0 = free). */
export const POINTS_PER_TIER = 3;

export const TALENT_TREE_LABELS: Record<TalentTree, string> = {
  feral: 'Feral',
  resto: 'Restoration',
  balance: 'Balance',
  holy: 'Holy',
  shadow: 'Shadow',
  discipline: 'Discipline',
};

export const TALENT_TREE_COLORS: Record<TalentTree, number> = {
  feral: 0xc9a227,
  resto: 0x3d9b6a,
  balance: 0x5b7cfa,
  holy: 0xf0c75e,
  shadow: 0x7c3aed,
  discipline: 0xe8e0d0,
};

export const TALENT_TREE_BLURBS: Record<TalentTree, string> = {
  feral: 'Claws, fangs & hide',
  resto: 'Healing & resilience',
  balance: 'Arcane & nature spells',
  holy: 'Radiant healing light',
  shadow: 'Void & mind magic',
  discipline: 'Shields & atonement',
};

/**
 * Classic-style talent trees: spend points in a tree to unlock deeper tiers.
 * Prerequisites chain key talents. Capstones reward specialization.
 */
export const DRUID_TALENTS: Record<string, TalentDef> = {
  // ════════════════════════════════════════════════════════════════
  // FERAL — Cat & Bear
  // ════════════════════════════════════════════════════════════════

  // Tier 0
  feral_instinct: {
    id: 'feral_instinct',
    name: 'Feral Instinct',
    tree: 'feral',
    description: 'Cat and Bear cards deal +4 damage.',
    maxRanks: 3,
    tier: 0,
    column: 0,
    glyph: 'FI',
    modifiers: {
      forms: ['cat', 'bear'],
      effectKinds: ['damage', 'aoeDamage', 'damageOverTime'],
      damageBonus: 4,
    },
  },
  thick_hide: {
    id: 'thick_hide',
    name: 'Thick Hide',
    tree: 'feral',
    description: 'Bear Block effects gain +5 Block.',
    maxRanks: 3,
    tier: 0,
    column: 2,
    glyph: 'TH',
    modifiers: {
      forms: ['bear'],
      effectKinds: ['block'],
      blockBonus: 5,
    },
  },

  // Tier 1 (3 points in Feral)
  predatory_strikes: {
    id: 'predatory_strikes',
    name: 'Predatory Strikes',
    tree: 'feral',
    description: 'Cat cards deal +6 damage.',
    maxRanks: 3,
    tier: 1,
    column: 0,
    requires: 'feral_instinct',
    glyph: 'PS',
    modifiers: {
      forms: ['cat'],
      effectKinds: ['damage', 'damageOverTime'],
      damageBonus: 6,
    },
  },
  brutal_maul: {
    id: 'brutal_maul',
    name: 'Brutal Maul',
    tree: 'feral',
    description: 'Maul deals +8 damage and gains +5 Block.',
    maxRanks: 2,
    tier: 1,
    column: 1,
    glyph: 'BM',
    modifiers: {
      cardIds: ['maul'],
      damageBonus: 8,
      blockBonus: 5,
    },
  },
  improved_swipe: {
    id: 'improved_swipe',
    name: 'Improved Swipe',
    tree: 'feral',
    description: 'Swipe deals +6 damage.',
    maxRanks: 2,
    tier: 1,
    column: 2,
    requires: 'thick_hide',
    glyph: 'IS',
    modifiers: {
      cardIds: ['swipe'],
      effectKinds: ['aoeDamage'],
      damageBonus: 6,
    },
  },

  // Tier 2 (6 points in Feral)
  shredding_attacks: {
    id: 'shredding_attacks',
    name: 'Shredding Attacks',
    tree: 'feral',
    description: 'Shred deals +7 damage.',
    maxRanks: 2,
    tier: 2,
    column: 0,
    requires: 'predatory_strikes',
    glyph: 'SA',
    modifiers: {
      cardIds: ['shred'],
      effectKinds: ['damage'],
      damageBonus: 7,
    },
  },
  blood_in_the_water: {
    id: 'blood_in_the_water',
    name: 'Blood in the Water',
    tree: 'feral',
    description: 'Rip deals +25 damage over time.',
    maxRanks: 2,
    tier: 2,
    column: 1,
    requires: 'brutal_maul',
    glyph: 'BW',
    modifiers: {
      cardIds: ['rip'],
      effectKinds: ['damageOverTime'],
      damageBonus: 25,
    },
  },

  // Tier 3 (9 points in Feral) — capstone
  king_of_the_jungle: {
    id: 'king_of_the_jungle',
    name: 'King of the Jungle',
    tree: 'feral',
    description: 'Cat and Bear cards deal 20% more damage.',
    maxRanks: 1,
    tier: 3,
    column: 1,
    requires: 'blood_in_the_water',
    glyph: 'KJ',
    modifiers: {
      forms: ['cat', 'bear'],
      effectKinds: ['damage', 'aoeDamage', 'damageOverTime'],
      damagePct: 20,
    },
  },

  // ════════════════════════════════════════════════════════════════
  // RESTORATION — Healing & resilience
  // ════════════════════════════════════════════════════════════════

  // Tier 0
  improved_healing_touch: {
    id: 'improved_healing_touch',
    name: 'Improved Healing Touch',
    tree: 'resto',
    description: 'Healing Touch heals +14.',
    maxRanks: 3,
    tier: 0,
    column: 0,
    glyph: 'HT',
    modifiers: {
      cardIds: ['healing_touch'],
      effectKinds: ['heal'],
      healBonus: 14,
    },
  },
  naturalist: {
    id: 'naturalist',
    name: 'Naturalist',
    tree: 'resto',
    description: 'All Tree-form heals restore +6.',
    maxRanks: 3,
    tier: 0,
    column: 2,
    glyph: 'N',
    modifiers: {
      forms: ['tree'],
      effectKinds: ['heal', 'healOverTime'],
      healBonus: 6,
    },
  },

  // Tier 1 (3 points in Resto)
  gift_of_the_wild: {
    id: 'gift_of_the_wild',
    name: 'Gift of the Wild',
    tree: 'resto',
    description: 'Rejuvenation heals +30 over its duration.',
    maxRanks: 2,
    tier: 1,
    column: 0,
    requires: 'improved_healing_touch',
    glyph: 'GW',
    modifiers: {
      cardIds: ['rejuvenation'],
      effectKinds: ['healOverTime'],
      healBonus: 30,
    },
  },
  natural_ward: {
    id: 'natural_ward',
    name: 'Natural Ward',
    tree: 'resto',
    description: 'Decurse gains +12 Block.',
    maxRanks: 2,
    tier: 1,
    column: 1,
    glyph: 'NW',
    modifiers: {
      cardIds: ['decurse'],
      effectKinds: ['block'],
      blockBonus: 12,
    },
  },
  verdant_growth: {
    id: 'verdant_growth',
    name: 'Verdant Growth',
    tree: 'resto',
    description: 'Wild Growth gains +8 Block and +6 heal.',
    maxRanks: 2,
    tier: 1,
    column: 2,
    requires: 'naturalist',
    glyph: 'VG',
    modifiers: {
      cardIds: ['wild_growth'],
      blockBonus: 8,
      healBonus: 6,
    },
  },

  // Tier 2 (6 points in Resto)
  living_spirit: {
    id: 'living_spirit',
    name: 'Living Spirit',
    tree: 'resto',
    description: 'All Tree-form healing effects heal 25% more.',
    maxRanks: 2,
    tier: 2,
    column: 1,
    requires: 'natural_ward',
    glyph: 'LS',
    modifiers: {
      forms: ['tree'],
      effectKinds: ['heal', 'healOverTime'],
      healPct: 25,
    },
  },

  // Tier 3 (9 points in Resto) — capstone
  tree_of_life: {
    id: 'tree_of_life',
    name: 'Tree of Life',
    tree: 'resto',
    description: 'Tree-form Block and heals are 25% stronger.',
    maxRanks: 1,
    tier: 3,
    column: 1,
    requires: 'living_spirit',
    glyph: 'TL',
    modifiers: {
      forms: ['tree'],
      effectKinds: ['heal', 'healOverTime'],
      healPct: 25,
    },
  },

  // ════════════════════════════════════════════════════════════════
  // BALANCE — Boomkin spells
  // ════════════════════════════════════════════════════════════════

  // Tier 0
  wrath_of_elune: {
    id: 'wrath_of_elune',
    name: 'Wrath of Elune',
    tree: 'balance',
    description: 'Wrath and Starfire deal +7 damage.',
    maxRanks: 3,
    tier: 0,
    column: 0,
    glyph: 'WE',
    modifiers: {
      cardIds: ['wrath', 'starfire'],
      effectKinds: ['damage'],
      damageBonus: 7,
    },
  },
  moonfury: {
    id: 'moonfury',
    name: 'Moonfury',
    tree: 'balance',
    description: 'Boomkin spells deal +3 damage.',
    maxRanks: 3,
    tier: 0,
    column: 2,
    glyph: 'MF',
    modifiers: {
      forms: ['boomkin'],
      effectKinds: ['damage', 'aoeDamage', 'damageOverTime'],
      damageBonus: 3,
    },
  },

  // Tier 1 (3 points in Balance)
  improved_moonfire: {
    id: 'improved_moonfire',
    name: 'Improved Moonfire',
    tree: 'balance',
    description: 'Moonfire deals +5 damage and +5 over time.',
    maxRanks: 2,
    tier: 1,
    column: 0,
    requires: 'wrath_of_elune',
    glyph: 'IM',
    modifiers: {
      cardIds: ['moonfire'],
      damageBonus: 5,
    },
  },
  gale_force: {
    id: 'gale_force',
    name: 'Gale Force',
    tree: 'balance',
    description: 'Hurricane deals +7 damage.',
    maxRanks: 2,
    tier: 1,
    column: 1,
    glyph: 'GF',
    modifiers: {
      cardIds: ['hurricane'],
      effectKinds: ['aoeDamage'],
      damageBonus: 7,
    },
  },
  astral_power: {
    id: 'astral_power',
    name: 'Astral Power',
    tree: 'balance',
    description: 'Starsurge deals +10 damage.',
    maxRanks: 2,
    tier: 1,
    column: 2,
    requires: 'moonfury',
    glyph: 'AP',
    modifiers: {
      cardIds: ['starsurge'],
      effectKinds: ['damage'],
      damageBonus: 10,
    },
  },

  // Tier 2 (6 points in Balance)
  lunar_guidance: {
    id: 'lunar_guidance',
    name: 'Lunar Guidance',
    tree: 'balance',
    description: 'Gain +4 Spell Power at combat start (spells only).',
    maxRanks: 3,
    tier: 2,
    column: 1,
    requires: 'gale_force',
    glyph: 'LG',
    modifiers: {
      spellPowerBonus: 4,
    },
  },

  // Tier 3 (9 points in Balance) — capstone
  eclipse: {
    id: 'eclipse',
    name: 'Eclipse',
    tree: 'balance',
    description: 'Boomkin spells deal 25% more damage.',
    maxRanks: 1,
    tier: 3,
    column: 1,
    requires: 'lunar_guidance',
    glyph: 'E',
    modifiers: {
      forms: ['boomkin'],
      effectKinds: ['damage', 'aoeDamage', 'damageOverTime'],
      damagePct: 25,
    },
  },
};

/** Capstone Tree of Life / Evangelism: also boost block via a dedicated path in modifyEffectValue. */
const TREE_OF_LIFE_BLOCK_PCT = 25;
const EVANGELISM_BLOCK_PCT = 25;

/** All talents across classes (ids must be unique). */
export const TALENTS: Record<string, TalentDef> = {
  ...DRUID_TALENTS,
  ...PRIEST_TALENTS,
};

function talentsForTree(tree: TalentTree): TalentDef[] {
  return Object.values(TALENTS)
    .filter((t) => t.tree === tree)
    .sort((a, b) => a.tier - b.tier || a.column - b.column);
}

export const TALENTS_BY_TREE: Record<TalentTree, TalentDef[]> = {
  feral: talentsForTree('feral'),
  resto: talentsForTree('resto'),
  balance: talentsForTree('balance'),
  holy: talentsForTree('holy'),
  shadow: talentsForTree('shadow'),
  discipline: talentsForTree('discipline'),
};

export function talentTreesForRun(classId: ClassId): TalentTree[] {
  return talentTreesForClass(classId);
}

export function getTalentRank(talents: Record<string, number>, id: string): number {
  return talents[id] ?? 0;
}

/**
 * Talent tooltip text with flat/percent bonuses scaled by current ranks.
 * Rank 0 shows the per-rank values; rank N shows the additive total (e.g. +4 × 3 = +12).
 */
export function formatTalentDescription(talent: TalentDef, ranks: number): string {
  const scale = ranks > 0 ? ranks : 1;
  if (scale === 1) return talent.description;

  const mod = talent.modifiers;
  const pairs: Array<[number, number]> = [];
  if (mod.damageBonus) pairs.push([mod.damageBonus, mod.damageBonus * scale]);
  if (mod.healBonus) pairs.push([mod.healBonus, mod.healBonus * scale]);
  if (mod.blockBonus) pairs.push([mod.blockBonus, mod.blockBonus * scale]);
  if (mod.spellPowerBonus) pairs.push([mod.spellPowerBonus, mod.spellPowerBonus * scale]);
  if (mod.damagePct) pairs.push([mod.damagePct, mod.damagePct * scale]);
  if (mod.healPct) pairs.push([mod.healPct, mod.healPct * scale]);

  // Larger bases first so e.g. +25 is not partially matched by +2.
  pairs.sort((a, b) => b[0] - a[0]);

  let desc = talent.description;
  for (const [base, total] of pairs) {
    desc = desc.replace(new RegExp(`\\+${base}\\b`, 'g'), `+${total}`);
    desc = desc.replace(new RegExp(`(?<!\\d)${base}%`, 'g'), `${total}%`);
  }
  return desc;
}

export function totalTalentRanks(talents: Record<string, number>): number {
  return Object.values(talents).reduce((sum, n) => sum + n, 0);
}

/** Points spent in a single tree. */
export function treePointsSpent(talents: Record<string, number>, tree: TalentTree): number {
  return TALENTS_BY_TREE[tree].reduce((sum, t) => sum + getTalentRank(talents, t.id), 0);
}

/** Highest tier index present in any tree. */
export function maxTalentTier(): number {
  return Math.max(...Object.values(TALENTS).map((t) => t.tier));
}

/** Whether the tree has enough points to unlock this talent's tier. */
export function isTierUnlocked(talents: Record<string, number>, talent: TalentDef): boolean {
  return treePointsSpent(talents, talent.tree) >= talent.tier * POINTS_PER_TIER;
}

/** Whether the prerequisite talent (if any) has at least one rank. */
export function isPrerequisiteMet(talents: Record<string, number>, talent: TalentDef): boolean {
  if (!talent.requires) return true;
  return getTalentRank(talents, talent.requires) > 0;
}

export type TalentNodeState = 'locked' | 'available' | 'partial' | 'maxed';

export function getTalentNodeState(
  talents: Record<string, number>,
  talentPoints: number,
  talentId: string,
): TalentNodeState {
  const def = TALENTS[talentId];
  if (!def) return 'locked';
  const rank = getTalentRank(talents, talentId);
  if (rank >= def.maxRanks) return 'maxed';
  if (rank > 0) return 'partial';
  if (
    talentPoints > 0 &&
    isTierUnlocked(talents, def) &&
    isPrerequisiteMet(talents, def)
  ) {
    return 'available';
  }
  return 'locked';
}

function talentMatchesCard(mod: TalentDef['modifiers'], card: CardDef): boolean {
  if (mod.cardIds?.length) return mod.cardIds.includes(card.id);
  if (mod.forms?.length) return mod.forms.includes(card.form);
  // Spell-power-only talents match nothing on cards
  return false;
}

function effectKindMatches(
  mod: TalentDef['modifiers'],
  kind: EffectKind,
  bonusField: 'damageBonus' | 'healBonus' | 'blockBonus' | 'damagePct' | 'healPct',
): boolean {
  if (mod.effectKinds?.length) return mod.effectKinds.includes(kind);

  if (bonusField === 'damageBonus' || bonusField === 'damagePct') {
    return (
      kind === 'damage' ||
      kind === 'aoeDamage' ||
      kind === 'damageOverTime' ||
      kind === 'randomDamage' ||
      kind === 'thorns'
    );
  }
  if (bonusField === 'healBonus' || bonusField === 'healPct') {
    return kind === 'heal' || kind === 'healOverTime';
  }
  return kind === 'block';
}

/** Flat damage bonus from talents for a card effect. */
export function talentDamageBonus(
  talents: Record<string, number>,
  card: CardDef,
  kind: EffectKind,
): number {
  let bonus = 0;
  for (const talent of Object.values(TALENTS)) {
    const ranks = getTalentRank(talents, talent.id);
    if (ranks <= 0) continue;
    const mod = talent.modifiers;
    if (!mod.damageBonus || !talentMatchesCard(mod, card)) continue;
    if (!effectKindMatches(mod, kind, 'damageBonus')) continue;
    bonus += mod.damageBonus * ranks;
  }
  return bonus;
}

/** Multiplicative damage percent (summed across talents). */
export function talentDamagePct(
  talents: Record<string, number>,
  card: CardDef,
  kind: EffectKind,
): number {
  let pct = 0;
  for (const talent of Object.values(TALENTS)) {
    const ranks = getTalentRank(talents, talent.id);
    if (ranks <= 0) continue;
    const mod = talent.modifiers;
    if (!mod.damagePct || !talentMatchesCard(mod, card)) continue;
    if (!effectKindMatches(mod, kind, 'damagePct')) continue;
    pct += mod.damagePct * ranks;
  }
  return pct;
}

/** Flat heal bonus from talents for a card effect. */
export function talentHealBonus(
  talents: Record<string, number>,
  card: CardDef,
  kind: EffectKind,
): number {
  let bonus = 0;
  for (const talent of Object.values(TALENTS)) {
    const ranks = getTalentRank(talents, talent.id);
    if (ranks <= 0) continue;
    const mod = talent.modifiers;
    if (!mod.healBonus || !talentMatchesCard(mod, card)) continue;
    if (!effectKindMatches(mod, kind, 'healBonus')) continue;
    bonus += mod.healBonus * ranks;
  }
  return bonus;
}

/** Flat block bonus from talents for a card effect. */
export function talentBlockBonus(
  talents: Record<string, number>,
  card: CardDef,
): number {
  let bonus = 0;
  for (const talent of Object.values(TALENTS)) {
    const ranks = getTalentRank(talents, talent.id);
    if (ranks <= 0) continue;
    const mod = talent.modifiers;
    if (!mod.blockBonus || !talentMatchesCard(mod, card)) continue;
    if (!effectKindMatches(mod, 'block', 'blockBonus')) continue;
    bonus += mod.blockBonus * ranks;
  }
  return bonus;
}

/** Multiplicative heal percent (summed across talents). */
export function talentHealPct(
  talents: Record<string, number>,
  card: CardDef,
  kind: EffectKind,
): number {
  let pct = 0;
  for (const talent of Object.values(TALENTS)) {
    const ranks = getTalentRank(talents, talent.id);
    if (ranks <= 0) continue;
    const mod = talent.modifiers;
    if (!mod.healPct || !talentMatchesCard(mod, card)) continue;
    if (mod.effectKinds?.length && !mod.effectKinds.includes(kind)) continue;
    pct += mod.healPct * ranks;
  }
  return pct;
}

/** Spell power granted by talents at combat start (applies to Boomkin spells only). */
export function talentSpellPowerBonus(talents: Record<string, number>): number {
  let bonus = 0;
  for (const talent of Object.values(TALENTS)) {
    const ranks = getTalentRank(talents, talent.id);
    if (ranks <= 0) continue;
    if (talent.modifiers.spellPowerBonus) {
      bonus += talent.modifiers.spellPowerBonus * ranks;
    }
  }
  return bonus;
}

export function modifyEffectValue(
  effect: CardEffect,
  card: CardDef,
  talents: Record<string, number>,
): number {
  let value = effect.value;

  if (
    effect.kind === 'damage' ||
    effect.kind === 'aoeDamage' ||
    effect.kind === 'damageOverTime' ||
    effect.kind === 'randomDamage' ||
    effect.kind === 'thorns' ||
    (effect.kind === 'discardFor' &&
      (effect.payoffKind === 'damage' || effect.payoffKind === 'randomDamage'))
  ) {
    value += talentDamageBonus(talents, card, effect.kind);
    const pct = talentDamagePct(talents, card, effect.kind);
    if (pct > 0) value = Math.floor(value * (1 + pct / 100));
  }

  if (
    effect.kind === 'heal' ||
    effect.kind === 'healOverTime' ||
    (effect.kind === 'discardFor' && effect.payoffKind === 'heal')
  ) {
    value += talentHealBonus(talents, card, effect.kind);
    const pct = talentHealPct(talents, card, effect.kind);
    if (pct > 0) value = Math.floor(value * (1 + pct / 100));
  }

  if (
    effect.kind === 'block' ||
    (effect.kind === 'discardFor' && effect.payoffKind === 'block')
  ) {
    value += talentBlockBonus(talents, card);
    // Tree of Life capstone: +25% block on tree cards
    if (getTalentRank(talents, 'tree_of_life') > 0 && card.form === 'tree') {
      value = Math.floor(value * (1 + TREE_OF_LIFE_BLOCK_PCT / 100));
    }
    // Evangelism capstone: +25% block on discipline cards
    if (getTalentRank(talents, 'evangelism') > 0 && card.form === 'discipline') {
      value = Math.floor(value * (1 + EVANGELISM_BLOCK_PCT / 100));
    }
  }

  return value;
}

/** Build a description that reflects current talent bonuses. */
function effectDescription(effect: CardEffect, card: CardDef, talents: Record<string, number>): string {
  const value = modifyEffectValue(effect, card, talents);
  switch (effect.kind) {
    case 'damage':
      return `Deal ${value} damage.`;
    case 'aoeDamage':
      return effect.maxTargets
        ? `Deal ${value} damage to up to ${effect.maxTargets} enemies.`
        : `Deal ${value} damage to ALL enemies.`;
    case 'randomDamage':
      return `Deal ${value} damage to a random enemy.`;
    case 'recoil':
      return `Take ${value} recoil.`;
    case 'block':
      return `Gain ${value} Block.`;
    case 'heal':
      return `Heal ${value} health.`;
    case 'healOverTime':
      return `Heal ${value} health over ${effect.duration} turns.`;
    case 'damageOverTime':
      return `Deal ${value} damage over ${effect.duration} turns.`;
    case 'cleanse':
      return 'Remove all debuffs from yourself.';
    case 'earthAndMoon':
      return `Apply Earth and Moon: next Wrath or Starfire deals +${value}% damage.`;
    case 'draw':
      return `Draw ${value} card${value === 1 ? '' : 's'}.`;
    case 'drawTyped': {
      const label =
        effect.cardType === 'heal' ? 'Heal' : effect.cardType === 'block' ? 'Armor' : 'Attack';
      return `Draw ${value} random ${label} card${value === 1 ? '' : 's'}.`;
    }
    case 'spellPower':
      return `Spell power +${value} (spells only).`;
    case 'strength':
      return `Gain ${value} Strength this combat.`;
    case 'vulnerable':
      return `Apply Vulnerable for ${effect.duration ?? 2} turns.`;
    case 'weaken':
      return `Apply Weak for ${effect.duration ?? 2} turns (enemies deal 25% less).`;
    case 'energy':
      return `Gain ${value} Energy.`;
    case 'copyCard':
      return `Copy ${value} random card${value === 1 ? '' : 's'} into your draw pile.`;
    case 'shuffleCurse':
      return `Shuffle ${value} Nightmare into your deck.`;
    case 'doubleBuffs':
      return 'Double your current buffs.';
    case 'echo': {
      const from =
        effect.echoFrom === 'heal'
          ? 'Heal'
          : effect.echoFrom === 'block'
            ? 'gain Block'
            : 'deal damage';
      const to =
        effect.echoTo === 'heal'
          ? `Heal ${value}`
          : effect.echoTo === 'block'
            ? `gain ${value} Block`
            : `deal ${value} damage to a random enemy`;
      return `Whenever you ${from}, also ${to}.`;
    }
    case 'discardRandom':
      return `Discard ${value} card${value === 1 ? '' : 's'}.`;
    case 'discardDraw': {
      const d = effect.discardCount ?? value;
      const draw = effect.drawValue ?? value;
      return `Discard ${d}: Draw ${draw}.`;
    }
    case 'discardFor': {
      const d = effect.discardCount ?? 1;
      const bonus = effect.bonusPerDiscard ?? 0;
      const kind = effect.payoffKind ?? 'block';
      const payoff =
        kind === 'heal'
          ? `Heal ${value}`
          : kind === 'damage' || kind === 'randomDamage'
            ? `Deal ${value} damage`
            : `Gain ${value} Block`;
      return `Discard up to ${d} cards. ${payoff}${bonus ? ` + ${bonus} per discarded` : ''}.`;
    }
    case 'retrieveDiscard': {
      const mode = effect.retrieveMode ?? 'hand';
      if (mode === 'play') return 'Play a random card from your discard.';
      if (mode === 'top') return 'Put a random discard card on top of your draw pile.';
      return 'Add a random card from your discard to your hand.';
    }
    case 'thorns':
      return `Gain Thorns ${value} for ${effect.duration ?? 3} turns.`;
    default:
      return '';
  }
}

export function getCardDescription(card: CardDef, talents: Record<string, number>): string {
  const hasTalents = Object.values(talents).some((r) => r > 0);
  if (!hasTalents) return card.description;

  if (card.id === 'penance') {
    return 'Deal damage and Heal equal to half your current Block.';
  }
  if (card.id === 'ferocious_bite') {
    const dmg = modifyEffectValue(card.effects.find((e) => e.kind === 'damage')!, card, talents);
    const recoil = card.effects.find((e) => e.kind === 'recoil')?.value ?? 6;
    return `Deal ${dmg} damage (+10 if bleeding). Take ${recoil} recoil.`;
  }
  if (card.id === 'shadow_word_death') {
    const dmg = modifyEffectValue(card.effects.find((e) => e.kind === 'damage')!, card, talents);
    const recoil = card.effects.find((e) => e.kind === 'recoil')?.value ?? 5;
    return `Deal ${dmg} damage (+12 if below half HP). Take ${recoil} recoil.`;
  }

  const parts = card.effects
    .map((effect) => effectDescription(effect, card, talents))
    .filter(Boolean);
  return parts.length ? parts.join(' ') : card.description;
}

export function canAllocateTalent(
  talents: Record<string, number>,
  talentPoints: number,
  talentId: string,
): boolean {
  if (talentPoints <= 0) return false;
  const def = TALENTS[talentId];
  if (!def) return false;
  if (getTalentRank(talents, talentId) >= def.maxRanks) return false;
  if (!isTierUnlocked(talents, def)) return false;
  if (!isPrerequisiteMet(talents, def)) return false;
  return true;
}

export function allocateTalent(
  talents: Record<string, number>,
  talentId: string,
): Record<string, number> {
  const def = TALENTS[talentId];
  if (!def) return talents;
  const current = getTalentRank(talents, talentId);
  if (current >= def.maxRanks) return talents;
  return { ...talents, [talentId]: current + 1 };
}

/** Form → tree mapping for UI hints. */
export function treeForForm(form: Form): TalentTree {
  if (form === 'cat' || form === 'bear') return 'feral';
  if (form === 'tree') return 'resto';
  if (form === 'boomkin') return 'balance';
  if (form === 'holy') return 'holy';
  if (form === 'shadow') return 'shadow';
  return 'discipline';
}

/** Human-readable unlock hint for locked talents. */
export function talentUnlockHint(
  talents: Record<string, number>,
  talent: TalentDef,
): string {
  const parts: string[] = [];
  const needed = talent.tier * POINTS_PER_TIER;
  const spent = treePointsSpent(talents, talent.tree);
  if (spent < needed) {
    parts.push(`Requires ${needed} points in ${TALENT_TREE_LABELS[talent.tree]} (${spent}/${needed})`);
  }
  if (talent.requires) {
    const req = TALENTS[talent.requires];
    if (req && getTalentRank(talents, talent.requires) <= 0) {
      parts.push(`Requires ${req.name}`);
    }
  }
  return parts.join(' · ') || 'Locked';
}
