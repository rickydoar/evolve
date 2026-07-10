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
    return kind === 'damage' || kind === 'aoeDamage' || kind === 'damageOverTime';
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
    effect.kind === 'damageOverTime'
  ) {
    value += talentDamageBonus(talents, card, effect.kind);
    const pct = talentDamagePct(talents, card, effect.kind);
    if (pct > 0) value = Math.floor(value * (1 + pct / 100));
  }

  if (effect.kind === 'heal' || effect.kind === 'healOverTime') {
    value += talentHealBonus(talents, card, effect.kind);
    const pct = talentHealPct(talents, card, effect.kind);
    if (pct > 0) value = Math.floor(value * (1 + pct / 100));
  }

  if (effect.kind === 'block') {
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
export function getCardDescription(card: CardDef, talents: Record<string, number>): string {
  const hasTalents = Object.values(talents).some((r) => r > 0);
  if (!hasTalents) return card.description;

  // Rebuild from effects when we can; fall back to base description.
  const parts: string[] = [];
  for (const effect of card.effects) {
    const value = modifyEffectValue(effect, card, talents);
    switch (effect.kind) {
      case 'damage':
        parts.push(`Deal ${value} damage.`);
        break;
      case 'aoeDamage':
        if (effect.maxTargets) {
          parts.push(`Deal ${value} damage to up to ${effect.maxTargets} enemies.`);
        } else {
          parts.push(`Deal ${value} damage to ALL enemies.`);
        }
        break;
      case 'block':
        parts.push(`Gain ${value} Block.`);
        break;
      case 'heal':
        parts.push(`Heal ${value} health.`);
        break;
      case 'healOverTime':
        parts.push(`Heal ${value} health over ${effect.duration} turns.`);
        break;
      case 'damageOverTime':
        parts.push(`Deal ${value} damage over ${effect.duration} turns.`);
        break;
      case 'cleanse':
        parts.push('Remove all debuffs from yourself.');
        break;
      case 'earthAndMoon':
        parts.push(
          `Apply Earth and Moon: next Wrath or Starfire deals +${value}% damage.`,
        );
        break;
      case 'draw':
        parts.push(`Draw ${value} card${value === 1 ? '' : 's'}.`);
        break;
      case 'spellPower':
        parts.push(`Spell power +${value} (spells only).`);
        break;
      case 'strength':
        parts.push(`Gain ${value} Strength this combat.`);
        break;
      case 'vulnerable':
        parts.push(
          `Apply Vulnerable for ${effect.duration ?? 2} turns (enemy takes 50% more damage).`,
        );
        break;
      case 'energy':
        parts.push(`Gain ${value} Energy.`);
        break;
    }
  }

  // Special-case cards with hardcoded extra behavior
  if (card.id === 'shred') {
    return `Deal ${modifyEffectValue(card.effects[0]!, card, talents)} damage. Draw 1 card.`;
  }
  if (card.id === 'ferocious_bite') {
    const dmg = modifyEffectValue(card.effects[0]!, card, talents);
    return `Deal ${dmg} damage. Deals +10 if the target is bleeding.`;
  }
  if (card.id === 'decurse') {
    const block = modifyEffectValue(
      card.effects.find((e) => e.kind === 'block')!,
      card,
      talents,
    );
    return `Remove all debuffs from yourself. Gain ${block} Block.`;
  }
  if (card.id === 'starsurge') {
    const dmg = modifyEffectValue(
      card.effects.find((e) => e.kind === 'damage')!,
      card,
      talents,
    );
    return `Deal ${dmg} damage. Apply Earth and Moon: next Wrath or Starfire deals +50% damage.`;
  }
  if (card.id === 'moonfire') {
    const dmg = modifyEffectValue(
      card.effects.find((e) => e.kind === 'damage')!,
      card,
      talents,
    );
    const dot = modifyEffectValue(
      card.effects.find((e) => e.kind === 'damageOverTime')!,
      card,
      talents,
    );
    return `Deal ${dmg} damage + ${dot} over 3 turns.`;
  }
  if (card.id === 'rake') {
    const dmg = modifyEffectValue(
      card.effects.find((e) => e.kind === 'damage')!,
      card,
      talents,
    );
    const dot = modifyEffectValue(
      card.effects.find((e) => e.kind === 'damageOverTime')!,
      card,
      talents,
    );
    return `Deal ${dmg} damage + ${dot} bleed over 3 turns.`;
  }
  if (card.id === 'thrash') {
    const dmg = modifyEffectValue(
      card.effects.find((e) => e.kind === 'aoeDamage')!,
      card,
      talents,
    );
    const dot = modifyEffectValue(
      card.effects.find((e) => e.kind === 'damageOverTime')!,
      card,
      talents,
    );
    return `Deal ${dmg} damage to ALL enemies. Apply ${dot} bleed over 3 turns.`;
  }
  if (card.id === 'sunfire') {
    const dmg = modifyEffectValue(
      card.effects.find((e) => e.kind === 'aoeDamage')!,
      card,
      talents,
    );
    const dot = modifyEffectValue(
      card.effects.find((e) => e.kind === 'damageOverTime')!,
      card,
      talents,
    );
    return `Deal ${dmg} damage to ALL enemies + ${dot} burn over 3 turns to each.`;
  }
  if (card.id === 'maul') {
    const dmg = modifyEffectValue(
      card.effects.find((e) => e.kind === 'damage')!,
      card,
      talents,
    );
    const block = modifyEffectValue(
      card.effects.find((e) => e.kind === 'block')!,
      card,
      talents,
    );
    return `Deal ${dmg} damage. Gain ${block} Block.`;
  }
  if (card.id === 'barkskin') {
    const block = modifyEffectValue(
      card.effects.find((e) => e.kind === 'block')!,
      card,
      talents,
    );
    return `Gain ${block} Block.`;
  }
  if (card.id === 'wild_growth' || card.id === 'ironbark' || card.id === 'survival_instincts') {
    const block = modifyEffectValue(
      card.effects.find((e) => e.kind === 'block')!,
      card,
      talents,
    );
    const heal = modifyEffectValue(
      card.effects.find((e) => e.kind === 'heal')!,
      card,
      talents,
    );
    return `Gain ${block} Block. Heal ${heal}.`;
  }
  if (card.id === 'starfire') {
    const dmg = modifyEffectValue(
      card.effects.find((e) => e.kind === 'damage')!,
      card,
      talents,
    );
    return `Deal ${dmg} damage. Draw 1 card.`;
  }
  if (card.id === 'starfall') {
    const dmg = modifyEffectValue(
      card.effects.find((e) => e.kind === 'aoeDamage')!,
      card,
      talents,
    );
    return `Deal ${dmg} damage to ALL enemies. Draw 1 card.`;
  }
  if (card.id === 'swiftmend') {
    const heal = modifyEffectValue(
      card.effects.find((e) => e.kind === 'heal')!,
      card,
      talents,
    );
    return `Heal ${heal}. Draw 1 card.`;
  }
  if (card.id === 'lifebloom') {
    const heal = modifyEffectValue(
      card.effects.find((e) => e.kind === 'heal')!,
      card,
      talents,
    );
    const hot = modifyEffectValue(
      card.effects.find((e) => e.kind === 'healOverTime')!,
      card,
      talents,
    );
    return `Heal ${heal} now. Heal ${hot} over 4 turns.`;
  }
  if (card.id === 'tranquility') {
    const heal = modifyEffectValue(
      card.effects.find((e) => e.kind === 'heal')!,
      card,
      talents,
    );
    const block = modifyEffectValue(
      card.effects.find((e) => e.kind === 'block')!,
      card,
      talents,
    );
    return `Heal ${heal}. Gain ${block} Block. Remove all debuffs.`;
  }
  if (card.id === 'predatory_strike') {
    const dmg = modifyEffectValue(
      card.effects.find((e) => e.kind === 'damage')!,
      card,
      talents,
    );
    return `Deal ${dmg} damage. Draw 1. Gain 1 Energy.`;
  }
  if (card.id === 'incarnation') {
    const dmg = modifyEffectValue(
      card.effects.find((e) => e.kind === 'damage')!,
      card,
      talents,
    );
    return `Gain 8 Spell Power (spells only). Deal ${dmg} damage. Draw 2 cards.`;
  }
  if (card.id === 'mangle') {
    const dmg = modifyEffectValue(
      card.effects.find((e) => e.kind === 'damage')!,
      card,
      talents,
    );
    return `Deal ${dmg} damage. Apply Vulnerable (enemy takes 50% more damage).`;
  }
  if (card.id === 'celestial_alignment') {
    return 'Spell power +5 (spells only).';
  }

  // Priest special-cases
  if (card.id === 'penance') {
    const dmg = modifyEffectValue(
      card.effects.find((e) => e.kind === 'damage')!,
      card,
      talents,
    );
    const healAmt = modifyEffectValue(
      card.effects.find((e) => e.kind === 'heal')!,
      card,
      talents,
    );
    return `Deal ${dmg} damage. Heal ${healAmt}.`;
  }
  if (card.id === 'atonement') {
    const dmg = modifyEffectValue(
      card.effects.find((e) => e.kind === 'damage')!,
      card,
      talents,
    );
    const healAmt = modifyEffectValue(
      card.effects.find((e) => e.kind === 'heal')!,
      card,
      talents,
    );
    return `Deal ${dmg} damage. Heal ${healAmt}.`;
  }
  if (card.id === 'power_word_radiance' || card.id === 'guardian_spirit') {
    const block = modifyEffectValue(
      card.effects.find((e) => e.kind === 'block')!,
      card,
      talents,
    );
    const healAmt = modifyEffectValue(
      card.effects.find((e) => e.kind === 'heal')!,
      card,
      talents,
    );
    return `Gain ${block} Block. Heal ${healAmt}.`;
  }
  if (card.id === 'shadow_word_pain' || card.id === 'holy_fire') {
    const dmg = modifyEffectValue(
      card.effects.find((e) => e.kind === 'damage')!,
      card,
      talents,
    );
    const dot = modifyEffectValue(
      card.effects.find((e) => e.kind === 'damageOverTime')!,
      card,
      talents,
    );
    const suffix = card.id === 'holy_fire' ? 'burn' : '';
    return suffix
      ? `Deal ${dmg} damage + ${dot} ${suffix} over 3 turns.`
      : `Deal ${dmg} damage + ${dot} over 3 turns.`;
  }
  if (card.id === 'vampiric_touch') {
    const dmg = modifyEffectValue(
      card.effects.find((e) => e.kind === 'damage')!,
      card,
      talents,
    );
    const dot = modifyEffectValue(
      card.effects.find((e) => e.kind === 'damageOverTime')!,
      card,
      talents,
    );
    const healAmt = modifyEffectValue(
      card.effects.find((e) => e.kind === 'heal')!,
      card,
      talents,
    );
    return `Deal ${dmg} damage + ${dot} over 3 turns. Heal ${healAmt}.`;
  }
  if (card.id === 'shadow_word_death') {
    const dmg = modifyEffectValue(card.effects[0]!, card, talents);
    return `Deal ${dmg} damage. Deals +12 if the target is below half HP.`;
  }
  if (card.id === 'psychic_scream') {
    const dmg = modifyEffectValue(
      card.effects.find((e) => e.kind === 'aoeDamage')!,
      card,
      talents,
    );
    return `Deal ${dmg} damage to ALL enemies. Apply Vulnerable.`;
  }
  if (card.id === 'holy_nova') {
    const dmg = modifyEffectValue(
      card.effects.find((e) => e.kind === 'aoeDamage')!,
      card,
      talents,
    );
    const healAmt = modifyEffectValue(
      card.effects.find((e) => e.kind === 'heal')!,
      card,
      talents,
    );
    return `Deal ${dmg} damage to ALL enemies. Heal ${healAmt}.`;
  }
  if (card.id === 'prayer_of_healing') {
    const healAmt = modifyEffectValue(
      card.effects.find((e) => e.kind === 'heal')!,
      card,
      talents,
    );
    const block = modifyEffectValue(
      card.effects.find((e) => e.kind === 'block')!,
      card,
      talents,
    );
    return `Heal ${healAmt}. Gain ${block} Block.`;
  }
  if (card.id === 'holy_word_serenity') {
    const healAmt = modifyEffectValue(
      card.effects.find((e) => e.kind === 'heal')!,
      card,
      talents,
    );
    return `Heal ${healAmt}. Draw 1 card.`;
  }
  if (card.id === 'divine_hymn') {
    const healAmt = modifyEffectValue(
      card.effects.find((e) => e.kind === 'heal')!,
      card,
      talents,
    );
    const block = modifyEffectValue(
      card.effects.find((e) => e.kind === 'block')!,
      card,
      talents,
    );
    return `Heal ${healAmt}. Gain ${block} Block. Remove all debuffs.`;
  }
  if (card.id === 'purify' || card.id === 'dispersion') {
    const block = modifyEffectValue(
      card.effects.find((e) => e.kind === 'block')!,
      card,
      talents,
    );
    return card.id === 'dispersion'
      ? `Gain ${block} Block. Remove all debuffs.`
      : `Remove all debuffs from yourself. Gain ${block} Block.`;
  }
  if (card.id === 'shadowfiend') {
    const dmg = modifyEffectValue(
      card.effects.find((e) => e.kind === 'damage')!,
      card,
      talents,
    );
    return `Deal ${dmg} damage. Draw 1. Gain 1 Energy.`;
  }
  if (card.id === 'archangel') {
    const healAmt = modifyEffectValue(
      card.effects.find((e) => e.kind === 'heal')!,
      card,
      talents,
    );
    return `Gain 6 Spell Power. Heal ${healAmt}. Draw 1 card.`;
  }

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
