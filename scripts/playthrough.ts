/**
 * Headless Evolve playthrough harness.
 * Simulates full runs (Act 1 + Act 2) for each opening spec with
 * smart and random policies, then prints win-rate / card / difficulty stats.
 */
import {
  CARD_BUY_COST,
  CARD_REMOVE_BASE_COST,
  CARD_REMOVE_COST_STEP,
  CARDS,
  CURSE_CARD_ID,
  SKIP_GOLD_REWARD,
  SKIP_HEAL_REWARD,
  shopRerollCost,
} from '../src/game/data/cards.ts';
import {
  ITEMS,
  applyItemPickup,
  randomItemOffers,
} from '../src/game/data/items.ts';
import {
  advanceToBarrens,
  availableNodes,
  createRun,
  randomRewards,
  removeCardAt,
  usePotion,
} from '../src/game/data/run.ts';
import { TALENTS, allocateTalent, canAllocateTalent } from '../src/game/data/talents.ts';
import type {
  CardDef,
  ClassId,
  Form,
  MapNode,
  OpeningSpec,
  RunState,
  TalentTree,
} from '../src/game/data/types.ts';
import {
  applyEnemyTurnStep,
  beginPlayerTurn,
  canPlayCard,
  commitPendingDeckCards,
  endPlayerTurn,
  getCardPlayCost,
  playCard,
  playCardOnEnemy,
  startCombat,
  type CombatState,
} from '../src/game/systems/CombatSystem.ts';

type Policy = 'smart' | 'random' | 'onspec';

interface PlayStats {
  /** Total card plays across the run. */
  totalPlays: number;
  /** Plays per card id. */
  playCounts: Record<string, number>;
  /** Unique cards played at least once. */
  uniquePlayed: number;
  /** Sum of unique cards played each turn (for avg uniqueness). */
  uniquePerTurnSum: number;
  /** Number of player turns with ≥1 play. */
  turnsWithPlays: number;
  /** Consecutive play-pair counts ("a>b"). */
  comboCounts: Record<string, number>;
  /** Distinct consecutive pairs. */
  uniqueCombos: number;
}

interface RunResult {
  classId: ClassId;
  spec: OpeningSpec;
  policy: Policy;
  won: boolean;
  act: number;
  floor: number;
  victories: number;
  deathsAt: string;
  finalHp: number;
  deckSize: number;
  curses: number;
  cardsPicked: string[];
  cardsRemoved: string[];
  itemsPicked: string[];
  finalDeck: string[];
  finalItems: string[];
  path: string;
  talents: Record<string, number>;
  turnsFought: number;
  playStats: PlayStats;
}

interface Aggregate {
  runs: number;
  wins: number;
  act1Boss: number;
  act2Wins: number;
  avgVictories: number;
  deathBuckets: Record<string, number>;
  cardPickCounts: Record<string, number>;
  cardInWinDecks: Record<string, number>;
  winDeckAppearances: number;
}

const SPEC_PRIMARY_FORMS: Record<OpeningSpec, Form[]> = {
  feral: ['cat', 'bear'],
  boomkin: ['boomkin'],
  tree: ['tree'],
  holy: ['holy'],
  shadow: ['shadow'],
  discipline: ['discipline'],
  resto: ['resto'],
  enhance: ['enhance'],
  elemental: ['elemental'],
};

const SPEC_TREE: Record<OpeningSpec, TalentTree> = {
  feral: 'feral',
  boomkin: 'balance',
  tree: 'resto',
  holy: 'holy',
  shadow: 'shadow',
  discipline: 'discipline',
  resto: 'restoration',
  enhance: 'enhancement',
  elemental: 'elemental',
};

const ALL_CONFIGS: Array<{ classId: ClassId; spec: OpeningSpec }> = [
  { classId: 'druid', spec: 'feral' },
  { classId: 'druid', spec: 'boomkin' },
  { classId: 'druid', spec: 'tree' },
  { classId: 'priest', spec: 'holy' },
  { classId: 'priest', spec: 'shadow' },
  { classId: 'priest', spec: 'discipline' },
  { classId: 'shaman', spec: 'resto' },
  { classId: 'shaman', spec: 'enhance' },
  { classId: 'shaman', spec: 'elemental' },
];

function card(id: string): CardDef | undefined {
  return CARDS[id];
}

function countInDeck(deck: string[], id: string): number {
  return deck.filter((c) => c === id).length;
}

function incomingDamage(state: CombatState): number {
  let total = 0;
  for (const e of state.enemies) {
    if (e.hp <= 0 || !e.intent) continue;
    if (e.intent.type === 'attack' || e.intent.type === 'attack_debuff') {
      total += e.intent.value ?? 0;
    }
  }
  return total;
}

function livingEnemies(state: CombatState) {
  return state.enemies.filter((e) => e.hp > 0);
}

function lowestEnemy(state: CombatState) {
  const living = livingEnemies(state);
  living.sort((a, b) => a.hp - b.hp);
  return living[0];
}

function hasBleed(state: CombatState): boolean {
  return livingEnemies(state).some((e) => e.statuses.some((s) => s.kind === 'bleed'));
}

function playerMissingHp(state: CombatState): number {
  return state.player.maxHp - state.player.hp;
}

function formAffinity(spec: OpeningSpec, form: Form): number {
  const primary = SPEC_PRIMARY_FORMS[spec];
  if (primary.includes(form)) return 1.4;
  // Damage specs: only mild splash for defense
  if (spec === 'feral' || spec === 'boomkin' || spec === 'shadow') {
    if (form === 'bear' || form === 'discipline') return 0.7;
    if (form === 'tree' || form === 'holy') return 0.45;
    return 0.35;
  }
  // Sustain specs: splash damage forms freely
  if (spec === 'tree' || spec === 'holy') {
    if (form === 'bear' || form === 'cat' || form === 'boomkin' || form === 'shadow' || form === 'discipline')
      return 1.05;
    return 0.6;
  }
  // Discipline: holy splash ok, shadow less so
  if (form === 'holy') return 0.85;
  if (form === 'shadow') return 0.55;
  return 0.5;
}

function scoreCardForCombat(
  state: CombatState,
  cardId: string,
  handIndex: number,
  spec: OpeningSpec,
): number {
  const def = card(cardId);
  if (!def || def.unplayable || !canPlayCard(state, handIndex)) return -Infinity;

  const cost = getCardPlayCost(state, def);
  const incoming = incomingDamage(state);
  const block = state.player.block;
  const missing = playerMissingHp(state);
  const enemies = livingEnemies(state);
  const multi = enemies.length >= 2;
  const lethalTarget = lowestEnemy(state);
  let score = 10 * formAffinity(spec, def.form);

  // Prefer spending energy efficiently
  score += cost * 0.5;

  for (const fx of def.effects) {
    switch (fx.kind) {
      case 'damage':
      case 'randomDamage': {
        const dmg = fx.value + (cardId === 'ferocious_bite' && hasBleed(state) ? 10 : 0);
        score += dmg * 1.2;
        if (lethalTarget && dmg >= lethalTarget.hp) score += 40;
        break;
      }
      case 'aoeDamage':
        score += fx.value * enemies.length * 1.4;
        if (multi) score += 12;
        break;
      case 'damageOverTime':
        score += fx.value * 0.9 + (fx.duration ?? 1) * 2;
        break;
      case 'block':
        score += fx.value * (incoming > block ? 1.8 : 0.7);
        break;
      case 'heal':
        score += Math.min(fx.value, missing) * (missing > 20 ? 1.6 : 0.5);
        break;
      case 'healOverTime':
        score += Math.min(fx.value, missing) * 0.7;
        break;
      case 'echo':
        score += 28; // setup engines are huge
        break;
      case 'spellPower':
      case 'strength':
      case 'doubleBuffs':
      case 'earthAndMoon':
        score += 22;
        break;
      case 'thorns':
        score += incoming > 0 ? 30 : 8;
        break;
      case 'vulnerable':
      case 'weaken':
        score += 14;
        break;
      case 'draw':
      case 'drawTyped':
        score += 10;
        break;
      case 'energy':
        score += 18;
        break;
      case 'discardDraw':
        score += 12;
        break;
      case 'retrieveDiscard':
        score += fx.retrieveMode === 'play' ? 20 : 12;
        break;
      case 'copyCard':
        score += 8;
        break;
      case 'cleanse':
        score += state.player.statuses.some((s) =>
          ['vulnerable', 'weak', 'poison', 'bleed'].includes(s.kind),
        )
          ? 16
          : 2;
        break;
      case 'shuffleCurse':
        score -= 18;
        break;
      case 'recoil':
        score -= fx.value * 1.5;
        break;
      case 'discardRandom':
        score -= fx.value * 3;
        break;
      default:
        break;
    }
  }

  // Penance wants block first
  if (cardId === 'penance') {
    score += state.player.block * 1.5;
    if (state.player.block < 8) score -= 25;
  }

  // Survival when lethal incoming
  const netThreat = incoming - block;
  if (netThreat >= state.player.hp) {
    if (def.effects.some((e) => e.kind === 'block' || e.kind === 'heal' || e.kind === 'thorns')) {
      score += 50;
    }
  } else if (netThreat > 15 && missing > 25) {
    if (def.effects.some((e) => e.kind === 'block' || e.kind === 'heal')) score += 20;
  }

  // Don't overheal when healthy and enemies alive
  if (missing < 8 && def.effects.every((e) => e.kind === 'heal' || e.kind === 'healOverTime' || e.kind === 'discardRandom')) {
    score -= 30;
  }

  // Tree/Holy: bias toward damage until board is clearable
  if ((spec === 'tree' || spec === 'holy') && missing < 20) {
    if (def.effects.some((e) => ['damage', 'aoeDamage', 'damageOverTime', 'randomDamage'].includes(e.kind))) {
      score += 15;
    }
  }

  return score;
}

