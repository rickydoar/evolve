import { talentTreesForClass } from './classes';
import { PRIEST_TALENTS } from './priestTalents';
import type {
  CardDef,
  CardEffect,
  ClassId,
  EffectKind,
  Form,
  TalentDef,
  TalentSpecial,
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
  feral: 'Tempo · Utility · Finishers',
  resto: 'HoTs · Utility · Throughput',
  balance: 'Free casts · Utility · Eclipse',
  holy: 'Sustain · Utility · Radiance',
  shadow: 'Leech · Utility · Detonate',
  discipline: 'Shields · Utility · Atonement',
};

/**
 * Three paths per tree: left sustain/tempo, center utility, right burst.
 * Center talents often have no prerequisite so any build can dip into utility.
 */
export const DRUID_TALENTS: Record<string, TalentDef> = {
  // ════════════════════════════════════════════════════════════════
  // FERAL — Cat & Bear
  // ════════════════════════════════════════════════════════════════

  feral_instinct: {
    id: 'feral_instinct',
    name: 'Feral Instinct',
    tree: 'feral',
    description: 'Cat and Bear cards deal +1 damage.',
    maxRanks: 2,
    tier: 0,
    column: 0,
    glyph: 'FI',
    modifiers: {
      forms: ['cat', 'bear'],
      effectKinds: ['damage', 'aoeDamage', 'damageOverTime'],
      damageBonus: 1,
    },
  },
  primal_awareness: {
    id: 'primal_awareness',
    name: 'Primal Awareness',
    tree: 'feral',
    description: 'Draw +1 card at combat start.',
    maxRanks: 1,
    tier: 0,
    column: 1,
    glyph: 'PA',
    modifiers: {
      specials: [{ type: 'combatStartDraw', draw: 1 }],
    },
  },
  thick_hide: {
    id: 'thick_hide',
    name: 'Thick Hide',
    tree: 'feral',
    description: 'Bear Block effects gain +2 Block.',
    maxRanks: 2,
    tier: 0,
    column: 2,
    glyph: 'TH',
    modifiers: {
      forms: ['bear'],
      effectKinds: ['block'],
      blockBonus: 2,
    },
  },

  predatory_strikes: {
    id: 'predatory_strikes',
    name: 'Predatory Strikes',
    tree: 'feral',
    description: 'Claw, Shred, and Rake deal +2 damage.',
    maxRanks: 2,
    tier: 1,
    column: 0,
    requires: 'feral_instinct',
    glyph: 'PS',
    modifiers: {
      cardIds: ['claw', 'shred', 'rake'],
      effectKinds: ['damage', 'damageOverTime'],
      damageBonus: 2,
    },
  },
  infected_wounds: {
    id: 'infected_wounds',
    name: 'Infected Wounds',
    tree: 'feral',
    description: 'Rake and Rip last 1 extra turn.',
    maxRanks: 1,
    tier: 1,
    column: 1,
    glyph: 'IW',
    modifiers: {
      specials: [
        { type: 'dotExtraDuration', cardIds: ['rake', 'rip'], extra: 1 },
      ],
    },
  },
  improved_swipe: {
    id: 'improved_swipe',
    name: 'Improved Swipe',
    tree: 'feral',
    description: 'Swipe deals +2 damage. After Bear damage, gain +2 Block.',
    maxRanks: 1,
    tier: 1,
    column: 2,
    requires: 'thick_hide',
    glyph: 'IS',
    modifiers: {
      cardIds: ['swipe'],
      effectKinds: ['aoeDamage'],
      damageBonus: 2,
      specials: [
        { type: 'damageGrantsBlock', forms: ['bear'], block: 2 },
      ],
    },
  },

  rending_assault: {
    id: 'rending_assault',
    name: 'Rending Assault',
    tree: 'feral',
    description: 'Shred Exhausts and draws 2 (instead of 1).',
    maxRanks: 1,
    tier: 2,
    column: 0,
    requires: 'predatory_strikes',
    glyph: 'RA',
    modifiers: {
      specials: [{ type: 'shredExhaustDraw', draw: 2 }],
    },
  },
  brutal_maul: {
    id: 'brutal_maul',
    name: 'Brutal Maul',
    tree: 'feral',
    description: 'Maul also applies Vulnerable for 2 turns.',
    maxRanks: 1,
    tier: 2,
    column: 1,
    glyph: 'BM',
    modifiers: {
      specials: [{ type: 'alsoVulnerable', cardIds: ['maul'], duration: 2 }],
    },
  },
  blood_frenzy: {
    id: 'blood_frenzy',
    name: 'Blood Frenzy',
    tree: 'feral',
    description: 'Ferocious Bite costs 0 while any enemy is bleeding.',
    maxRanks: 1,
    tier: 2,
    column: 2,
    glyph: 'BF',
    modifiers: {
      specials: [{ type: 'bleedBiteFree' }],
    },
  },

  jungle_guardian: {
    id: 'jungle_guardian',
    name: 'Jungle Guardian',
    tree: 'feral',
    description: 'Whenever you Exhaust a card, gain +4 Block.',
    maxRanks: 1,
    tier: 3,
    column: 0,
    requires: 'rending_assault',
    glyph: 'JG',
    modifiers: {
      specials: [{ type: 'exhaustGrantsBlock', block: 4 }],
    },
  },
  apex_predator: {
    id: 'apex_predator',
    name: 'Apex Predator',
    tree: 'feral',
    description: 'When you kill an enemy, draw 1 and heal +6.',
    maxRanks: 1,
    tier: 3,
    column: 1,
    glyph: 'AP',
    modifiers: {
      specials: [
        { type: 'killDraw', draw: 1 },
        { type: 'killHeal', heal: 6 },
      ],
    },
  },
  king_of_the_jungle: {
    id: 'king_of_the_jungle',
    name: 'King of the Jungle',
    tree: 'feral',
    description: 'Cat and Bear cards deal 20% more damage.',
    maxRanks: 1,
    tier: 3,
    column: 2,
    requires: 'blood_frenzy',
    glyph: 'KJ',
    modifiers: {
      forms: ['cat', 'bear'],
      effectKinds: ['damage', 'aoeDamage', 'damageOverTime'],
      damagePct: 20,
    },
  },

  // ════════════════════════════════════════════════════════════════
  // RESTORATION
  // ════════════════════════════════════════════════════════════════

  improved_healing_touch: {
    id: 'improved_healing_touch',
    name: 'Improved Healing Touch',
    tree: 'resto',
    description: 'Healing Touch heals +4.',
    maxRanks: 2,
    tier: 0,
    column: 0,
    glyph: 'HT',
    modifiers: {
      cardIds: ['healing_touch'],
      effectKinds: ['heal'],
      healBonus: 4,
    },
  },
  living_seedling: {
    id: 'living_seedling',
    name: 'Living Seedling',
    tree: 'resto',
    description: 'Draw +1 card at combat start.',
    maxRanks: 1,
    tier: 0,
    column: 1,
    glyph: 'LS',
    modifiers: {
      specials: [{ type: 'combatStartDraw', draw: 1 }],
    },
  },
  naturalist: {
    id: 'naturalist',
    name: 'Naturalist',
    tree: 'resto',
    description: 'Rejuvenation and Lifebloom heal +3 over their duration.',
    maxRanks: 2,
    tier: 0,
    column: 2,
    glyph: 'N',
    modifiers: {
      cardIds: ['rejuvenation', 'lifebloom'],
      effectKinds: ['healOverTime'],
      healBonus: 3,
    },
  },

  gift_of_the_wild: {
    id: 'gift_of_the_wild',
    name: 'Gift of the Wild',
    tree: 'resto',
    description: 'Rejuvenation also grants +2 Block each tick.',
    maxRanks: 1,
    tier: 1,
    column: 0,
    requires: 'improved_healing_touch',
    glyph: 'GW',
    modifiers: {
      specials: [
        { type: 'hotTickBlock', cardIds: ['rejuvenation'], blockPerTick: 2 },
      ],
    },
  },
  natural_ward: {
    id: 'natural_ward',
    name: 'Natural Ward',
    tree: 'resto',
    description: 'Decurse draws 1 card and gains +4 Block.',
    maxRanks: 1,
    tier: 1,
    column: 1,
    glyph: 'NW',
    modifiers: {
      cardIds: ['decurse'],
      effectKinds: ['block'],
      blockBonus: 4,
      specials: [{ type: 'playDraw', cardIds: ['decurse'], draw: 1 }],
    },
  },
  verdant_growth: {
    id: 'verdant_growth',
    name: 'Verdant Growth',
    tree: 'resto',
    description: 'Wild Growth gains +3 Block and +2 heal.',
    maxRanks: 1,
    tier: 1,
    column: 2,
    requires: 'naturalist',
    glyph: 'VG',
    modifiers: {
      cardIds: ['wild_growth'],
      blockBonus: 3,
      healBonus: 2,
    },
  },

  living_seed: {
    id: 'living_seed',
    name: 'Living Seed',
    tree: 'resto',
    description: 'Rejuvenation and Lifebloom last 1 extra turn.',
    maxRanks: 1,
    tier: 2,
    column: 0,
    requires: 'gift_of_the_wild',
    glyph: 'LD',
    modifiers: {
      specials: [
        {
          type: 'hotExtraDuration',
          cardIds: ['rejuvenation', 'lifebloom'],
          extra: 1,
        },
      ],
    },
  },
  natures_cure: {
    id: 'natures_cure',
    name: "Nature's Cure",
    tree: 'resto',
    description: 'Tree heals also remove all debuffs from you.',
    maxRanks: 1,
    tier: 2,
    column: 1,
    glyph: 'NC',
    modifiers: {
      specials: [{ type: 'cleanseOnPlay', forms: ['tree'] }],
    },
  },
  genesis: {
    id: 'genesis',
    name: 'Genesis',
    tree: 'resto',
    description: 'After you play a Tree heal, gain +3 Block.',
    maxRanks: 1,
    tier: 2,
    column: 2,
    requires: 'verdant_growth',
    glyph: 'GN',
    modifiers: {
      specials: [
        { type: 'healPlayGrantsBlock', forms: ['tree'], block: 3 },
      ],
    },
  },

  tree_of_life: {
    id: 'tree_of_life',
    name: 'Tree of Life',
    tree: 'resto',
    description: 'At the start of your turn, gain +3 Block per active HoT.',
    maxRanks: 1,
    tier: 3,
    column: 0,
    requires: 'living_seed',
    glyph: 'TL',
    modifiers: {
      specials: [{ type: 'blockPerHot', block: 3 }],
    },
  },
  tranquil_spirit: {
    id: 'tranquil_spirit',
    name: 'Tranquil Spirit',
    tree: 'resto',
    description: 'At the start of your turn, draw 1. Swiftmend costs 0.',
    maxRanks: 1,
    tier: 3,
    column: 1,
    requires: 'natures_cure',
    glyph: 'TS',
    modifiers: {
      specials: [
        { type: 'startTurnDraw', draw: 1 },
        { type: 'cardCostReduce', cardIds: ['swiftmend'], amount: 1 },
      ],
    },
  },
  wild_infusion: {
    id: 'wild_infusion',
    name: 'Wild Infusion',
    tree: 'resto',
    description: 'Tree-form heals and Block are 20% stronger.',
    maxRanks: 1,
    tier: 3,
    column: 2,
    requires: 'genesis',
    glyph: 'WI',
    modifiers: {
      forms: ['tree'],
      effectKinds: ['heal', 'healOverTime', 'block'],
      healPct: 20,
      blockPct: 20,
    },
  },

  // ════════════════════════════════════════════════════════════════
  // BALANCE
  // ════════════════════════════════════════════════════════════════

  wrath_of_elune: {
    id: 'wrath_of_elune',
    name: 'Wrath of Elune',
    tree: 'balance',
    description: 'Wrath and Starfire deal +2 damage.',
    maxRanks: 2,
    tier: 0,
    column: 0,
    glyph: 'WE',
    modifiers: {
      cardIds: ['wrath', 'starfire'],
      effectKinds: ['damage'],
      damageBonus: 2,
    },
  },
  celestial_focus: {
    id: 'celestial_focus',
    name: 'Celestial Focus',
    tree: 'balance',
    description: 'Draw +1 card at combat start.',
    maxRanks: 1,
    tier: 0,
    column: 1,
    glyph: 'CF',
    modifiers: {
      specials: [{ type: 'combatStartDraw', draw: 1 }],
    },
  },
  moonfury: {
    id: 'moonfury',
    name: 'Moonfury',
    tree: 'balance',
    description: 'Moonfire and Sunfire deal +2 damage.',
    maxRanks: 2,
    tier: 0,
    column: 2,
    glyph: 'MF',
    modifiers: {
      cardIds: ['moonfire', 'sunfire'],
      effectKinds: ['damage', 'aoeDamage', 'damageOverTime'],
      damageBonus: 2,
    },
  },

  improved_moonfire: {
    id: 'improved_moonfire',
    name: 'Improved Moonfire',
    tree: 'balance',
    description: 'Moonfire deals +2 damage and +2 over time.',
    maxRanks: 1,
    tier: 1,
    column: 0,
    requires: 'wrath_of_elune',
    glyph: 'IM',
    modifiers: {
      cardIds: ['moonfire'],
      damageBonus: 2,
    },
  },
  gale_force: {
    id: 'gale_force',
    name: 'Gale Force',
    tree: 'balance',
    description: 'Hurricane also applies Vulnerable for 2 turns.',
    maxRanks: 1,
    tier: 1,
    column: 1,
    glyph: 'GF',
    modifiers: {
      specials: [
        { type: 'alsoVulnerable', cardIds: ['hurricane'], duration: 2 },
      ],
    },
  },
  astral_power: {
    id: 'astral_power',
    name: 'Astral Power',
    tree: 'balance',
    description: 'Starsurge deals +3 damage.',
    maxRanks: 1,
    tier: 1,
    column: 2,
    requires: 'moonfury',
    glyph: 'AP',
    modifiers: {
      cardIds: ['starsurge'],
      effectKinds: ['damage'],
      damageBonus: 3,
    },
  },

  shooting_stars: {
    id: 'shooting_stars',
    name: 'Shooting Stars',
    tree: 'balance',
    description: 'Every 3rd Boomkin spell you play costs 0.',
    maxRanks: 1,
    tier: 2,
    column: 0,
    requires: 'improved_moonfire',
    glyph: 'SS',
    modifiers: {
      specials: [{ type: 'nthFormSpellFree', form: 'boomkin', every: 3 }],
    },
  },
  lunar_guidance: {
    id: 'lunar_guidance',
    name: 'Lunar Guidance',
    tree: 'balance',
    description: 'Gain +1 Energy at the start of each turn.',
    maxRanks: 1,
    tier: 2,
    column: 1,
    glyph: 'LG',
    modifiers: {
      specials: [{ type: 'startTurnEnergy', energy: 1 }],
    },
  },
  lunar_calling: {
    id: 'lunar_calling',
    name: 'Lunar Calling',
    tree: 'balance',
    description: 'Earth and Moon is no longer consumed by Wrath or Starfire.',
    maxRanks: 1,
    tier: 2,
    column: 2,
    requires: 'astral_power',
    glyph: 'LC',
    modifiers: {
      specials: [{ type: 'earthAndMoonPersistent' }],
    },
  },

  starfall_mastery: {
    id: 'starfall_mastery',
    name: 'Starfall Mastery',
    tree: 'balance',
    description: 'When a Boomkin spell costs 0 from Shooting Stars, draw 1.',
    maxRanks: 1,
    tier: 3,
    column: 0,
    requires: 'shooting_stars',
    glyph: 'SM',
    modifiers: {
      specials: [{ type: 'freeSpellDraw', draw: 1 }],
    },
  },
  astral_communion: {
    id: 'astral_communion',
    name: 'Astral Communion',
    tree: 'balance',
    description: 'At the start of your turn, draw 1. Starsurge costs 1 less.',
    maxRanks: 1,
    tier: 3,
    column: 1,
    requires: 'lunar_guidance',
    glyph: 'AC',
    modifiers: {
      specials: [
        { type: 'startTurnDraw', draw: 1 },
        { type: 'cardCostReduce', cardIds: ['starsurge'], amount: 1 },
      ],
    },
  },
  eclipse: {
    id: 'eclipse',
    name: 'Eclipse',
    tree: 'balance',
    description: 'Boomkin spells deal 20% more damage.',
    maxRanks: 1,
    tier: 3,
    column: 2,
    requires: 'lunar_calling',
    glyph: 'E',
    modifiers: {
      forms: ['boomkin'],
      effectKinds: ['damage', 'aoeDamage', 'damageOverTime'],
      damagePct: 20,
    },
  },
};

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
  if (mod.blockPct) pairs.push([mod.blockPct, mod.blockPct * scale]);

  for (const special of mod.specials ?? []) {
    switch (special.type) {
      case 'hotTickBlock':
        pairs.push([special.blockPerTick, special.blockPerTick * scale]);
        break;
      case 'exhaustGrantsBlock':
      case 'healPlayGrantsBlock':
      case 'blockPerHot':
        pairs.push([special.block, special.block * scale]);
        break;
      case 'dotTickHeal':
        pairs.push([special.heal, special.heal * scale]);
        break;
      case 'bleedKillEnergy':
      case 'startTurnEnergy':
        pairs.push([special.energy, special.energy * scale]);
        break;
      case 'blockCarryover':
        pairs.push([special.pct, special.pct * scale]);
        break;
      case 'combatStartDraw':
      case 'killDraw':
      case 'startTurnDraw':
      case 'playDraw':
      case 'freeSpellDraw':
      case 'shredExhaustDraw':
        pairs.push([special.draw, special.draw * scale]);
        break;
      case 'killHeal':
      case 'blockGainHeal':
        pairs.push([special.heal, special.heal * scale]);
        break;
      case 'startTurnBlock':
      case 'damageGrantsBlock':
        pairs.push([special.block, special.block * scale]);
        break;
      case 'cardCostReduce':
        pairs.push([special.amount, special.amount * scale]);
        break;
      default:
        break;
    }
  }

  // Larger bases first so e.g. +25 is not partially matched by +2.
  pairs.sort((a, b) => b[0] - a[0]);

  let desc = talent.description;
  for (const [base, total] of pairs) {
    desc = desc.replace(new RegExp(`\\+${base}\\b`, 'g'), `+${total}`);
    desc = desc.replace(new RegExp(`(?<!\\d)${base}%`, 'g'), `${total}%`);
  }
  return desc;
}

