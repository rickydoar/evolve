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
  finalDeck: string[];
  talents: Record<string, number>;
  turnsFought: number;
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
};

const SPEC_TREE: Record<OpeningSpec, TalentTree> = {
  feral: 'feral',
  boomkin: 'balance',
  tree: 'resto',
  holy: 'holy',
  shadow: 'shadow',
  discipline: 'discipline',
};

const ALL_CONFIGS: Array<{ classId: ClassId; spec: OpeningSpec }> = [
  { classId: 'druid', spec: 'feral' },
  { classId: 'druid', spec: 'boomkin' },
  { classId: 'druid', spec: 'tree' },
  { classId: 'priest', spec: 'holy' },
  { classId: 'priest', spec: 'shadow' },
  { classId: 'priest', spec: 'discipline' },
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

function playSmartTurn(state: CombatState, spec: OpeningSpec): void {
  let safety = 40;
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
    const def = card(state.hand[bestIdx]!);
    if (!def) break;
    if (def.target === 'enemy') {
      const target = lowestEnemy(state);
      if (!target) break;
      if (!playCardOnEnemy(state, bestIdx, target.id)) break;
    } else {
      if (!playCard(state, bestIdx)) break;
    }
  }
}

function playRandomTurn(state: CombatState): void {
  let safety = 30;
  while (state.phase === 'player' && safety-- > 0) {
    const playable: number[] = [];
    for (let i = 0; i < state.hand.length; i++) {
      if (canPlayCard(state, i)) playable.push(i);
    }
    if (!playable.length) break;
    // Sometimes end early even with plays available
    if (Math.random() < 0.15) break;
    const idx = playable[Math.floor(Math.random() * playable.length)]!;
    const def = card(state.hand[idx]!);
    if (!def) break;
    if (def.target === 'enemy') {
      const living = livingEnemies(state);
      if (!living.length) break;
      const target = living[Math.floor(Math.random() * living.length)]!;
      if (!playCardOnEnemy(state, idx, target.id)) break;
    } else {
      if (!playCard(state, idx)) break;
    }
  }
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
): { won: boolean; turns: number } {
  const state = startCombat(run, enemyIds);
  let turns = 0;
  const maxTurns = 80;
  while (state.phase === 'player' || state.phase === 'enemy') {
    if (state.phase === 'player') {
      turns += 1;
      if (policy === 'smart') playSmartTurn(state, spec);
      else if (policy === 'onspec') playSmartTurn(state, spec);
      else playRandomTurn(state);
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
  turnsFought: number,
): RunResult {
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
    finalDeck: [...run.deck],
    talents: { ...run.talents },
    turnsFought,
  };
}

function simulateRun(classId: ClassId, spec: OpeningSpec, policy: Policy): RunResult {
  const run = createRun(classId, spec);
  const picked: string[] = [];
  const removed: string[] = [];
  let turnsFought = 0;
  let lastNode: MapNode | null = null;

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
      const result = fightCombat(run, node.enemyIds, policy, spec);
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
          turnsFought,
        );
      }

      node.cleared = true;
      if (node.type === 'boss') {
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
          turnsFought,
        );
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
    turnsFought,
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

  for (const { classId, spec } of ALL_CONFIGS) {
    const key = `${classId}/${spec}`;
    const sAgg = emptyAgg();
    const oAgg = emptyAgg();
    const rAgg = emptyAgg();

    for (let i = 0; i < smartRuns; i++) {
      const result = simulateRun(classId, spec, 'smart');
      ingest(sAgg, result);
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
      ingest(oAgg, simulateRun(classId, spec, 'onspec'));
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
    console.log(`  Top onspec picks: ${opicks}\n`);
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

  // Dump JSON summary for further analysis
  const summary = {
    smartRuns,
    onspecRuns,
    randomRuns,
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
        },
      ]),
    ),
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