function emptyPlayStats(): PlayStats {
  return {
    totalPlays: 0,
    playCounts: {},
    uniquePlayed: 0,
    uniquePerTurnSum: 0,
    turnsWithPlays: 0,
    comboCounts: {},
    uniqueCombos: 0,
  };
}

function recordPlay(tracker: PlayStats, cardId: string, lastPlayed: { id: string | null }): void {
  tracker.totalPlays += 1;
  tracker.playCounts[cardId] = (tracker.playCounts[cardId] ?? 0) + 1;
  if (lastPlayed.id) {
    const key = `${lastPlayed.id}>${cardId}`;
    tracker.comboCounts[key] = (tracker.comboCounts[key] ?? 0) + 1;
  }
  lastPlayed.id = cardId;
}

function finalizePlayTurn(tracker: PlayStats, turnPlayed: Set<string>): void {
  if (!turnPlayed.size) return;
  tracker.turnsWithPlays += 1;
  tracker.uniquePerTurnSum += turnPlayed.size;
}

function playSmartTurn(state: CombatState, spec: OpeningSpec, tracker?: PlayStats): void {
  let safety = 40;
  const turnPlayed = new Set<string>();
  const lastPlayed = { id: null as string | null };
  while (state.phase === 'player' && safety-- > 0) {
    let bestIdx = -1;
    let bestScore = -Infinity;
    for (let i = 0; i < state.hand.length; i++) {
      const id = state.hand[i]!;
      const s = scoreCardForCombat(state, id, i, spec);
      if (s > bestScore) {
        bestScore = s;
        bestIdx = i;
      }
    }
    if (bestIdx < 0 || bestScore < -100) break;
    const playedId = state.hand[bestIdx]!;
    const def = card(playedId);
    if (!def) break;
    let ok = false;
    if (def.target === 'enemy') {
      const target = lowestEnemy(state);
      if (!target) break;
      ok = playCardOnEnemy(state, bestIdx, target.id);
    } else {
      ok = playCard(state, bestIdx);
    }
    if (!ok) break;
    turnPlayed.add(playedId);
    if (tracker) recordPlay(tracker, playedId, lastPlayed);
  }
  if (tracker) finalizePlayTurn(tracker, turnPlayed);
}

function playRandomTurn(state: CombatState, tracker?: PlayStats): void {
  let safety = 30;
  const turnPlayed = new Set<string>();
  const lastPlayed = { id: null as string | null };
  while (state.phase === 'player' && safety-- > 0) {
    const playable: number[] = [];
    for (let i = 0; i < state.hand.length; i++) {
      if (canPlayCard(state, i)) playable.push(i);
    }
    if (!playable.length) break;
    // Sometimes end early even with plays available
    if (Math.random() < 0.15) break;
    const idx = playable[Math.floor(Math.random() * playable.length)]!;
    const playedId = state.hand[idx]!;
    const def = card(playedId);
    if (!def) break;
    let ok = false;
    if (def.target === 'enemy') {
      const living = livingEnemies(state);
      if (!living.length) break;
      const target = living[Math.floor(Math.random() * living.length)]!;
      ok = playCardOnEnemy(state, idx, target.id);
    } else {
      ok = playCard(state, idx);
    }
    if (!ok) break;
    turnPlayed.add(playedId);
    if (tracker) recordPlay(tracker, playedId, lastPlayed);
  }
  if (tracker) finalizePlayTurn(tracker, turnPlayed);
}

function resolveEnemyTurn(state: CombatState): void {
  const steps = endPlayerTurn(state);
  for (const step of steps) {
    if (!applyEnemyTurnStep(state, step)) break;
  }
  if (state.phase === 'enemy') beginPlayerTurn(state);
}

function fightCombat(
  run: RunState,
  enemyIds: string[],
  policy: Policy,
  spec: OpeningSpec,
  tracker?: PlayStats,
): { won: boolean; turns: number } {
  const state = startCombat(run, enemyIds);
  let turns = 0;
  const maxTurns = 80;
  while (state.phase === 'player' || state.phase === 'enemy') {
    if (state.phase === 'player') {
      turns += 1;
      if (policy === 'smart') playSmartTurn(state, spec, tracker);
      else if (policy === 'onspec') playSmartTurn(state, spec, tracker);
      else playRandomTurn(state, tracker);
      if (state.phase === 'victory' || state.phase === 'defeat') break;
      resolveEnemyTurn(state);
    } else {
      beginPlayerTurn(state);
    }
    if (turns > maxTurns) {
      // Stalemate = loss
      state.phase = 'defeat';
      break;
    }
  }
  if (state.phase === 'victory') {
    run.hp = state.player.hp;
    commitPendingDeckCards(run, state);
    run.victories += 1;
    run.talentPoints += 1;
    run.shopRerollCount = 0;
    return { won: true, turns };
  }
  run.hp = state.player.hp;
  return { won: false, turns };
}

function scoreRewardCard(run: RunState, cardId: string, spec: OpeningSpec, policy: Policy = 'smart'): number {
  const def = card(cardId);
  if (!def) return -999;
  let score = 5 * formAffinity(spec, def.form);
  const copies = countInDeck(run.deck, cardId);

  if (policy === 'onspec') {
    const primary = SPEC_PRIMARY_FORMS[spec];
    if (!primary.includes(def.form)) {
      // Allow a little defensive splash only
      const defensive =
        def.effects.some((e) => e.kind === 'block' || e.kind === 'echo') &&
        (def.form === 'bear' || def.form === 'discipline' || def.form === 'tree' || def.form === 'holy');
      if (!defensive) score -= 40;
      else score -= 10;
    } else {
      score += 15;
    }
  }

  // Rarity baseline
  score += { common: 2, rare: 8, epic: 14, legendary: 10 }[def.rarity];

  // Engine / setup cards
  if (def.effects.some((e) => e.kind === 'echo')) score += 25;
  if (def.effects.some((e) => e.kind === 'spellPower' || e.kind === 'strength' || e.kind === 'doubleBuffs'))
    score += 18;
  if (def.effects.some((e) => e.kind === 'energy')) score += 16;
  if (def.effects.some((e) => e.kind === 'thorns')) score += 12;
  if (def.effects.some((e) => e.kind === 'shuffleCurse')) score -= 12;

  // Diminishing returns on duplicates of non-engines
  if (copies >= 2 && !def.effects.some((e) => e.kind === 'echo')) score -= 10 * copies;

  // Spec-specific staples
  const staples: Record<OpeningSpec, string[]> = {
    feral: ['mangle', 'tigers_fury', 'rake', 'ferocious_bite', 'ironfur', 'barkskin', 'thrash', 'predatory_strike', 'swipe', 'maul'],
    boomkin: ['moonfire', 'celestial_alignment', 'starsurge', 'starfire', 'sunfire', 'incarnation', 'starfall', 'innervate', 'thorns', 'hurricane'],
    tree: [
      'wild_growth',
      'barkskin',
      'ironbark',
      'innervate',
      'swiftmend',
      'lifebloom',
      'tranquility',
      'decurse',
      // Tree must splash damage or it stalls out
      'swipe',
      'thrash',
      'moonfire',
      'sunfire',
      'mangle',
      'starsurge',
      'wrath',
      'claw',
    ],
    holy: [
      'renew',
      'holy_fire',
      'guardian_spirit',
      'holy_word_serenity',
      'holy_nova',
      'purify',
      'divine_hymn',
      // Holy also needs kill power
      'smite',
      'atonement',
      'mind_blast',
      'shadow_word_pain',
      'psychic_scream',
    ],
    shadow: [
      'vampiric_touch',
      'psychic_scream',
      'void_eruption',
      'mind_flay',
      'dispersion',
      'shadowfiend',
      'shadow_word_pain',
      'shadow_word_death',
      'mind_blast',
    ],
    discipline: [
      'atonement',
      'power_word_shield',
      'penance',
      'power_infusion',
      'pain_suppression',
      'archangel',
      'power_word_radiance',
      'smite',
    ],
  };
  if (staples[spec].includes(cardId)) score += 20;

  // Tree/Holy: heavily value any real damage package
  if (spec === 'tree' || spec === 'holy') {
    const hasDmg = def.effects.some((e) =>
      ['damage', 'aoeDamage', 'damageOverTime', 'randomDamage'].includes(e.kind),
    );
    if (hasDmg) score += 18;
    // Pure heal without echo is only okay in moderation
    const healHeavy =
      def.effects.some((e) => e.kind === 'heal' || e.kind === 'healOverTime') &&
      !hasDmg &&
      !def.effects.some((e) => e.kind === 'echo');
    if (healHeavy && countInDeck(run.deck, cardId) + run.deck.filter((c) => {
      const d = card(c);
      return !!d?.effects.some((e) => e.kind === 'heal' || e.kind === 'healOverTime');
    }).length > 6) {
      score -= 20;
    }
  }

  // Heal-only cards are weaker for damage specs
  const isHealOnly =
    def.effects.every((e) =>
      ['heal', 'healOverTime', 'discardRandom', 'cleanse', 'drawTyped', 'block'].includes(e.kind),
    ) && !def.effects.some((e) => e.kind === 'echo' || e.kind === 'damage' || e.kind === 'aoeDamage');
  if (isHealOnly && (spec === 'feral' || spec === 'boomkin' || spec === 'shadow')) score -= 15;

  return score;
}

function pickReward(run: RunState, offers: string[], policy: Policy, spec: OpeningSpec): string | null {
  if (policy === 'random') {
    if (Math.random() < 0.2) return null; // skip
    return offers[Math.floor(Math.random() * offers.length)] ?? null;
  }
  let best: string | null = null;
  let bestScore = policy === 'onspec' ? 5 : 8;
  for (const id of offers) {
    const s = scoreRewardCard(run, id, spec, policy);
    if (s > bestScore) {
      bestScore = s;
      best = id;
    }
  }
  return best;
}