/** Iterate owned talent specials with rank scaling applied where relevant. */
export function forEachTalentSpecial(
  talents: Record<string, number>,
  fn: (special: TalentSpecial, ranks: number) => void,
): void {
  for (const talent of Object.values(TALENTS)) {
    const ranks = getTalentRank(talents, talent.id);
    if (ranks <= 0) continue;
    for (const special of talent.modifiers.specials ?? []) {
      fn(special, ranks);
    }
  }
}

export function hasTalentSpecial(
  talents: Record<string, number>,
  type: TalentSpecial['type'],
): boolean {
  let found = false;
  forEachTalentSpecial(talents, (special) => {
    if (special.type === type) found = true;
  });
  return found;
}

export function talentBlockCarryoverPct(talents: Record<string, number>): number {
  let pct = 0;
  forEachTalentSpecial(talents, (special, ranks) => {
    if (special.type === 'blockCarryover') {
      pct = Math.max(pct, special.pct * ranks);
    }
  });
  return Math.min(100, pct);
}

export function talentHotTickBlock(
  talents: Record<string, number>,
  hotName: string,
): number {
  let block = 0;
  forEachTalentSpecial(talents, (special, ranks) => {
    if (special.type !== 'hotTickBlock') return;
    for (const id of special.cardIds) {
      // Lazy import avoided — match against known card names via id convention in callers.
      if (hotNameMatchesCardId(hotName, id)) {
        block += special.blockPerTick * ranks;
      }
    }
  });
  return block;
}

