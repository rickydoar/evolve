import type { CardDef, CardEffect, EffectKind, Form, TalentDef, TalentTree } from './types';

export const TALENT_TREES: TalentTree[] = ['feral', 'resto', 'balance'];

export const TALENT_TREE_LABELS: Record<TalentTree, string> = {
  feral: 'Feral',
  resto: 'Restoration',
  balance: 'Balance',
};

export const TALENT_TREE_COLORS: Record<TalentTree, number> = {
  feral: 0xc9a227,
  resto: 0x3d9b6a,
  balance: 0x5b7cfa,
};

export const TALENT_TREE_BLURBS: Record<TalentTree, string> = {
  feral: 'Cat & Bear cards',
  resto: 'Healing & Decurse',
  balance: 'Boomkin spells',
};

export const TALENTS: Record<string, TalentDef> = {
  // ── Feral (cat / bear) ──────────────────────────────────────────
  predatory_strikes: {
    id: 'predatory_strikes',
    name: 'Predatory Strikes',
    tree: 'feral',
    description: 'Cat cards deal +5 damage.',
    maxRanks: 3,
    modifiers: {
      forms: ['cat'],
      effectKinds: ['damage', 'damageOverTime'],
      damageBonus: 5,
    },
  },
  brutal_maul: {
    id: 'brutal_maul',
    name: 'Brutal Maul',
    tree: 'feral',
    description: 'Maul deals +6 damage and gains +3 Block.',
    maxRanks: 2,
    modifiers: {
      cardIds: ['maul'],
      damageBonus: 6,
      blockBonus: 3,
    },
  },
  improved_swipe: {
    id: 'improved_swipe',
    name: 'Improved Swipe',
    tree: 'feral',
    description: 'Swipe deals +4 damage.',
    maxRanks: 2,
    modifiers: {
      cardIds: ['swipe'],
      effectKinds: ['aoeDamage'],
      damageBonus: 4,
    },
  },
  blood_in_the_water: {
    id: 'blood_in_the_water',
    name: 'Blood in the Water',
    tree: 'feral',
    description: 'Rip deals +15 damage over time.',
    maxRanks: 2,
    modifiers: {
      cardIds: ['rip'],
      effectKinds: ['damageOverTime'],
      damageBonus: 15,
    },
  },
  shredding_attacks: {
    id: 'shredding_attacks',
    name: 'Shredding Attacks',
    tree: 'feral',
    description: 'Shred deals +4 damage.',
    maxRanks: 2,
    modifiers: {
      cardIds: ['shred'],
      effectKinds: ['damage'],
      damageBonus: 4,
    },
  },

  // ── Restoration (heal / decurse) ────────────────────────────────
  improved_healing_touch: {
    id: 'improved_healing_touch',
    name: 'Improved Healing Touch',
    tree: 'resto',
    description: 'Healing Touch heals +12.',
    maxRanks: 3,
    modifiers: {
      cardIds: ['healing_touch'],
      effectKinds: ['heal'],
      healBonus: 12,
    },
  },
  gift_of_the_wild: {
    id: 'gift_of_the_wild',
    name: 'Gift of the Wild',
    tree: 'resto',
    description: 'Rejuvenation heals +25 over its duration.',
    maxRanks: 2,
    modifiers: {
      cardIds: ['rejuvenation'],
      effectKinds: ['healOverTime'],
      healBonus: 25,
    },
  },
  natural_ward: {
    id: 'natural_ward',
    name: 'Natural Ward',
    tree: 'resto',
    description: 'Decurse gains +8 Block.',
    maxRanks: 2,
    modifiers: {
      cardIds: ['decurse'],
      effectKinds: ['block'],
      blockBonus: 8,
    },
  },
  verdant_growth: {
    id: 'verdant_growth',
    name: 'Verdant Growth',
    tree: 'resto',
    description: 'Wild Growth gains +6 Block and +4 heal.',
    maxRanks: 2,
    modifiers: {
      cardIds: ['wild_growth'],
      blockBonus: 6,
      healBonus: 4,
    },
  },
  living_spirit: {
    id: 'living_spirit',
    name: 'Living Spirit',
    tree: 'resto',
    description: 'All healing effects heal 20% more.',
    maxRanks: 1,
    modifiers: {
      forms: ['tree'],
      effectKinds: ['heal', 'healOverTime'],
      healPct: 20,
    },
  },

  // ── Balance (spells) ────────────────────────────────────────────
  wrath_of_elune: {
    id: 'wrath_of_elune',
    name: 'Wrath of Elune',
    tree: 'balance',
    description: 'Wrath and Starfire deal +6 damage.',
    maxRanks: 3,
    modifiers: {
      cardIds: ['wrath', 'starfire'],
      effectKinds: ['damage'],
      damageBonus: 6,
    },
  },
  improved_moonfire: {
    id: 'improved_moonfire',
    name: 'Improved Moonfire',
    tree: 'balance',
    description: 'Moonfire deals +4 damage and +4 over time.',
    maxRanks: 2,
    modifiers: {
      cardIds: ['moonfire'],
      damageBonus: 4,
    },
  },
  gale_force: {
    id: 'gale_force',
    name: 'Gale Force',
    tree: 'balance',
    description: 'Hurricane deals +5 damage.',
    maxRanks: 2,
    modifiers: {
      cardIds: ['hurricane'],
      effectKinds: ['aoeDamage'],
      damageBonus: 5,
    },
  },
  astral_power: {
    id: 'astral_power',
    name: 'Astral Power',
    tree: 'balance',
    description: 'Starsurge deals +8 damage.',
    maxRanks: 2,
    modifiers: {
      cardIds: ['starsurge'],
      effectKinds: ['damage'],
      damageBonus: 8,
    },
  },
  lunar_guidance: {
    id: 'lunar_guidance',
    name: 'Lunar Guidance',
    tree: 'balance',
    description: 'Gain +3 Spell Power at the start of combat.',
    maxRanks: 3,
    modifiers: {
      spellPowerBonus: 3,
    },
  },
};