/** High-value engine items preferred by smart/onspec AI. */
const ENGINE_ITEMS = new Set([
  'ironpelt_totem',
  'verdant_lash',
  'shield_spike',
  'void_leech',
  'celestial_orb',
  'bloodfang_charm',
  'radiant_censer',
  'death_wish',
  'frenzy_claw',
  'thornwoven_cloak',
  'barkbreaker_seed',
  'swiftroot_charm',
  'pain_amplifier',
  'borrowed_timepiece',
  'astral_battery',
]);

const HIGH_GENERAL_ITEMS = new Set([
  'restless_mind',
  'war_paint',
  'crow_feather',
  'focus_band',
  'adrenaline_vial',
]);

const LOW_GENERAL_ITEMS = new Set(['lucky_coin', 'scavenger_pouch']);

/** Cards that synergize with a given item. */
const ITEM_SYNERGY_CARDS: Record<string, string[]> = {
  bloodfang_charm: ['rake', 'rip', 'ferocious_bite', 'thrash', 'swipe'],
  ironpelt_totem: ['ironfur', 'barkskin', 'maul', 'thrash', 'thick_hide'],
  thick_hide_wraps: ['ironfur', 'barkskin', 'maul', 'thrash', 'swipe'],
  frenzy_claw: ['shred', 'claw', 'tigers_fury', 'predatory_strike'],
  alpha_mark: ['mangle', 'rake', 'claw', 'shred', 'ferocious_bite'],
  celestial_orb: ['moonfire', 'starsurge', 'starfire', 'sunfire', 'celestial_alignment'],
  thornwoven_cloak: ['thorns', 'barkskin'],
  twin_star: ['wrath', 'starfire', 'starsurge'],
  hurricane_eye: ['hurricane', 'starfall', 'sunfire'],
  astral_battery: ['starfire', 'starsurge', 'hurricane', 'starfall', 'incarnation'],
  verdant_lash: ['lifebloom', 'renew', 'swiftmend', 'tranquility', 'wild_growth', 'rejuvenation'],
  lifebloom_crown: ['lifebloom', 'rejuvenation', 'wild_growth', 'regrowth'],
  grove_battery: ['lifebloom', 'swiftmend', 'wild_growth', 'nourish', 'tranquility'],
  barkbreaker_seed: ['barkskin', 'ironbark', 'wild_growth'],
  swiftroot_charm: ['lifebloom', 'swiftmend', 'wild_growth', 'nourish', 'tranquility'],
  radiant_censer: ['flash_heal', 'renew', 'prayer_of_healing', 'holy_word_serenity', 'guardian_spirit', 'divine_hymn'],
  serenity_bell: ['holy_word_serenity', 'divine_hymn', 'prayer_of_healing', 'guardian_spirit'],
  sacred_flame: ['holy_fire', 'holy_nova'],
  martyr_rosary: ['flash_heal', 'renew', 'prayer_of_healing', 'divine_hymn'],
  hymn_book: ['flash_heal', 'renew', 'holy_word_serenity', 'divine_hymn', 'holy_fire'],
  void_leech: ['shadow_word_pain', 'vampiric_touch', 'mind_flay', 'devouring_plague'],
  pain_amplifier: ['shadow_word_pain', 'vampiric_touch', 'devouring_plague'],
  scream_mask: ['psychic_scream', 'shadow_word_pain'],
  shadow_absorb: ['shadow_word_death', 'void_eruption', 'shadowfiend'],
  death_wish: ['shadow_word_death', 'void_eruption', 'mind_blast'],
  shield_spike: ['power_word_shield', 'power_word_radiance', 'pain_suppression'],
  penitent_brand: ['penance', 'smite', 'atonement'],
  borrowed_timepiece: ['power_word_shield', 'power_word_radiance', 'pain_suppression'],
  smite_echo: ['smite', 'penance', 'atonement', 'holy_fire'],
  radiance_loop: ['power_word_shield', 'power_word_radiance', 'pain_suppression'],
};

function scoreItemOffer(run: RunState, itemId: string, spec: OpeningSpec, policy: Policy): number {
  const def = ITEMS[itemId];
  if (!def) return -999;
  let score = 5;

  const isSpec = def.spec === spec;
  if (isSpec) score += policy === 'onspec' ? 28 : 18;
  else if (def.spec !== null) score -= 40; // wrong-spec (shouldn't appear)

  if (ENGINE_ITEMS.has(itemId)) score += 30;
  if (HIGH_GENERAL_ITEMS.has(itemId)) score += 22;
  if (LOW_GENERAL_ITEMS.has(itemId)) {
    score += run.gold < 40 ? 8 : -8;
  }

  score += { common: 2, rare: 10, epic: 16 }[def.rarity];

  const synergy = ITEM_SYNERGY_CARDS[itemId] ?? [];
  let synergyHits = 0;
  for (const cid of synergy) {
    synergyHits += countInDeck(run.deck, cid);
  }
  score += Math.min(24, synergyHits * 6);

  // Prefer unowned engines that match cards already in deck
  if (isSpec && synergyHits >= 2) score += 12;

  // Mild preference for combat engines over pure pickup gold when healthy on gold
  if (def.effects.every((e) => e.trigger === 'onPickup' && e.kind === 'gold')) {
    score += run.gold < 50 ? 6 : -10;
  }
  if (def.effects.every((e) => e.trigger === 'onPickup' && e.kind === 'potion')) {
    score += run.potions === 0 ? 10 : -4;
  }

  return score;
}

function pickItem(run: RunState, offers: string[], policy: Policy, spec: OpeningSpec): string | null {
  if (!offers.length) return null;
  if (policy === 'random') {
    return offers[Math.floor(Math.random() * offers.length)] ?? null;
  }
  // After 2 spec items, inject noise so runs don't vacuum every spec relic
  const specOwned = run.items.filter((id) => ITEMS[id]?.spec === spec).length;
  let best: string | null = null;
  let bestScore = -Infinity;
  for (const id of offers) {
    let s = scoreItemOffer(run, id, spec, policy);
    if (specOwned >= 2 && ITEMS[id]?.spec === spec) s -= 12;
    if (specOwned >= 2 && ITEMS[id]?.spec === null) s += 8;
    // Slight randomness so first-item commitment varies across runs
    s += Math.random() * 10;
    if (s > bestScore) {
      bestScore = s;
      best = id;
    }
  }
  return best;
}

function offerEliteItem(
  run: RunState,
  policy: Policy,
  spec: OpeningSpec,
  itemsPicked: string[],
): void {
  const offers = randomItemOffers(spec, run.items, 3);
  const chosen = pickItem(run, offers, policy, spec);
  if (!chosen) return;
  applyItemPickup(run, chosen);
  itemsPicked.push(chosen);
}

function applyRewardSkip(run: RunState, policy: Policy): void {
  if (policy === 'random') {
    const r = Math.random();
    if (r < 0.4) run.gold += SKIP_GOLD_REWARD;
    else if (r < 0.7) run.hp = Math.min(run.maxHp, run.hp + SKIP_HEAL_REWARD);
    else run.potions += 1;
    return;
  }
  if (run.hp / run.maxHp < 0.55) {
    run.hp = Math.min(run.maxHp, run.hp + SKIP_HEAL_REWARD);
  } else if (run.potions === 0 && run.hp / run.maxHp < 0.8) {
    run.potions += 1;
  } else {
    run.gold += SKIP_GOLD_REWARD;
  }
}

function spendTalents(run: RunState, policy: Policy, spec: OpeningSpec): void {
  const primary = SPEC_TREE[spec];
  while (run.talentPoints > 0) {
    const candidates = Object.values(TALENTS).filter((t) =>
      canAllocateTalent(run.talents, run.talentPoints, t.id),
    );
    if (!candidates.length) break;

    let pick: string;
    if (policy === 'random') {
      pick = candidates[Math.floor(Math.random() * candidates.length)]!.id;
    } else {
      // Prefer primary tree, then center utility columns, then anything
      candidates.sort((a, b) => {
        const pa = a.tree === primary ? 0 : policy === 'onspec' ? 2 : 1;
        const pb = b.tree === primary ? 0 : policy === 'onspec' ? 2 : 1;
        if (pa !== pb) return pa - pb;
        const score = (t: typeof a) => {
          let s = 0;
          const sp = t.modifiers?.specials ?? [];
          for (const x of sp) {
            if (x.type === 'combatStartDraw') s += 50;
            if (x.type === 'startTurnEnergy') s += 45;
            if (x.type === 'killDraw' || x.type === 'killHeal') s += 30;
            if (x.type === 'shredExhaustDraw') s += 35;
            if (x.type === 'blockCarryover') s += 28;
          }
          if (t.modifiers?.damageBonus) s += 20;
          if (t.modifiers?.damagePct) s += 25;
          if (t.modifiers?.spellPowerBonus) s += 22;
          if (t.column === 1) s += 3; // center often utility
          s += (3 - t.tier) * 2; // fill early tiers
          return s;
        };
        return score(b) - score(a);
      });
      pick = candidates[0]!.id;
    }
    run.talents = allocateTalent(run.talents, pick);
    run.talentPoints -= 1;
  }
}