/** Card display names used by regen statuses (card.name). */
const HOT_CARD_NAMES: Record<string, string> = {
  rejuvenation: 'Rejuvenation',
  lifebloom: 'Lifebloom',
  renew: 'Renew',
};

function hotNameMatchesCardId(hotName: string, cardId: string): boolean {
  return HOT_CARD_NAMES[cardId] === hotName || cardId === hotName;
}

export function talentHotExtraDuration(
  talents: Record<string, number>,
  cardId: string,
): number {
  let extra = 0;
  forEachTalentSpecial(talents, (special, ranks) => {
    if (special.type === 'hotExtraDuration' && special.cardIds.includes(cardId)) {
      extra += special.extra * ranks;
    }
  });
  return extra;
}

export function talentExhaustBlock(talents: Record<string, number>): number {
  let block = 0;
  forEachTalentSpecial(talents, (special, ranks) => {
    if (special.type === 'exhaustGrantsBlock') block += special.block * ranks;
  });
  return block;
}

export function talentShredExhaustDraw(talents: Record<string, number>): number | null {
  let draw: number | null = null;
  forEachTalentSpecial(talents, (special) => {
    if (special.type === 'shredExhaustDraw') draw = special.draw;
  });
  return draw;
}

export function talentDotTickHeal(talents: Record<string, number>): number {
  let healAmt = 0;
  forEachTalentSpecial(talents, (special, ranks) => {
    if (special.type === 'dotTickHeal') healAmt += special.heal * ranks;
  });
  return healAmt;
}