export const TALENTS_BY_TREE: Record<TalentTree, TalentDef[]> = {
  feral: Object.values(TALENTS).filter((t) => t.tree === 'feral'),
  resto: Object.values(TALENTS).filter((t) => t.tree === 'resto'),
  balance: Object.values(TALENTS).filter((t) => t.tree === 'balance'),
};

export function getTalentRank(talents: Record<string, number>, id: string): number {
  return talents[id] ?? 0;
}

export function totalTalentRanks(talents: Record<string, number>): number {
  return Object.values(talents).reduce((sum, n) => sum + n, 0);
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
  bonusField: 'damageBonus' | 'healBonus' | 'blockBonus',
): boolean {
  if (mod.effectKinds?.length) return mod.effectKinds.includes(kind);

  // Infer from which bonus fields are set when effectKinds omitted
  if (bonusField === 'damageBonus') {
    return kind === 'damage' || kind === 'aoeDamage' || kind === 'damageOverTime';
  }
  if (bonusField === 'healBonus') {
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
    // Moonfire: damageBonus applies to both damage and DoT when effectKinds omitted
    bonus += mod.damageBonus * ranks;
  }
  return bonus;
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

/** Spell power granted by talents at combat start. */
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
  }

  if (effect.kind === 'heal' || effect.kind === 'healOverTime') {
    value += talentHealBonus(talents, card, effect.kind);
    const pct = talentHealPct(talents, card, effect.kind);
    if (pct > 0) value = Math.floor(value * (1 + pct / 100));
  }

  if (effect.kind === 'block') {
    value += talentBlockBonus(talents, card);
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
        parts.push(`Spell power +${value}.`);
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
    return `Gain 8 Spell Power. Deal ${dmg} damage. Draw 2 cards.`;
  }
  if (card.id === 'mangle') {
    const dmg = modifyEffectValue(
      card.effects.find((e) => e.kind === 'damage')!,
      card,
      talents,
    );
    return `Deal ${dmg} damage. Apply Vulnerable (enemy takes 50% more damage).`;
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
  return getTalentRank(talents, talentId) < def.maxRanks;
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
  return 'balance';
}