function scoreRemoval(run: RunState, cardId: string, spec: OpeningSpec): number {
  if (cardId === CURSE_CARD_ID) return 1000;
  const def = card(cardId);
  if (!def) return 0;
  let score = 0;
  // Off-spec low-impact cards
  score += (1.2 - formAffinity(spec, def.form)) * 20;
  // Pure heals in damage decks
  if (
    (spec === 'feral' || spec === 'boomkin' || spec === 'shadow') &&
    def.effects.every((e) => ['heal', 'healOverTime', 'discardRandom'].includes(e.kind))
  ) {
    score += 40;
  }
  // Keep engines
  if (def.effects.some((e) => e.kind === 'echo')) score -= 80;
  if (def.rarity === 'legendary' || def.rarity === 'epic') score -= 30;
  // Duplicates of mediocre commons
  if (countInDeck(run.deck, cardId) >= 3) score += 25;
  return score;
}

function visitShop(run: RunState, policy: Policy, spec: OpeningSpec): void {
  // Remove curses / dead weight first
  let removeBudget = policy === 'random' ? 1 : 3;
  while (removeBudget-- > 0 && run.deck.length > 5) {
    const cost = CARD_REMOVE_BASE_COST + run.cardsRemoved * CARD_REMOVE_COST_STEP;
    if (run.gold < cost) break;
    let bestIdx = -1;
    let bestScore = policy === 'random' ? 0 : 25;
    for (let i = 0; i < run.deck.length; i++) {
      const id = run.deck[i]!;
      const s =
        policy === 'random'
          ? id === CURSE_CARD_ID
            ? 100
            : Math.random() * 10
          : scoreRemoval(run, id, spec);
      if (s > bestScore) {
        bestScore = s;
        bestIdx = i;
      }
    }
    if (bestIdx < 0) break;
    const removed = run.deck[bestIdx]!;
    removeCardAt(run, bestIdx);
    run.gold -= cost;
    run.cardsRemoved += 1;
    (run as RunState & { _removed?: string[] })._removed ??= [];
    ((run as RunState & { _removed?: string[] })._removed as string[]).push(removed);
  }

  // Buy up to 2 cards
  let offers = randomRewards(5, run.classId, run);
  let buys = 0;
  const maxBuys = policy === 'random' ? 1 : 2;
  while (buys < maxBuys) {
    let best: string | null = null;
    let bestScore = policy === 'random' ? 0 : 18;
    for (const id of offers) {
      const def = card(id);
      if (!def) continue;
      const cost = CARD_BUY_COST[def.rarity];
      if (run.gold < cost) continue;
      const s =
        policy === 'random'
          ? Math.random() * 30
          : scoreRewardCard(run, id, spec, policy) - cost * 0.15;
      if (s > bestScore) {
        bestScore = s;
        best = id;
      }
    }
    if (!best) {
      const rc = shopRerollCost(run.shopRerollCount);
      if (policy !== 'random' && run.gold >= rc + 40 && buys === 0) {
        run.gold -= rc;
        run.shopRerollCount += 1;
        offers = randomRewards(5, run.classId, run);
        continue;
      }
      break;
    }
    const def = card(best)!;
    run.gold -= CARD_BUY_COST[def.rarity];
    run.deck.push(best);
    offers = offers.filter((id) => id !== best);
    buys += 1;
  }
}

function nodePriority(run: RunState, node: MapNode, policy: Policy): number {
  if (policy === 'random') return Math.random();
  const hpRatio = run.hp / run.maxHp;
  switch (node.type) {
    case 'rest':
      return hpRatio < 0.7 ? 100 : 40;
    case 'shop':
      return run.deck.includes(CURSE_CARD_ID) || run.deck.length > 14 ? 90 : 55;
    case 'treasure':
      return 70;
    case 'combat':
      return hpRatio > 0.45 ? 60 : 30;
    case 'elite':
      return hpRatio > 0.65 && run.victories >= 2 ? 50 : 10;
    case 'boss':
      return 80;
    default:
      return 0;
  }
}

function chooseNode(run: RunState, policy: Policy): MapNode | null {
  const nodes = availableNodes(run);
  if (!nodes.length) return null;
  nodes.sort((a, b) => nodePriority(run, b, policy) - nodePriority(run, a, policy));
  return nodes[0] ?? null;
}

function deathLabel(run: RunState, node: MapNode | null): string {
  if (!node) return `act${run.act}-unknown`;
  return `act${run.act}-f${node.floor}-${node.type}`;
}

function deckHas(deck: string[], id: string, min = 1): boolean {
  return countInDeck(deck, id) >= min;
}

function deckCountAny(deck: string[], ids: string[]): number {
  return ids.reduce((n, id) => n + countInDeck(deck, id), 0);
}

function hasItem(items: string[], id: string): boolean {
  return items.includes(id);
}

/**
 * Detect the primary victory path from the first specialization item picked
 * (early commitment). Falls back to scored heuristics if no spec item yet.
 */
const SPEC_ITEM_PATH: Record<string, string> = {
  bloodfang_charm: 'bleed',
  ironpelt_totem: 'bear_wall',
  thick_hide_wraps: 'bear_wall',
  frenzy_claw: 'tempo',
  alpha_mark: 'tempo',
  celestial_orb: 'celestial',
  astral_battery: 'celestial',
  thornwoven_cloak: 'thorns',
  hurricane_eye: 'aoe',
  twin_star: 'twin_star',
  verdant_lash: 'verdant',
  lifebloom_crown: 'fortress',
  barkbreaker_seed: 'barkbreaker',
  swiftroot_charm: 'swiftroot',
  grove_battery: 'swiftroot',
  radiant_censer: 'radiant',
  sacred_flame: 'flame',
  serenity_bell: 'serenity',
  hymn_book: 'hymn',
  martyr_rosary: 'hymn',
  void_leech: 'leech',
  pain_amplifier: 'pain',
  death_wish: 'recoil',
  shadow_absorb: 'recoil',
  scream_mask: 'scream',
  shield_spike: 'spike',
  smite_echo: 'smite_echo',
  penitent_brand: 'penance',
  radiance_loop: 'radiance',
  borrowed_timepiece: 'radiance',
};

function detectPath(
  spec: OpeningSpec,
  items: string[],
  deck: string[],
  itemsPicked: string[] = [],
): string {
  for (const id of itemsPicked) {
    const path = SPEC_ITEM_PATH[id];
    if (path) return path;
  }
  for (const id of items) {
    const path = SPEC_ITEM_PATH[id];
    if (path) return path;
  }
  // Card-only fallbacks
  if (spec === 'feral') {
    if (deckCountAny(deck, ['rake', 'rip', 'ferocious_bite']) >= 3) return 'bleed';
    if (deckHas(deck, 'ironfur') && deckHas(deck, 'barkskin')) return 'bear_wall';
    if (deckCountAny(deck, ['shred']) >= 2) return 'tempo';
    return 'hybrid';
  }
  if (spec === 'boomkin') {
    if (deckHas(deck, 'celestial_alignment')) return 'celestial';
    if (deckHas(deck, 'thorns')) return 'thorns';
    return 'aoe';
  }
  if (spec === 'tree') {
    if (deckHas(deck, 'wild_growth')) return 'fortress';
    return 'verdant';
  }
  if (spec === 'holy') return 'radiant';
  if (spec === 'shadow') return 'pain';
  if (spec === 'discipline') return 'spike';
  return 'other';
}

/** Whether a run "attempted" a path (owned key item or enough key cards). */
function attemptedPath(spec: OpeningSpec, path: string, items: string[], deck: string[]): boolean {
  switch (spec) {
    case 'feral':
      if (path === 'bleed')
        return hasItem(items, 'bloodfang_charm') || deckCountAny(deck, ['rake', 'rip', 'ferocious_bite']) >= 2;
      if (path === 'bear_wall')
        return (
          hasItem(items, 'ironpelt_totem') ||
          hasItem(items, 'thick_hide_wraps') ||
          (deckHas(deck, 'ironfur') && deckHas(deck, 'barkskin'))
        );
      if (path === 'tempo')
        return hasItem(items, 'frenzy_claw') || deckCountAny(deck, ['shred']) >= 2;
      if (path === 'hybrid') return true;
      break;
    case 'boomkin':
      if (path === 'celestial')
        return hasItem(items, 'celestial_orb') || deckHas(deck, 'celestial_alignment');
      if (path === 'thorns')
        return hasItem(items, 'thornwoven_cloak') || deckHas(deck, 'thorns');
      if (path === 'aoe')
        return hasItem(items, 'hurricane_eye') || deckHas(deck, 'hurricane') || deckHas(deck, 'starfall');
      if (path === 'twin_star') return hasItem(items, 'twin_star');
      break;
    case 'tree':
      if (path === 'verdant') return hasItem(items, 'verdant_lash');
      if (path === 'fortress')
        return hasItem(items, 'lifebloom_crown') || deckCountAny(deck, ['barkskin', 'lifebloom']) >= 2;
      if (path === 'barkbreaker') return hasItem(items, 'barkbreaker_seed');
      if (path === 'swiftroot') return hasItem(items, 'swiftroot_charm');
      break;
    case 'holy':
      if (path === 'radiant') return hasItem(items, 'radiant_censer');
      if (path === 'flame')
        return hasItem(items, 'sacred_flame') || deckCountAny(deck, ['holy_fire', 'holy_nova']) >= 1;
      if (path === 'serenity') return hasItem(items, 'serenity_bell');
      if (path === 'hymn')
        return hasItem(items, 'hymn_book') || hasItem(items, 'martyr_rosary');
      break;
    case 'shadow':
      if (path === 'leech') return hasItem(items, 'void_leech');
      if (path === 'pain') return hasItem(items, 'pain_amplifier');
      if (path === 'recoil')
        return hasItem(items, 'death_wish') || hasItem(items, 'shadow_absorb');
      if (path === 'scream') return hasItem(items, 'scream_mask');
      break;
    case 'discipline':
      if (path === 'spike') return hasItem(items, 'shield_spike');
      if (path === 'smite_echo') return hasItem(items, 'smite_echo');
      if (path === 'penance') return hasItem(items, 'penitent_brand') || deckHas(deck, 'penance');
      if (path === 'radiance')
        return hasItem(items, 'radiance_loop') || hasItem(items, 'borrowed_timepiece');
      break;
  }
  return false;
}