export function talentBleedKillEnergy(talents: Record<string, number>): number {
  let energy = 0;
  forEachTalentSpecial(talents, (special, ranks) => {
    if (special.type === 'bleedKillEnergy') energy += special.energy * ranks;
  });
  return energy;
}

export function talentBlockPerHot(talents: Record<string, number>): number {
  let block = 0;
  forEachTalentSpecial(talents, (special, ranks) => {
    if (special.type === 'blockPerHot') block += special.block * ranks;
  });
  return block;
}

export function talentHealPlayBlock(
  talents: Record<string, number>,
  card: CardDef,
): number {
  let block = 0;
  const isHealCard = card.effects.some(
    (e) => e.kind === 'heal' || e.kind === 'healOverTime',
  );
  if (!isHealCard) return 0;
  forEachTalentSpecial(talents, (special, ranks) => {
    if (special.type !== 'healPlayGrantsBlock') return;
    if (special.cardIds?.length && !special.cardIds.includes(card.id)) return;
    if (special.forms?.length && !special.forms.includes(card.form)) return;
    block += special.block * ranks;
  });
  return block;
}

export function talentNthFormSpellFree(
  talents: Record<string, number>,
  form: Form,
): number | null {
  let every: number | null = null;
  forEachTalentSpecial(talents, (special) => {
    if (special.type === 'nthFormSpellFree' && special.form === form) {
      every = special.every;
    }
  });
  return every;
}

