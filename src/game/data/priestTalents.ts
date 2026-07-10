import type { TalentDef } from './types';

/**
 * Priest talent trees: Holy (healing), Shadow (DPS), Discipline (shields + atonement).
 * Mirrors the Druid tree structure (tiers, prerequisites, capstones).
 */
export const PRIEST_TALENTS: Record<string, TalentDef> = {
  // ════════════════════════════════════════════════════════════════
  // HOLY — Healing
  // ════════════════════════════════════════════════════════════════

  improved_flash_heal: {
    id: 'improved_flash_heal',
    name: 'Improved Flash Heal',
    tree: 'holy',
    description: 'Flash Heal restores +6 health.',
    maxRanks: 3,
    tier: 0,
    column: 0,
    glyph: 'FH',
    modifiers: {
      cardIds: ['flash_heal'],
      healBonus: 6,
    },
  },
  divine_fury: {
    id: 'divine_fury',
    name: 'Divine Fury',
    tree: 'holy',
    description: 'Holy cards deal +4 damage.',
    maxRanks: 3,
    tier: 0,
    column: 2,
    glyph: 'DF',
    modifiers: {
      forms: ['holy'],
      effectKinds: ['damage', 'aoeDamage', 'damageOverTime'],
      damageBonus: 4,
    },
  },

  blessed_recovery: {
    id: 'blessed_recovery',
    name: 'Blessed Recovery',
    tree: 'holy',
    description: 'Renew and Prayer of Healing heal +8.',
    maxRanks: 3,
    tier: 1,
    column: 0,
    requires: 'improved_flash_heal',
    glyph: 'BR',
    modifiers: {
      cardIds: ['renew', 'prayer_of_healing'],
      healBonus: 8,
    },
  },
  holy_reach: {
    id: 'holy_reach',
    name: 'Holy Reach',
    tree: 'holy',
    description: 'Holy Nova deals +5 damage and heals +4.',
    maxRanks: 2,
    tier: 1,
    column: 1,
    glyph: 'HR',
    modifiers: {
      cardIds: ['holy_nova'],
      damageBonus: 5,
      healBonus: 4,
    },
  },
  searing_light: {
    id: 'searing_light',
    name: 'Searing Light',
    tree: 'holy',
    description: 'Holy Fire deals +6 damage.',
    maxRanks: 2,
    tier: 1,
    column: 2,
    requires: 'divine_fury',
    glyph: 'SL',
    modifiers: {
      cardIds: ['holy_fire'],
      damageBonus: 6,
    },
  },

  spirit_of_redemption: {
    id: 'spirit_of_redemption',
    name: 'Spirit of Redemption',
    tree: 'holy',
    description: 'All Holy heals restore +5.',
    maxRanks: 3,
    tier: 2,
    column: 0,
    requires: 'blessed_recovery',
    glyph: 'SR',
    modifiers: {
      forms: ['holy'],
      effectKinds: ['heal', 'healOverTime'],
      healBonus: 5,
    },
  },
  guardian_angel: {
    id: 'guardian_angel',
    name: 'Guardian Angel',
    tree: 'holy',
    description: 'Guardian Spirit gains +6 Block and +6 Heal.',
    maxRanks: 2,
    tier: 2,
    column: 2,
    glyph: 'GA',
    modifiers: {
      cardIds: ['guardian_spirit'],
      blockBonus: 6,
      healBonus: 6,
    },
  },

  circle_of_healing: {
    id: 'circle_of_healing',
    name: 'Circle of Healing',
    tree: 'holy',
    description: 'All Holy healing effects heal 25% more.',
    maxRanks: 1,
    tier: 3,
    column: 1,
    requires: 'spirit_of_redemption',
    glyph: 'CH',
    modifiers: {
      forms: ['holy'],
      effectKinds: ['heal', 'healOverTime'],
      healPct: 25,
    },
  },

  // ════════════════════════════════════════════════════════════════
  // SHADOW — Damage
  // ════════════════════════════════════════════════════════════════

  darkness: {
    id: 'darkness',
    name: 'Darkness',
    tree: 'shadow',
    description: 'Shadow cards deal +4 damage.',
    maxRanks: 3,
    tier: 0,
    column: 0,
    glyph: 'DK',
    modifiers: {
      forms: ['shadow'],
      effectKinds: ['damage', 'aoeDamage', 'damageOverTime'],
      damageBonus: 4,
    },
  },
  improved_mind_blast: {
    id: 'improved_mind_blast',
    name: 'Improved Mind Blast',
    tree: 'shadow',
    description: 'Mind Blast deals +6 damage.',
    maxRanks: 3,
    tier: 0,
    column: 2,
    glyph: 'MB',
    modifiers: {
      cardIds: ['mind_blast'],
      damageBonus: 6,
    },
  },

  shadow_weaving: {
    id: 'shadow_weaving',
    name: 'Shadow Weaving',
    tree: 'shadow',
    description: 'Shadow Word: Pain and Mind Flay deal +8 DoT.',
    maxRanks: 3,
    tier: 1,
    column: 0,
    requires: 'darkness',
    glyph: 'SW',
    modifiers: {
      cardIds: ['shadow_word_pain', 'mind_flay'],
      effectKinds: ['damageOverTime'],
      damageBonus: 8,
    },
  },
  improved_swd: {
    id: 'improved_swd',
    name: 'Improved Death',
    tree: 'shadow',
    description: 'Shadow Word: Death deals +8 damage.',
    maxRanks: 2,
    tier: 1,
    column: 1,
    glyph: 'SD',
    modifiers: {
      cardIds: ['shadow_word_death'],
      damageBonus: 8,
    },
  },
  psychic_horror: {
    id: 'psychic_horror',
    name: 'Psychic Horror',
    tree: 'shadow',
    description: 'Psychic Scream and Void Eruption deal +5 damage.',
    maxRanks: 2,
    tier: 1,
    column: 2,
    requires: 'improved_mind_blast',
    glyph: 'PH',
    modifiers: {
      cardIds: ['psychic_scream', 'void_eruption'],
      damageBonus: 5,
    },
  },

  vampiric_embrace: {
    id: 'vampiric_embrace',
    name: 'Vampiric Embrace',
    tree: 'shadow',
    description: 'Vampiric Touch heals +6 and deals +4 damage.',
    maxRanks: 2,
    tier: 2,
    column: 0,
    requires: 'shadow_weaving',
    glyph: 'VE',
    modifiers: {
      cardIds: ['vampiric_touch'],
      healBonus: 6,
      damageBonus: 4,
    },
  },
  shadow_power: {
    id: 'shadow_power',
    name: 'Shadow Power',
    tree: 'shadow',
    description: 'Gain +3 Spell Power at combat start (per rank).',
    maxRanks: 3,
    tier: 2,
    column: 2,
    glyph: 'SP',
    modifiers: {
      spellPowerBonus: 3,
    },
  },

  shadowform: {
    id: 'shadowform',
    name: 'Shadowform',
    tree: 'shadow',
    description: 'All Shadow damage is increased by 25%.',
    maxRanks: 1,
    tier: 3,
    column: 1,
    requires: 'vampiric_embrace',
    glyph: 'SF',
    modifiers: {
      forms: ['shadow'],
      effectKinds: ['damage', 'aoeDamage', 'damageOverTime'],
      damagePct: 25,
    },
  },

  // ════════════════════════════════════════════════════════════════
  // DISCIPLINE — Shields & Atonement
  // ════════════════════════════════════════════════════════════════

  twin_disciplines: {
    id: 'twin_disciplines',
    name: 'Twin Disciplines',
    tree: 'discipline',
    description: 'Discipline cards deal +3 damage and heal +3.',
    maxRanks: 3,
    tier: 0,
    column: 0,
    glyph: 'TD',
    modifiers: {
      forms: ['discipline'],
      effectKinds: ['damage', 'aoeDamage', 'heal', 'healOverTime'],
      damageBonus: 3,
      healBonus: 3,
    },
  },
  improved_shield: {
    id: 'improved_shield',
    name: 'Improved Shield',
    tree: 'discipline',
    description: 'Power Word: Shield gains +6 Block.',
    maxRanks: 3,
    tier: 0,
    column: 2,
    glyph: 'IS',
    modifiers: {
      cardIds: ['power_word_shield'],
      blockBonus: 6,
    },
  },

  meditation: {
    id: 'meditation',
    name: 'Meditation',
    tree: 'discipline',
    description: 'Smite and Penance deal +5 damage.',
    maxRanks: 3,
    tier: 1,
    column: 0,
    requires: 'twin_disciplines',
    glyph: 'MD',
    modifiers: {
      cardIds: ['smite', 'penance', 'atonement'],
      damageBonus: 5,
    },
  },
  divine_aegis: {
    id: 'divine_aegis',
    name: 'Divine Aegis',
    tree: 'discipline',
    description: 'Discipline Block effects gain +5 Block.',
    maxRanks: 3,
    tier: 1,
    column: 2,
    requires: 'improved_shield',
    glyph: 'DA',
    modifiers: {
      forms: ['discipline'],
      effectKinds: ['block'],
      blockBonus: 5,
    },
  },

  borrowed_time: {
    id: 'borrowed_time',
    name: 'Borrowed Time',
    tree: 'discipline',
    description: 'Pain Suppression and Radiance gain +6 Block.',
    maxRanks: 2,
    tier: 2,
    column: 0,
    requires: 'meditation',
    glyph: 'BT',
    modifiers: {
      cardIds: ['pain_suppression', 'power_word_radiance'],
      blockBonus: 6,
    },
  },
  grace: {
    id: 'grace',
    name: 'Grace',
    tree: 'discipline',
    description: 'Atonement and Penance heal +6.',
    maxRanks: 2,
    tier: 2,
    column: 2,
    requires: 'divine_aegis',
    glyph: 'GR',
    modifiers: {
      cardIds: ['atonement', 'penance'],
      healBonus: 6,
    },
  },

  evangelism: {
    id: 'evangelism',
    name: 'Evangelism',
    tree: 'discipline',
    description: 'Discipline damage and heals are 25% stronger. Shields +25%.',
    maxRanks: 1,
    tier: 3,
    column: 1,
    requires: 'borrowed_time',
    glyph: 'EV',
    modifiers: {
      forms: ['discipline'],
      effectKinds: ['damage', 'aoeDamage', 'heal', 'healOverTime', 'block'],
      damagePct: 25,
      healPct: 25,
    },
  },
};