const SPEC_PATHS: Record<OpeningSpec, string[]> = {
  feral: ['bleed', 'bear_wall', 'tempo', 'hybrid'],
  boomkin: ['celestial', 'thorns', 'aoe', 'twin_star'],
  tree: ['verdant', 'fortress', 'barkbreaker', 'swiftroot'],
  holy: ['radiant', 'flame', 'serenity', 'hymn'],
  shadow: ['leech', 'pain', 'recoil', 'scream'],
  discipline: ['spike', 'smite_echo', 'penance', 'radiance'],
};

function makeResult(
  run: RunState,
  classId: ClassId,
  spec: OpeningSpec,
  policy: Policy,
  won: boolean,
  deathsAt: string,
  floor: number,
  picked: string[],
  removed: string[],
  itemsPicked: string[],
  turnsFought: number,
  playStats: PlayStats,
): RunResult {
  const path = detectPath(spec, run.items, run.deck, itemsPicked);
  playStats.uniquePlayed = Object.keys(playStats.playCounts).length;
  playStats.uniqueCombos = Object.keys(playStats.comboCounts).length;
  return {
    classId,
    spec,
    policy,
    won,
    act: run.act,
    floor,
    victories: run.victories,
    deathsAt,
    finalHp: run.hp,
    deckSize: run.deck.length,
    curses: countInDeck(run.deck, CURSE_CARD_ID),
    cardsPicked: picked,
    cardsRemoved: removed,
    itemsPicked: [...itemsPicked],
    finalDeck: [...run.deck],
    finalItems: [...run.items],
    path,
    talents: { ...run.talents },
    turnsFought,
    playStats,
  };
}

function simulateRun(
  classId: ClassId,
  spec: OpeningSpec,
  policy: Policy,
  seedItemId?: string,
): RunResult {
  const run = createRun(classId, spec);
  const picked: string[] = [];
  const removed: string[] = [];
  const itemsPicked: string[] = [];
  const playStats = emptyPlayStats();
  let turnsFought = 0;
  let lastNode: MapNode | null = null;

  if (seedItemId) {
    applyItemPickup(run, seedItemId);
    itemsPicked.push(seedItemId);
  }

  const attachRemoved = () => {
    const extra = (run as RunState & { _removed?: string[] })._removed;
    if (extra?.length) {
      removed.push(...extra);
      (run as RunState & { _removed?: string[] })._removed = [];
    }
  };

  const finishFightRewards = (isBoss: boolean) => {
    if (!isBoss) {
      run.gold += 15;
      const offers = randomRewards(3, run.classId, run);
      const choice = pickReward(run, offers, policy, spec);
      if (choice) {
        run.deck.push(choice);
        picked.push(choice);
        // Maybe buy a second if great and affordable
        if (policy !== 'random') {
          for (const id of offers) {
            if (id === choice) continue;
            const def = card(id);
            if (!def) continue;
            const cost = CARD_BUY_COST[def.rarity];
            if (run.gold >= cost && scoreRewardCard(run, id, spec, policy) >= 35) {
              run.gold -= cost;
              run.deck.push(id);
              picked.push(id);
              break;
            }
          }
        }
      } else {
        applyRewardSkip(run, policy);
      }
    }
    spendTalents(run, policy, spec);
  };

  // Main loop across both acts
  for (let actPass = 0; actPass < 2; actPass++) {
    while (true) {
      // Potion if critically low before picking a fight
      if (policy !== 'random' && run.potions > 0 && run.hp / run.maxHp < 0.4) {
        usePotion(run);
      } else if (policy === 'random' && run.potions > 0 && Math.random() < 0.3) {
        usePotion(run);
      }

      const node = chooseNode(run, policy);
      if (!node) break;
      lastNode = node;
      run.currentNodeId = node.id;
      run.floor = node.floor;

      if (node.type === 'rest') {
        run.hp = Math.min(run.maxHp, run.hp + Math.floor(run.maxHp * 0.3));
        spendTalents(run, policy, spec);
        node.cleared = true;
        continue;
      }

      if (node.type === 'treasure') {
        run.gold += 40;
        const offers = randomRewards(3, run.classId, run);
        const choice = pickReward(run, offers, policy, spec);
        if (choice) {
          run.deck.push(choice);
          picked.push(choice);
        } else {
          applyRewardSkip(run, policy);
        }
        node.cleared = true;
        continue;
      }

      if (node.type === 'shop') {
        visitShop(run, policy, spec);
        attachRemoved();
        node.cleared = true;
        continue;
      }

      // Combat / elite / boss
      const result = fightCombat(run, node.enemyIds, policy, spec, playStats);
      turnsFought += result.turns;
      if (!result.won) {
        return makeResult(
          run,
          classId,
          spec,
          policy,
          false,
          deathLabel(run, node),
          node.floor,
          picked,
          removed,
          itemsPicked,
          turnsFought,
          playStats,
        );
      }

      node.cleared = true;
      if (node.type === 'boss') {
        // Bosses: card/talent rewards only — no item offers (elites only).
        finishFightRewards(true);
        if (run.act === 1) {
          advanceToBarrens(run);
          break; // next act
        }
        // Act 2 boss = win
        return makeResult(
          run,
          classId,
          spec,
          policy,
          true,
          'victory',
          node.floor,
          picked,
          removed,
          itemsPicked,
          turnsFought,
          playStats,
        );
      }

      // Elite spoils: pick an item before card rewards
      if (node.type === 'elite') {
        offerEliteItem(run, policy, spec, itemsPicked);
      }

      finishFightRewards(false);
    }
  }

  return makeResult(
    run,
    classId,
    spec,
    policy,
    false,
    deathLabel(run, lastNode),
    lastNode?.floor ?? 0,
    picked,
    removed,
    itemsPicked,
    turnsFought,
    playStats,
  );
}

function emptyAgg(): Aggregate {
  return {
    runs: 0,
    wins: 0,
    act1Boss: 0,
    act2Wins: 0,
    avgVictories: 0,
    deathBuckets: {},
    cardPickCounts: {},
    cardInWinDecks: {},
    winDeckAppearances: 0,
  };
}

interface PathStats {
  /** Wins whose detected primary path is this. */
  winPathCounts: Record<string, number>;
  /** Runs (win+loss) that attempted this path. */
  attempted: Record<string, number>;
  /** Wins among attempted runs. */
  attemptedWins: Record<string, number>;
  /** Item pick counts among smart/onspec. */
  itemPickCounts: Record<string, number>;
  /** Item presence in winning final inventories. */
  itemInWins: Record<string, number>;
  wins: number;
  runs: number;
}

function emptyPathStats(): PathStats {
  return {
    winPathCounts: {},
    attempted: {},
    attemptedWins: {},
    itemPickCounts: {},
    itemInWins: {},
    wins: 0,
    runs: 0,
  };
}

function ingestPathStats(ps: PathStats, r: RunResult): void {
  ps.runs += 1;
  if (r.won) {
    ps.wins += 1;
    ps.winPathCounts[r.path] = (ps.winPathCounts[r.path] ?? 0) + 1;
    for (const id of new Set(r.finalItems)) {
      ps.itemInWins[id] = (ps.itemInWins[id] ?? 0) + 1;
    }
  }
  for (const id of r.itemsPicked) {
    ps.itemPickCounts[id] = (ps.itemPickCounts[id] ?? 0) + 1;
  }
  for (const path of SPEC_PATHS[r.spec]) {
    if (attemptedPath(r.spec, path, r.finalItems, r.finalDeck)) {
      ps.attempted[path] = (ps.attempted[path] ?? 0) + 1;
      if (r.won) ps.attemptedWins[path] = (ps.attemptedWins[path] ?? 0) + 1;
    }
  }
}

function evaluateViablePaths(spec: OpeningSpec, ps: PathStats): {
  viable: string[];
  distribution: Record<string, { winShare: number; attemptWinRate: number; winCount: number; attempts: number }>;
  note: string;
} {
  const distribution: Record<
    string,
    { winShare: number; attemptWinRate: number; winCount: number; attempts: number }
  > = {};
  const viable = new Set<string>();

  for (const path of [...SPEC_PATHS[spec], 'other', 'hybrid']) {
    const winCount = ps.winPathCounts[path] ?? 0;
    if (!winCount && !(ps.attempted[path] ?? 0)) continue;
    const attempts = ps.attempted[path] ?? 0;
    const attemptWins = ps.attemptedWins[path] ?? 0;
    const winShare = ps.wins ? winCount / ps.wins : 0;
    const attemptWinRate = attempts ? attemptWins / attempts : 0;
    distribution[path] = { winShare, attemptWinRate, winCount, attempts };

    // Viable: >=15% of wins AND attempt win rate >=40%
    if (winShare >= 0.15 && attemptWinRate >= 0.4) viable.add(path);
  }

  // Alternate: among wins, >=2–3 distinct paths each representing >=12% of wins
  const bigPaths = Object.entries(ps.winPathCounts)
    .filter(([, n]) => ps.wins > 0 && n / ps.wins >= 0.12)
    .map(([p]) => p);
  if (bigPaths.length >= 2) {
    for (const p of bigPaths) viable.add(p);
  }

  const note =
    viable.size >= 2
      ? `${viable.size} viable paths`
      : viable.size === 1
        ? '1 viable path (narrow)'
        : 'no clear viable paths yet';

  return { viable: [...viable], distribution, note };
}