export function talentFreeSpellDraw(talents: Record<string, number>): number {
  let draw = 0;
  forEachTalentSpecial(talents, (special) => {
    if (special.type === 'freeSpellDraw') draw += special.draw;
  });
  return draw;
}

export function talentCombatStartDraw(talents: Record<string, number>): number {
  let draw = 0;
  forEachTalentSpecial(talents, (special, ranks) => {
    if (special.type === 'combatStartDraw') draw += special.draw * ranks;
  });
  return draw;
}

export function talentKillDraw(talents: Record<string, number>): number {
  let draw = 0;
  forEachTalentSpecial(talents, (special, ranks) => {
    if (special.type === 'killDraw') draw += special.draw * ranks;
  });
  return draw;
}

export function talentKillHeal(talents: Record<string, number>): number {
  let healAmt = 0;
  forEachTalentSpecial(talents, (special, ranks) => {
    if (special.type === 'killHeal') healAmt += special.heal * ranks;
  });
  return healAmt;
}

export function talentStartTurnDraw(talents: Record<string, number>): number {
  let draw = 0;
  forEachTalentSpecial(talents, (special, ranks) => {
    if (special.type === 'startTurnDraw') draw += special.draw * ranks;
  });
  return draw;
}

export function talentStartTurnBlock(talents: Record<string, number>): number {
  let block = 0;
  forEachTalentSpecial(talents, (special, ranks) => {
    if (special.type === 'startTurnBlock') block += special.block * ranks;
  });
  return block;
}