function ingest(agg: Aggregate, r: RunResult): void {
  agg.runs += 1;
  if (r.won) {
    agg.wins += 1;
    agg.act2Wins += 1;
    agg.winDeckAppearances += 1;
    for (const id of new Set(r.finalDeck)) {
      if (id === CURSE_CARD_ID) continue;
      agg.cardInWinDecks[id] = (agg.cardInWinDecks[id] ?? 0) + 1;
    }
  }
  if (r.act === 2 || r.won) agg.act1Boss += 1;
  agg.avgVictories += r.victories;
  agg.deathBuckets[r.deathsAt] = (agg.deathBuckets[r.deathsAt] ?? 0) + 1;
  for (const id of r.cardsPicked) {
    agg.cardPickCounts[id] = (agg.cardPickCounts[id] ?? 0) + 1;
  }
}

/** Shannon entropy of a count map (bits). */
function shannonEntropy(counts: Record<string, number>): number {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (!total) return 0;
  let h = 0;
  for (const n of Object.values(counts)) {
    if (!n) continue;
    const p = n / total;
    h -= p * Math.log2(p);
  }
  return h;
}

function topShare(counts: Record<string, number>, k: number): number {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (!total) return 0;
  const top = Object.values(counts)
    .sort((a, b) => b - a)
    .slice(0, k);
  return top.reduce((a, b) => a + b, 0) / total;
}

interface DynamicsBucket {
  runs: number;
  wins: number;
  totalPlays: number;
  playCounts: Record<string, number>;
  comboCounts: Record<string, number>;
  uniquePlayedSum: number;
  uniquePerTurnSum: number;
  turnsWithPlays: number;
  uniqueCombosSum: number;
  uniqueDeckSum: number;
  deckSizeSum: number;
  avgVictoriesSum: number;
  /** How often the same top-played card is #1 across runs (repetition of "main card"). */
  topCardVotes: Record<string, number>;
}

function emptyDynamics(): DynamicsBucket {
  return {
    runs: 0,
    wins: 0,
    totalPlays: 0,
    playCounts: {},
    comboCounts: {},
    uniquePlayedSum: 0,
    uniquePerTurnSum: 0,
    turnsWithPlays: 0,
    uniqueCombosSum: 0,
    uniqueDeckSum: 0,
    deckSizeSum: 0,
    avgVictoriesSum: 0,
    topCardVotes: {},
  };
}

function ingestDynamics(d: DynamicsBucket, r: RunResult): void {
  d.runs += 1;
  if (r.won) d.wins += 1;
  d.totalPlays += r.playStats.totalPlays;
  d.uniquePlayedSum += r.playStats.uniquePlayed;
  d.uniquePerTurnSum += r.playStats.uniquePerTurnSum;
  d.turnsWithPlays += r.playStats.turnsWithPlays;
  d.uniqueCombosSum += r.playStats.uniqueCombos;
  d.uniqueDeckSum += new Set(r.finalDeck.filter((id) => id !== CURSE_CARD_ID)).size;
  d.deckSizeSum += r.deckSize;
  d.avgVictoriesSum += r.victories;
  for (const [id, n] of Object.entries(r.playStats.playCounts)) {
    d.playCounts[id] = (d.playCounts[id] ?? 0) + n;
  }
  for (const [id, n] of Object.entries(r.playStats.comboCounts)) {
    d.comboCounts[id] = (d.comboCounts[id] ?? 0) + n;
  }
  const top = topEntries(r.playStats.playCounts, 1)[0];
  if (top) d.topCardVotes[top[0]] = (d.topCardVotes[top[0]] ?? 0) + 1;
}

interface DynamicsReport {
  key: string;
  runs: number;
  winRate: number;
  avgVictories: number;
  /** Higher = more varied card mix across the run. */
  playEntropy: number;
  /** Share of all plays that are the top 3 cards (higher = more repetitive). */
  top3Share: number;
  /** Avg distinct cards played per player turn. */
  avgUniquePerTurn: number;
  /** Avg distinct cards played across the whole run. */
  avgUniquePlayed: number;
  /** Avg distinct consecutive play-pairs. */
  avgUniqueCombos: number;
  /** Combo entropy (higher = more varied sequencing). */
  comboEntropy: number;
  /** Share of runs whose #1 played card is the modal #1 (higher = same main card). */
  mainCardConsensus: number;
  /** Avg unique non-curse cards in final deck. */
  avgUniqueDeck: number;
  topPlays: Array<[string, number]>;
  topCombos: Array<[string, number]>;
  /** Composite: high entropy + unique/turn + combos − top3 − consensus. */
  dynamismScore: number;
  /** Inverse of dynamism (for ranking repetitive). */
  repetitionScore: number;
  /** Rough simplicity: high top3 + consensus + low unique/turn. */
  simplicityScore: number;
}

function reportDynamics(key: string, d: DynamicsBucket): DynamicsReport {
  const playEntropy = shannonEntropy(d.playCounts);
  const comboEntropy = shannonEntropy(d.comboCounts);
  const top3Share = topShare(d.playCounts, 3);
  const avgUniquePerTurn = d.turnsWithPlays ? d.uniquePerTurnSum / d.turnsWithPlays : 0;
  const avgUniquePlayed = d.runs ? d.uniquePlayedSum / d.runs : 0;
  const avgUniqueCombos = d.runs ? d.uniqueCombosSum / d.runs : 0;
  const avgUniqueDeck = d.runs ? d.uniqueDeckSum / d.runs : 0;
  const winRate = d.runs ? d.wins / d.runs : 0;
  const avgVictories = d.runs ? d.avgVictoriesSum / d.runs : 0;
  const topVote = topEntries(d.topCardVotes, 1)[0];
  const mainCardConsensus = topVote && d.runs ? topVote[1] / d.runs : 0;

  // Normalize-ish composite scores (relative ranking within a batch is what matters).
  const dynamismScore =
    playEntropy * 12 +
    comboEntropy * 6 +
    avgUniquePerTurn * 18 +
    avgUniquePlayed * 1.2 +
    avgUniqueCombos * 0.15 -
    top3Share * 40 -
    mainCardConsensus * 25;
  const repetitionScore =
    top3Share * 50 + mainCardConsensus * 35 - playEntropy * 8 - avgUniquePerTurn * 12;
  const simplicityScore =
    top3Share * 40 +
    mainCardConsensus * 30 +
    (3.5 - Math.min(avgUniquePerTurn, 3.5)) * 15 -
    avgUniqueDeck * 0.8;

  return {
    key,
    runs: d.runs,
    winRate,
    avgVictories,
    playEntropy,
    top3Share,
    avgUniquePerTurn,
    avgUniquePlayed,
    avgUniqueCombos,
    comboEntropy,
    mainCardConsensus,
    avgUniqueDeck,
    topPlays: topEntries(d.playCounts, 8),
    topCombos: topEntries(d.comboCounts, 6),
    dynamismScore,
    repetitionScore,
    simplicityScore,
  };
}

function pct(n: number, d: number): string {
  if (!d) return '0%';
  return `${((100 * n) / d).toFixed(1)}%`;
}