export function talentStartTurnEnergy(talents: Record<string, number>): number {
  let energy = 0;
  forEachTalentSpecial(talents, (special, ranks) => {
    if (special.type === 'startTurnEnergy') energy += special.energy * ranks;
  });
  return energy;
}

export function talentBlockGainHeal(talents: Record<string, number>): number {
  let healAmt = 0;
  forEachTalentSpecial(talents, (special, ranks) => {
    if (special.type === 'blockGainHeal') healAmt += special.heal * ranks;
  });
  return healAmt;
}

export function talentDamageGrantsBlock(
  talents: Record<string, number>,
  card: CardDef,
): number {
  let block = 0;
  forEachTalentSpecial(talents, (special, ranks) => {
    if (special.type !== 'damageGrantsBlock') return;
    if (special.cardIds?.length && !special.cardIds.includes(card.id)) return;
    if (special.forms?.length && !special.forms.includes(card.form)) return;
    if (!special.cardIds?.length && !special.forms?.length) return;
    block += special.block * ranks;
  });
  return block;
}

export function talentCardCostReduce(
  talents: Record<string, number>,
  cardId: string,
): number {
  let reduce = 0;
  forEachTalentSpecial(talents, (special, ranks) => {
    if (special.type === 'cardCostReduce' && special.cardIds.includes(cardId)) {
      reduce += special.amount * ranks;
    }
  });
  return reduce;
}

export function talentDotExtraDuration(
  talents: Record<string, number>,
  cardId: string,
): number {
  let extra = 0;
  forEachTalentSpecial(talents, (special, ranks) => {
    if (special.type === 'dotExtraDuration' && special.cardIds.includes(cardId)) {
      extra += special.extra * ranks;
    }
  });
  return extra;
}

function cardMatchesSpecialFilter(
  card: CardDef,
  filter: { forms?: Form[]; cardIds?: string[] },
): boolean {
  if (filter.cardIds?.length) return filter.cardIds.includes(card.id);
  if (filter.forms?.length) return filter.forms.includes(card.form);
  return false;
}

export function talentCleanseOnPlay(
  talents: Record<string, number>,
  card: CardDef,
): boolean {
  const isHealCard = card.effects.some(
    (e) => e.kind === 'heal' || e.kind === 'healOverTime',
  );
  if (!isHealCard) return false;
  let yes = false;
  forEachTalentSpecial(talents, (special) => {
    if (special.type === 'cleanseOnPlay' && cardMatchesSpecialFilter(card, special)) {
      yes = true;
    }
  });
  return yes;
}

export function talentAlsoVulnerable(
  talents: Record<string, number>,
  cardId: string,
): number | null {
  let duration: number | null = null;
  forEachTalentSpecial(talents, (special) => {
    if (special.type === 'alsoVulnerable' && special.cardIds.includes(cardId)) {
      duration = special.duration;
    }
  });
  return duration;
}

/** Returns draw amount if this card play should draw from playDraw talents. */
export function talentPlayDrawAmount(
  talents: Record<string, number>,
  card: CardDef,
  alreadyDrewThisTurn: boolean,
): number {
  let draw = 0;
  forEachTalentSpecial(talents, (special, ranks) => {
    if (special.type !== 'playDraw') return;
    if (!cardMatchesSpecialFilter(card, special)) return;
    if (special.oncePerTurn && alreadyDrewThisTurn) return;
    draw += special.draw * ranks;
  });
  return draw;
}