function topEntries(map: Record<string, number>, n: number): Array<[string, number]> {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

async function main(): Promise<void> {
  const smartRuns = Number(process.env.SMART_RUNS ?? 40);
  const randomRuns = Number(process.env.RANDOM_RUNS ?? 40);
  const onspecRuns = Number(process.env.ONSPEC_RUNS ?? 40);

  console.log(`=== Evolve Playthrough Sim ===`);
  console.log(
    `Smart runs/spec: ${smartRuns} | On-spec: ${onspecRuns} | Random: ${randomRuns}\n`,
  );

  const smartAggs = new Map<string, Aggregate>();
  const onspecAggs = new Map<string, Aggregate>();
  const randomAggs = new Map<string, Aggregate>();
  /** Combined smart+onspec path stats per spec key (for viability). */
  const pathStatsBySpec = new Map<string, PathStats>();
  /** Play-feel dynamics: smart+onspec combined per spec. */
  const dynamicsBySpec = new Map<string, DynamicsBucket>();
  /** Play-feel dynamics: smart+onspec per spec/path. */
  const dynamicsByPath = new Map<string, DynamicsBucket>();
  const globalCardPicks: Record<string, number> = {};
  const globalCardSeenInWins: Record<string, number> = {};
  let winRuns = 0;

  const cardWinPick: Record<string, number> = {};
  const cardLossPick: Record<string, number> = {};

  // Also track per-card presence in final decks for wins vs losses
  const cardInWin: Record<string, number> = {};
  const cardInLoss: Record<string, number> = {};
  let winDeckN = 0;
  let lossDeckN = 0;

  const trackDynamics = (result: RunResult) => {
    const specKey = `${result.classId}/${result.spec}`;
    if (!dynamicsBySpec.has(specKey)) dynamicsBySpec.set(specKey, emptyDynamics());
    ingestDynamics(dynamicsBySpec.get(specKey)!, result);
    const pathKey = `${specKey}/${result.path}`;
    if (!dynamicsByPath.has(pathKey)) dynamicsByPath.set(pathKey, emptyDynamics());
    ingestDynamics(dynamicsByPath.get(pathKey)!, result);
  };

  for (const { classId, spec } of ALL_CONFIGS) {
    const key = `${classId}/${spec}`;
    const sAgg = emptyAgg();
    const oAgg = emptyAgg();
    const rAgg = emptyAgg();
    const pathStats = emptyPathStats();

    for (let i = 0; i < smartRuns; i++) {
      const result = simulateRun(classId, spec, 'smart');
      ingest(sAgg, result);
      ingestPathStats(pathStats, result);
      trackDynamics(result);
      for (const id of result.cardsPicked) {
        globalCardPicks[id] = (globalCardPicks[id] ?? 0) + 1;
        if (result.won) cardWinPick[id] = (cardWinPick[id] ?? 0) + 1;
        else cardLossPick[id] = (cardLossPick[id] ?? 0) + 1;
      }
      const unique = new Set(result.finalDeck);
      if (result.won) {
        winRuns += 1;
        winDeckN += 1;
        for (const id of unique) {
          if (id === CURSE_CARD_ID) continue;
          globalCardSeenInWins[id] = (globalCardSeenInWins[id] ?? 0) + 1;
          cardInWin[id] = (cardInWin[id] ?? 0) + 1;
        }
      } else {
        lossDeckN += 1;
        for (const id of unique) {
          if (id === CURSE_CARD_ID) continue;
          cardInLoss[id] = (cardInLoss[id] ?? 0) + 1;
        }
      }
    }

    for (let i = 0; i < onspecRuns; i++) {
      const result = simulateRun(classId, spec, 'onspec');
      ingest(oAgg, result);
      ingestPathStats(pathStats, result);
      trackDynamics(result);
    }

    for (let i = 0; i < randomRuns; i++) {
      ingest(rAgg, simulateRun(classId, spec, 'random'));
    }

    sAgg.avgVictories /= Math.max(1, sAgg.runs);
    oAgg.avgVictories /= Math.max(1, oAgg.runs);
    rAgg.avgVictories /= Math.max(1, rAgg.runs);
    smartAggs.set(key, sAgg);
    onspecAggs.set(key, oAgg);
    randomAggs.set(key, rAgg);
    pathStatsBySpec.set(key, pathStats);

    console.log(`── ${key} ──`);
    console.log(
      `  SMART : win ${pct(sAgg.wins, sAgg.runs)} | act1 boss ${pct(sAgg.act1Boss, sAgg.runs)} | avg wins ${sAgg.avgVictories.toFixed(1)}`,
    );
    console.log(
      `  ONSPEC: win ${pct(oAgg.wins, oAgg.runs)} | act1 boss ${pct(oAgg.act1Boss, oAgg.runs)} | avg wins ${oAgg.avgVictories.toFixed(1)}`,
    );
    console.log(
      `  RANDOM: win ${pct(rAgg.wins, rAgg.runs)} | act1 boss ${pct(rAgg.act1Boss, rAgg.runs)} | avg wins ${rAgg.avgVictories.toFixed(1)}`,
    );
    const deaths = topEntries(sAgg.deathBuckets, 5)
      .map(([k, v]) => `${k}:${v}`)
      .join(', ');
    console.log(`  Smart death/end: ${deaths}`);
    const picks = topEntries(sAgg.cardPickCounts, 8)
      .map(([k, v]) => `${k}(${v})`)
      .join(', ');
    console.log(`  Top smart picks: ${picks}`);
    const opicks = topEntries(oAgg.cardPickCounts, 8)
      .map(([k, v]) => `${k}(${v})`)
      .join(', ');
    console.log(`  Top onspec picks: ${opicks}`);
    const itemPicks = topEntries(pathStats.itemPickCounts, 8)
      .map(([k, v]) => `${k}(${v})`)
      .join(', ');
    console.log(`  Top items picked: ${itemPicks || '(none)'}`);
    const pathEval = evaluateViablePaths(spec, pathStats);
    const pathDist = Object.entries(pathEval.distribution)
      .sort((a, b) => b[1].winShare - a[1].winShare)
      .map(
        ([p, d]) =>
          `${p}:${(100 * d.winShare).toFixed(0)}%wins/${(100 * d.attemptWinRate).toFixed(0)}%att(${d.winCount}/${d.attempts})`,
      )
      .join(', ');
    console.log(`  Path wins (smart+onspec): ${pathDist || '(no wins)'}`);
    console.log(`  Viable: [${pathEval.viable.join(', ') || '—'}] (${pathEval.note})\n`);
  }

  // Spec tier from smart + onspec win rate
  console.log('=== SPEC WIN RATES ===');
  const specRates = [...smartAggs.entries()]
    .map(([k, a]) => {
      const o = onspecAggs.get(k)!;
      return {
        k,
        smart: a.wins / a.runs,
        onspec: o.wins / o.runs,
        act1: a.act1Boss / a.runs,
        onspecAct1: o.act1Boss / o.runs,
        avg: a.avgVictories,
      };
    })
    .sort((a, b) => b.onspec - a.onspec || b.smart - a.smart);
  for (const s of specRates) {
    console.log(
      `  ${s.k}: onspec ${(100 * s.onspec).toFixed(1)}% | smart ${(100 * s.smart).toFixed(1)}% | act1 ${((100 * s.act1).toFixed(1))}%`,
    );
  }

  console.log('\n=== RANDOM vs SMART (difficulty check) ===');
  let smartWinTotal = 0;
  let randomWinTotal = 0;
  let onspecWinTotal = 0;
  let smartN = 0;
  let randomN = 0;
  let onspecN = 0;
  for (const [k, a] of smartAggs) {
    smartWinTotal += a.wins;
    smartN += a.runs;
    const r = randomAggs.get(k)!;
    randomWinTotal += r.wins;
    randomN += r.runs;
    const o = onspecAggs.get(k)!;
    onspecWinTotal += o.wins;
    onspecN += o.runs;
  }
  console.log(`  Overall smart win: ${pct(smartWinTotal, smartN)}`);
  console.log(`  Overall onspec win: ${pct(onspecWinTotal, onspecN)}`);
  console.log(`  Overall random win: ${pct(randomWinTotal, randomN)}`);

  // Card lift: win picks / (win+loss picks) + deck presence delta
  console.log('\n=== CARD SIGNAL (smart picks in wins vs losses) ===');
  const cardIds = new Set([...Object.keys(cardWinPick), ...Object.keys(cardLossPick)]);
  const cardScores: Array<{
    id: string;
    lift: number;
    wins: number;
    losses: number;
    total: number;
    winRate: number;
    lossRate: number;
    delta: number;
  }> = [];
  for (const id of cardIds) {
    const w = cardWinPick[id] ?? 0;
    const l = cardLossPick[id] ?? 0;
    const total = w + l;
    if (total < 10) continue;
    const lift = w / total;
    const winRate = winDeckN ? (cardInWin[id] ?? 0) / winDeckN : 0;
    const lossRate = lossDeckN ? (cardInLoss[id] ?? 0) / lossDeckN : 0;
    cardScores.push({
      id,
      lift,
      wins: w,
      losses: l,
      total,
      winRate,
      lossRate,
      delta: winRate - lossRate,
    });
  }
  cardScores.sort((a, b) => b.delta - a.delta || b.lift - a.lift);
  console.log(`  Win decks: ${winDeckN} | Loss decks: ${lossDeckN} | Win runs tracked: ${winRuns}`);
  console.log('  High win-deck delta:');
  for (const c of cardScores.slice(0, 25)) {
    console.log(
      `    ${c.id}: Δ=${(100 * c.delta).toFixed(0)}pp lift=${(100 * c.lift).toFixed(0)}% winDeck=${(100 * c.winRate).toFixed(0)}% (w${c.wins}/l${c.losses})`,
    );
  }
  console.log('  Low win-deck delta:');
  for (const c of [...cardScores].sort((a, b) => a.delta - b.delta).slice(0, 15)) {
    console.log(
      `    ${c.id}: Δ=${(100 * c.delta).toFixed(0)}pp lift=${(100 * c.lift).toFixed(0)}% lossDeck=${(100 * c.lossRate).toFixed(0)}% (w${c.wins}/l${c.losses})`,
    );
  }

  // Per-spec win-deck staples
  console.log('\n=== PER-SPEC WIN DECK STAPLES ===');
  for (const [k, a] of smartAggs) {
    if (!a.winDeckAppearances) {
      console.log(`  ${k}: no wins`);
      continue;
    }
    const staples = topEntries(a.cardInWinDecks, 10)
      .map(([id, n]) => `${id}(${((100 * n) / a.winDeckAppearances).toFixed(0)}%)`)
      .join(', ');
    console.log(`  ${k}: ${staples}`);
  }

  // Path distribution among wins
  console.log('\n=== PATH DISTRIBUTION (smart+onspec wins) ===');
  const pathBreakdown: Record<
    string,
    {
      wins: number;
      runs: number;
      viable: string[];
      note: string;
      distribution: Record<
        string,
        { winShare: number; attemptWinRate: number; winCount: number; attempts: number }
      >;
      topItems: Array<[string, number]>;
      itemsInWins: Array<[string, number]>;
    }
  > = {};

  for (const { classId, spec } of ALL_CONFIGS) {
    const key = `${classId}/${spec}`;
    const ps = pathStatsBySpec.get(key)!;
    const evaluated = evaluateViablePaths(spec, ps);
    pathBreakdown[key] = {
      wins: ps.wins,
      runs: ps.runs,
      viable: evaluated.viable,
      note: evaluated.note,
      distribution: evaluated.distribution,
      topItems: topEntries(ps.itemPickCounts, 12),
      itemsInWins: topEntries(ps.itemInWins, 12).map(([id, n]) => [
        id,
        ps.wins ? n / ps.wins : 0,
      ]) as Array<[string, number]>,
    };
    console.log(`  ${key} (${ps.wins} wins / ${ps.runs} runs) — ${evaluated.note}`);
    const ordered = Object.entries(evaluated.distribution).sort(
      (a, b) => b[1].winShare - a[1].winShare,
    );
    for (const [path, d] of ordered) {
      const mark = evaluated.viable.includes(path) ? '*' : ' ';
      console.log(
        `   ${mark}${path}: ${(100 * d.winShare).toFixed(1)}% of wins (${d.winCount}) | attempt WR ${(100 * d.attemptWinRate).toFixed(1)}% over ${d.attempts}`,
      );
    }
  }

  // ── Forced path-seed validation (proves 2–3 viable lines per spec) ──
  const seedRuns = Number(process.env.SEED_RUNS ?? 25);
  const PATH_SEEDS: Record<OpeningSpec, Array<{ path: string; item: string }>> = {
    feral: [
      { path: 'bleed', item: 'bloodfang_charm' },
      { path: 'bear_wall', item: 'ironpelt_totem' },
      { path: 'tempo', item: 'frenzy_claw' },
    ],
    boomkin: [
      { path: 'celestial', item: 'celestial_orb' },
      { path: 'thorns', item: 'thornwoven_cloak' },
      { path: 'aoe', item: 'hurricane_eye' },
      { path: 'twin_star', item: 'twin_star' },
    ],
    tree: [
      { path: 'verdant', item: 'verdant_lash' },
      { path: 'fortress', item: 'lifebloom_crown' },
      { path: 'barkbreaker', item: 'barkbreaker_seed' },
      { path: 'swiftroot', item: 'swiftroot_charm' },
    ],
    holy: [
      { path: 'radiant', item: 'radiant_censer' },
      { path: 'flame', item: 'sacred_flame' },
      { path: 'serenity', item: 'serenity_bell' },
      { path: 'hymn', item: 'hymn_book' },
    ],
    shadow: [
      { path: 'leech', item: 'void_leech' },
      { path: 'pain', item: 'pain_amplifier' },
      { path: 'recoil', item: 'death_wish' },
      { path: 'scream', item: 'scream_mask' },
    ],
    discipline: [
      { path: 'spike', item: 'shield_spike' },
      { path: 'smite_echo', item: 'smite_echo' },
      { path: 'penance', item: 'penitent_brand' },
      { path: 'radiance', item: 'borrowed_timepiece' },
    ],
  };

  console.log(`\n=== PATH SEED VALIDATION (${seedRuns} onspec runs / seed) ===`);
  const pathSeedResults: Record<
    string,
    Array<{ path: string; item: string; winRate: number; wins: number; runs: number; viable: boolean }>
  > = {};
  const seededDynamics = new Map<string, DynamicsBucket>();
  const VIABLE_SEED_WR = 0.45;

  for (const { classId, spec } of ALL_CONFIGS) {
    const key = `${classId}/${spec}`;
    pathSeedResults[key] = [];
    let viableCount = 0;
    for (const seed of PATH_SEEDS[spec]) {
      let wins = 0;
      const seedKey = `${key}/${seed.path}`;
      if (!seededDynamics.has(seedKey)) seededDynamics.set(seedKey, emptyDynamics());
      for (let i = 0; i < seedRuns; i++) {
        const r = simulateRun(classId, spec, 'onspec', seed.item);
        if (r.won) wins += 1;
        ingestDynamics(seededDynamics.get(seedKey)!, r);
      }
      const winRate = wins / seedRuns;
      const viable = winRate >= VIABLE_SEED_WR;
      if (viable) viableCount += 1;
      pathSeedResults[key]!.push({
        path: seed.path,
        item: seed.item,
        winRate,
        wins,
        runs: seedRuns,
        viable,
      });
      console.log(
        `  ${key} [${seed.path}] seed=${seed.item}: ${(100 * winRate).toFixed(0)}% ${viable ? '✓' : '·'}`,
      );
    }
    console.log(`  → ${key}: ${viableCount} viable seeded paths (need ≥2)\n`);
  }

  // ── Build feel: dynamism / repetition / power / simplicity ──
  console.log('\n=== BUILD DYNAMICS (smart+onspec play patterns) ===');
  const specDynamicsReports = [...dynamicsBySpec.entries()]
    .map(([k, d]) => reportDynamics(k, d))
    .sort((a, b) => b.dynamismScore - a.dynamismScore);

  for (const r of specDynamicsReports) {
    console.log(
      `  ${r.key}: dyn=${r.dynamismScore.toFixed(1)} rep=${r.repetitionScore.toFixed(1)} simp=${r.simplicityScore.toFixed(1)} | ` +
        `WR=${(100 * r.winRate).toFixed(0)}% H=${r.playEntropy.toFixed(2)} top3=${(100 * r.top3Share).toFixed(0)}% ` +
        `u/turn=${r.avgUniquePerTurn.toFixed(2)} combos=${r.avgUniqueCombos.toFixed(0)} consensus=${(100 * r.mainCardConsensus).toFixed(0)}%`,
    );
    console.log(
      `    plays: ${r.topPlays
        .slice(0, 5)
        .map(([id, n]) => `${id}(${n})`)
        .join(', ')}`,
    );
    console.log(
      `    combos: ${r.topCombos
        .slice(0, 4)
        .map(([id, n]) => `${id}(${n})`)
        .join(', ')}`,
    );
  }

  console.log('\n=== SEEDED PATH DYNAMICS ===');
  const seededReports = [...seededDynamics.entries()]
    .map(([k, d]) => reportDynamics(k, d))
    .filter((r) => r.runs > 0)
    .sort((a, b) => b.dynamismScore - a.dynamismScore);

  for (const r of seededReports) {
    console.log(
      `  ${r.key}: dyn=${r.dynamismScore.toFixed(1)} rep=${r.repetitionScore.toFixed(1)} simp=${r.simplicityScore.toFixed(1)} | ` +
        `WR=${(100 * r.winRate).toFixed(0)}% H=${r.playEntropy.toFixed(2)} top3=${(100 * r.top3Share).toFixed(0)}% ` +
        `u/turn=${r.avgUniquePerTurn.toFixed(2)} consensus=${(100 * r.mainCardConsensus).toFixed(0)}%`,
    );
  }

  const byDyn = [...seededReports].sort((a, b) => b.dynamismScore - a.dynamismScore);
  const byRep = [...seededReports].sort((a, b) => b.repetitionScore - a.repetitionScore);
  const byPower = [...seededReports].sort((a, b) => b.winRate - a.winRate || b.avgVictories - a.avgVictories);
  const bySimp = [...seededReports].sort((a, b) => b.simplicityScore - a.simplicityScore);

  console.log('\n=== RANKINGS (seeded paths) ===');
  console.log(`  Most dynamic:    ${byDyn.slice(0, 5).map((r) => `${r.key}(${r.dynamismScore.toFixed(0)})`).join(', ')}`);
  console.log(`  Most repetitive: ${byRep.slice(0, 5).map((r) => `${r.key}(${r.repetitionScore.toFixed(0)})`).join(', ')}`);
  console.log(`  Highest power:   ${byPower.slice(0, 5).map((r) => `${r.key}(${(100 * r.winRate).toFixed(0)}%)`).join(', ')}`);
  console.log(`  Simplest:        ${bySimp.slice(0, 5).map((r) => `${r.key}(${r.simplicityScore.toFixed(0)})`).join(', ')}`);

  const naturalPathReports = [...dynamicsByPath.entries()]
    .map(([k, d]) => reportDynamics(k, d))
    .filter((r) => r.runs >= 5)
    .sort((a, b) => b.dynamismScore - a.dynamismScore);

  // Dump JSON summary for further analysis
  const summary = {
    smartRuns,
    onspecRuns,
    randomRuns,
    seedRuns,
    specs: Object.fromEntries(
      [...smartAggs.entries()].map(([k, a]) => [
        k,
        {
          smartWin: a.wins / a.runs,
          smartAct1: a.act1Boss / a.runs,
          smartAvgV: a.avgVictories,
          onspecWin: (onspecAggs.get(k)?.wins ?? 0) / (onspecAggs.get(k)?.runs ?? 1),
          onspecAct1: (onspecAggs.get(k)?.act1Boss ?? 0) / (onspecAggs.get(k)?.runs ?? 1),
          onspecAvgV: onspecAggs.get(k)?.avgVictories ?? 0,
          randomWin: (randomAggs.get(k)?.wins ?? 0) / (randomAggs.get(k)?.runs ?? 1),
          randomAct1: (randomAggs.get(k)?.act1Boss ?? 0) / (randomAggs.get(k)?.runs ?? 1),
          randomAvgV: randomAggs.get(k)?.avgVictories ?? 0,
          topPicks: topEntries(a.cardPickCounts, 12),
          onspecPicks: topEntries(onspecAggs.get(k)?.cardPickCounts ?? {}, 12),
          winStaples: topEntries(a.cardInWinDecks, 15).map(([id, n]) => [
            id,
            a.winDeckAppearances ? n / a.winDeckAppearances : 0,
          ]),
          deaths: topEntries(a.deathBuckets, 8),
          onspecDeaths: topEntries(onspecAggs.get(k)?.deathBuckets ?? {}, 8),
          dynamics: specDynamicsReports.find((r) => r.key === k) ?? null,
        },
      ]),
    ),
    pathBreakdown,
    pathSeedResults,
    dynamics: {
      bySpec: specDynamicsReports,
      byNaturalPath: naturalPathReports,
      bySeededPath: seededReports,
      rankings: {
        mostDynamic: byDyn.slice(0, 8).map((r) => r.key),
        mostRepetitive: byRep.slice(0, 8).map((r) => r.key),
        highestPower: byPower.slice(0, 8).map((r) => r.key),
        simplest: bySimp.slice(0, 8).map((r) => r.key),
      },
    },
    overall: {
      smartWin: smartWinTotal / smartN,
      onspecWin: onspecWinTotal / onspecN,
      randomWin: randomWinTotal / randomN,
      winDeckN,
      lossDeckN,
    },
    cardLift: cardScores,
  };

  const fs = await import('node:fs');
  fs.writeFileSync('/workspace/scripts/playthrough-results.json', JSON.stringify(summary, null, 2));
  console.log('\nWrote scripts/playthrough-results.json');
}

main();