export function talentBlockPct(
  talents: Record<string, number>,
  card: CardDef,
): number {
  let pct = 0;
  for (const talent of Object.values(TALENTS)) {
    const ranks = getTalentRank(talents, talent.id);
    if (ranks <= 0) continue;
    const mod = talent.modifiers;
    if (!mod.blockPct || !talentMatchesCard(mod, card)) continue;
    if (mod.effectKinds?.length && !mod.effectKinds.includes('block')) continue;
    pct += mod.blockPct * ranks;
  }
  return pct;
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
    const pct = talentBlockPct(talents, card);
    if (pct > 0) value = Math.floor(value * (1 + pct / 100));
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
    const dmg = modifyEffectValue(card.effects[0]!, card, talents);
    const exhaustDraw = talentShredExhaustDraw(talents);
    if (exhaustDraw != null) {
      return `Deal ${dmg} damage. Exhaust. Draw ${exhaustDraw}.`;
    }
    return `Deal ${dmg} damage. Draw 1 card.`;
  }
  if (card.id === 'ferocious_bite') {
    const dmg = modifyEffectValue(card.effects[0]!, card, talents);
    const free = hasTalentSpecial(talents, 'bleedBiteFree')
      ? ' Costs 0 while an enemy is bleeding.'
      : '';
    return `Deal ${dmg} damage. Deals +10 if the target is bleeding.${free}`;
  }
  if (card.id === 'rejuvenation') {
    const hot = modifyEffectValue(
      card.effects.find((e) => e.kind === 'healOverTime')!,
      card,
      talents,
    );
    const dur =
      (card.effects.find((e) => e.kind === 'healOverTime')?.duration ?? 3) +
      talentHotExtraDuration(talents, 'rejuvenation');
    const tickBlock = talentHotTickBlock(talents, 'Rejuvenation');
    const blockNote = tickBlock > 0 ? ` Also gain ${tickBlock} Block each tick.` : '';
    return `Heal ${hot} over ${dur} turns.${blockNote}`;
  }
  if (card.id === 'renew') {
    const hot = modifyEffectValue(
      card.effects.find((e) => e.kind === 'healOverTime')!,
      card,
      talents,
    );
    const dur = card.effects.find((e) => e.kind === 'healOverTime')?.duration ?? 3;
    const tickBlock = talentHotTickBlock(talents, 'Renew');
    const blockNote = tickBlock > 0 ? ` Also gain ${tickBlock} Block each tick.` : '';
    return `Heal ${hot} over ${dur} turns.${blockNote}`;
  }
  if (card.id === 'void_eruption') {
    const dmg = modifyEffectValue(
      card.effects.find((e) => e.kind === 'aoeDamage')!,
      card,
      talents,
    );
    const detonate = hasTalentSpecial(talents, 'voidDetonateDots')
      ? ' Detonate all DoTs for their remaining damage.'
      : '';
    return `Deal ${dmg} damage to ALL enemies.${detonate}`;
  }
  if (card.id === 'starsurge') {
    const dmg = modifyEffectValue(
      card.effects.find((e) => e.kind === 'damage')!,
      card,
      talents,
    );
    const persist = hasTalentSpecial(talents, 'earthAndMoonPersistent')
      ? ' Earth and Moon is not consumed.'
      : '';
    const costNote =
      talentCardCostReduce(talents, 'starsurge') > 0 ? ' Costs 1 less.' : '';
    return `Deal ${dmg} damage. Apply Earth and Moon: next Wrath or Starfire deals +50% damage.${persist}${costNote}`;
  }
  if (card.id === 'decurse') {
    const block = modifyEffectValue(
      card.effects.find((e) => e.kind === 'block')!,
      card,
      talents,
    );
    const drawNote =
      talentPlayDrawAmount(talents, card, false) > 0 ? ' Draw 1.' : '';
    return `Remove all debuffs from yourself. Gain ${block} Block.${drawNote}`;
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
    const dur =
      (card.effects.find((e) => e.kind === 'damageOverTime')?.duration ?? 3) +
      talentDotExtraDuration(talents, 'rake');
    return `Deal ${dmg} damage + ${dot} bleed over ${dur} turns.`;
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
    const vuln =
      talentAlsoVulnerable(talents, 'maul') != null
        ? ' Apply Vulnerable.'
        : '';
    return `Deal ${dmg} damage. Gain ${block} Block.${vuln}`;
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
    const costNote =
      talentCardCostReduce(talents, 'swiftmend') > 0 ? ' Costs 0.' : '';
    return `Heal ${heal}. Draw 1 card.${costNote}`;
  }
  if (card.id === 'lifebloom') {
    const heal = modifyEffectValue(
      card.effects.find((e) => e.kind === 'heal')!,
      card,
      talents,
    );
    const hotEffect = card.effects.find((e) => e.kind === 'healOverTime')!;
    const hot = modifyEffectValue(hotEffect, card, talents);
    const dur =
      (hotEffect.duration ?? 4) + talentHotExtraDuration(talents, 'lifebloom');
    return `Heal ${heal} now. Heal ${hot} over ${dur} turns.`;
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
    return 'Deal damage and Heal equal to half your current Block.';
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
    const costNote =
      talentCardCostReduce(talents, 'shadow_word_death') > 0 ? ' Costs 0.' : '';
    return `Deal ${dmg} damage. Deals +12 if the target is below half HP.${costNote}`;
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
