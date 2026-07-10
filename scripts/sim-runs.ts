/**
 * Headless Evolve run simulator — plays full runs for each specialization.
 * Usage: npx tsx scripts/sim-runs.ts
 */
import { CARDS, CARD_BUY_COST, CARD_REMOVE_COST } from '../src/game/data/cards.ts';
import type { ClassId, Form, TalentTree } from '../src/game/data/types.ts';
import {
  availableNodes,
  createRun,
  randomRewards,
} from '../src/game/data/run.ts';
import {
  allocateTalent,
  canAllocateTalent,
  TALENTS,
  TALENTS_BY_TREE,
} from '../src/game/data/talents.ts';
import {
  applyEnemyTurnStep,
  beginPlayerTurn,
  canPlayCard,
  endPlayerTurn,
  playCard,
  playCardOnEnemy,
  startCombat,
  type CombatState,
} from '../src/game/systems/CombatSystem.ts';
import type { RunState } from '../src/game/data/types.ts';

type SpecId =
  | 'cat'
  | 'bear'
  | 'balance'
  | 'resto'
  | 'holy'
  | 'discipline'
  | 'shadow';

interface SpecConfig {
  id: SpecId;
  label: string;
  classId: ClassId;
  tree: TalentTree;
  forms: Form[];
  /** Preferred talent spend order (ids). Filled to max ranks in order when possible. */
  talentPriority: string[];
  /** Off-form cards to keep for survival / utility. */
  keepUtility: string[];
  /** Forms whose cards we try to remove at shop. */
  removeForms: Form[];
}

const SPECS: SpecConfig[] = [
  {
    id: 'cat',
    label: 'Cat (Feral DPS)',
    classId: 'druid',
    tree: 'feral',
    forms: ['cat'],
    talentPriority: [
      'feral_instinct',
      'predatory_strikes',
      'brutal_maul',
      'blood_in_the_water',
      'king_of_the_jungle',
      'shredding_attacks',
      'thick_hide',
      'improved_swipe',
    ],
    keepUtility: ['barkskin', 'decurse', 'rejuvenation', 'healing_touch', 'ironfur', 'survival_instincts'],
    removeForms: ['boomkin', 'tree'],
  },
  {
    id: 'bear',
    label: 'Bear (Guardian)',
    classId: 'druid',
    tree: 'feral',
    forms: ['bear'],
    talentPriority: [
      'feral_instinct',
      'thick_hide',
      'brutal_maul',
      'improved_swipe',
      'blood_in_the_water',
      'king_of_the_jungle',
      'predatory_strikes',
      'shredding_attacks',
    ],
    keepUtility: ['claw', 'shred', 'rip', 'decurse', 'rejuvenation', 'healing_touch'],
    removeForms: ['boomkin', 'tree'],
  },
  {
    id: 'balance',
    label: 'Balance (Boomkin)',
    classId: 'druid',
    tree: 'balance',
    forms: ['boomkin'],
    talentPriority: [
      'wrath_of_elune',
      'moonfury',
      'gale_force',
      'astral_power',
      'improved_moonfire',
      'lunar_guidance',
      'eclipse',
    ],
    keepUtility: ['barkskin', 'decurse', 'rejuvenation', 'healing_touch', 'swipe'],
    removeForms: ['cat', 'bear'],
  },
  {
    id: 'resto',
    label: 'Restoration (Tree)',
    classId: 'druid',
    tree: 'resto',
    forms: ['tree'],
    talentPriority: [
      'improved_healing_touch',
      'naturalist',
      'natural_ward',
      'gift_of_the_wild',
      'verdant_growth',
      'living_spirit',
      'tree_of_life',
    ],
    keepUtility: ['swipe', 'wrath', 'moonfire', 'barkskin', 'claw', 'shred'],
    removeForms: ['cat'],
  },
  {
    id: 'holy',
    label: 'Holy',
    classId: 'priest',
    tree: 'holy',
    forms: ['holy'],
    talentPriority: [
      'improved_flash_heal',
      'divine_fury',
      'blessed_recovery',
      'searing_light',
      'holy_reach',
      'spirit_of_redemption',
      'guardian_angel',
      'circle_of_healing',
    ],
    keepUtility: ['smite', 'power_word_shield', 'purify', 'penance', 'power_word_radiance'],
    removeForms: ['shadow'],
  },
  {
    id: 'discipline',
    label: 'Discipline',
    classId: 'priest',
    tree: 'discipline',
    forms: ['discipline'],
    talentPriority: [
      'twin_disciplines',
      'improved_shield',
      'meditation',
      'divine_aegis',
      'borrowed_time',
      'grace',
      'evangelism',
    ],
    keepUtility: ['flash_heal', 'renew', 'purify', 'holy_fire', 'mind_blast'],
    removeForms: ['shadow'],
  },
  {
    id: 'shadow',
    label: 'Shadow',
    classId: 'priest',
    tree: 'shadow',
    forms: ['shadow'],
    talentPriority: [
      'darkness',
      'improved_mind_blast',
      'shadow_weaving',
      'improved_swd',
      'psychic_horror',
      'vampiric_embrace',
      'shadow_power',
      'shadowform',
    ],
    keepUtility: ['power_word_shield', 'flash_heal', 'purify', 'renew', 'smite'],
    removeForms: ['holy'],
  },
];

interface FightResult {
  floor: number;
  type: string;
  enemies: string[];
  won: boolean;
  turns: number;
  hpBefore: number;
  hpAfter: number;
  damageTaken: number;
}

interface RunResult {
  spec: SpecId;
  won: boolean;
  floorReached: number;
  fights: FightResult[];
  finalHp: number;
  maxHp: number;
  victories: number;
  talentPointsSpent: number;
  deckSize: number;
  deckForms: Record<string, number>;
  deathCause?: string;
  bossTurns?: number;
  bossHpRemaining?: number;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Temporarily patch Math.random for a seeded section. */
function withSeed<T>(seed: number, fn: () => T): T {
  const rng = mulberry32(seed);
  const orig = Math.random;
  Math.random = rng;
  try {
    return fn();
  } finally {
    Math.random = orig;
  }
}

function cardForm(id: string): Form | undefined {
  return CARDS[id]?.form;
}

function isPreferred(spec: SpecConfig, cardId: string): boolean {
  const form = cardForm(cardId);
  return !!form && spec.forms.includes(form);
}

function isUtility(spec: SpecConfig, cardId: string): boolean {
  return spec.keepUtility.includes(cardId);
}

function cardScore(spec: SpecConfig, cardId: string, combat: CombatState): number {
  const card = CARDS[cardId];
  if (!card) return -999;
  let score = 0;
  const preferred = isPreferred(spec, cardId);
  const living = combat.enemies.filter((e) => e.hp > 0);
  const lowest = living.reduce((a, b) => (a.hp <= b.hp ? a : b), living[0]!);
  const hpPct = combat.player.hp / combat.player.maxHp;
  const incoming = living.reduce((s, e) => {
    if (e.intent?.type === 'attack') return s + e.intent.value;
    return s;
  }, 0);
  const needBlock = combat.player.block < incoming && incoming > 0;
  const needHeal = hpPct < 0.55;

  for (const e of card.effects) {
    switch (e.kind) {
      case 'damage':
        score += e.value * (preferred ? 2.2 : 1.0);
        if (living.length === 1) score += 4;
        break;
      case 'aoeDamage':
        score += e.value * living.length * (preferred ? 2.0 : 1.0);
        if (living.length >= 2) score += 8;
        break;
      case 'damageOverTime':
        score += e.value * (preferred ? 1.8 : 0.9);
        if (combat.turn <= 2) score += 6;
        break;
      case 'block':
        score += e.value * (needBlock ? 2.5 : 0.6);
        if (needBlock) score += 10;
        break;
      case 'heal':
      case 'healOverTime':
        score += e.value * (needHeal ? 2.2 : 0.35);
        if (needHeal) score += 12;
        if (hpPct > 0.85) score -= 20;
        break;
      case 'draw':
        score += 8;
        break;
      case 'energy':
        score += 15;
        break;
      case 'strength':
      case 'spellPower':
        score += e.value * 6 + (combat.turn <= 2 ? 10 : 0);
        break;
      case 'vulnerable':
        score += 12;
        break;
      case 'cleanse':
        if (combat.player.statuses.some((s) => s.kind === 'poison' || s.kind === 'weak' || s.kind === 'bleed')) {
          score += 20;
        } else {
          score -= 5;
        }
        break;
      case 'earthAndMoon':
        score += preferred ? 14 : 4;
        break;
    }
  }

  // Special cases
  if (cardId === 'shred') score += 10; // free + draw
  if (cardId === 'tigers_fury') score += 18;
  if (cardId === 'ferocious_bite' && lowest && lowest.statuses.some((s) => s.kind === 'bleed')) {
    score += 12;
  }
  if (cardId === 'shadow_word_death' && lowest && lowest.hp < lowest.maxHp / 2) {
    score += 15;
  }
  if (cardId === 'starsurge') score += preferred ? 8 : 0;
  if (card.cost === 0) score += 5;
  if (!preferred && !isUtility(spec, cardId)) score -= 6;

  // Healers: still need to kill — boost damage when healthy
  if ((spec.id === 'resto' || spec.id === 'holy') && hpPct > 0.7) {
    if (card.effects.some((e) => e.kind === 'damage' || e.kind === 'aoeDamage' || e.kind === 'damageOverTime')) {
      score += 10;
    }
  }

  // Efficiency: prefer cheaper when similar
  score -= card.cost * 0.5;
  return score;
}

function pickTarget(combat: CombatState): string | null {
  const living = combat.enemies.filter((e) => e.hp > 0);
  if (!living.length) return null;
  // Kill lowest HP first; prefer enemies about to attack
  living.sort((a, b) => {
    const aAtk = a.intent?.type === 'attack' ? 1 : 0;
    const bAtk = b.intent?.type === 'attack' ? 1 : 0;
    if (aAtk !== bAtk) return bAtk - aAtk;
    return a.hp - b.hp;
  });
  return living[0]!.id;
}

function playPlayerTurn(spec: SpecConfig, combat: CombatState): void {
  let guard = 0;
  while (combat.phase === 'player' && guard++ < 40) {
    // Find best playable card
    let bestIdx = -1;
    let bestScore = -Infinity;
    for (let i = 0; i < combat.hand.length; i++) {
      if (!canPlayCard(combat, i)) continue;
      const id = combat.hand[i]!;
      const s = cardScore(spec, id, combat);
      if (s > bestScore) {
        bestScore = s;
        bestIdx = i;
      }
    }
    if (bestIdx < 0 || bestScore < -50) break;

    const cardId = combat.hand[bestIdx]!;
    const card = CARDS[cardId]!;
    if (card.target === 'enemy') {
      const tid = pickTarget(combat);
      if (!tid) break;
      playCardOnEnemy(combat, bestIdx, tid);
    } else {
      playCard(combat, bestIdx);
    }
  }
}

function runCombat(spec: SpecConfig, run: RunState, enemyIds: string[]): FightResult {
  const hpBefore = run.hp;
  const combat = startCombat(run, enemyIds);
  let turns = 0;
  const maxTurns = 60;

  while (combat.phase === 'player' || combat.phase === 'enemy') {
    if (combat.phase === 'player') {
      turns++;
      if (turns > maxTurns) {
        combat.phase = 'defeat';
        break;
      }
      playPlayerTurn(spec, combat);
      if (combat.phase !== 'player') break;
      const steps = endPlayerTurn(combat);
      for (const step of steps) {
        if (!applyEnemyTurnStep(combat, step)) break;
      }
      if (combat.phase === 'enemy') beginPlayerTurn(combat);
    } else {
      break;
    }
  }

  const won = combat.phase === 'victory';
  if (won) {
    run.hp = combat.player.hp;
    run.victories++;
    run.talentPoints++;
    run.shopRerollCount = 0;
  } else {
    run.hp = Math.max(0, combat.player.hp);
  }

  return {
    floor: run.floor,
    type: enemyIds.includes('nightmare') ? 'boss' : 'combat',
    enemies: enemyIds,
    won,
    turns,
    hpBefore,
    hpAfter: run.hp,
    damageTaken: Math.max(0, hpBefore - run.hp),
  };
}

function spendTalents(spec: SpecConfig, run: RunState): void {
  let guard = 0;
  while (run.talentPoints > 0 && guard++ < 50) {
    let spent = false;
    for (const tid of spec.talentPriority) {
      if (canAllocateTalent(run.talents, run.talentPoints, tid)) {
        run.talents = allocateTalent(run.talents, tid);
        run.talentPoints--;
        spent = true;
        break;
      }
    }
    // Fallback: any talent in preferred tree
    if (!spent) {
      for (const t of TALENTS_BY_TREE[spec.tree]) {
        if (canAllocateTalent(run.talents, run.talentPoints, t.id)) {
          run.talents = allocateTalent(run.talents, t.id);
          run.talentPoints--;
          spent = true;
          break;
        }
      }
    }
    if (!spent) break;
  }
}

function rewardScore(spec: SpecConfig, cardId: string): number {
  const card = CARDS[cardId];
  if (!card) return -999;
  let s = 0;
  if (isPreferred(spec, cardId)) s += 50;
  else if (isUtility(spec, cardId)) s += 15;
  else if (spec.removeForms.includes(card.form)) s -= 20;
  else s += 5;

  const rarityBonus = { common: 0, rare: 8, epic: 16, legendary: 28 };
  s += rarityBonus[card.rarity];

  // Prefer damage for DPS, block for bear, heal for healers
  for (const e of card.effects) {
    if (e.kind === 'damage' || e.kind === 'aoeDamage' || e.kind === 'damageOverTime') {
      s += (spec.id === 'resto' || spec.id === 'holy' ? 0.3 : 1) * e.value;
    }
    if (e.kind === 'block') s += (spec.id === 'bear' || spec.id === 'discipline' ? 1.2 : 0.4) * e.value;
    if (e.kind === 'heal' || e.kind === 'healOverTime') {
      s += (spec.id === 'resto' || spec.id === 'holy' || spec.id === 'discipline' ? 1.2 : 0.2) * e.value;
    }
    if (e.kind === 'strength' || e.kind === 'spellPower' || e.kind === 'energy' || e.kind === 'draw') {
      s += 20;
    }
  }
  return s;
}

function pickReward(spec: SpecConfig, run: RunState, freeOnly = false): void {
  const offers = randomRewards(3, run.classId);
  const ranked = [...offers].sort((a, b) => rewardScore(spec, b) - rewardScore(spec, a));
  const best = ranked[0]!;
  if (rewardScore(spec, best) < 0) return;
  run.deck.push(best);
  // Optionally buy a second if gold allows and it's great
  if (!freeOnly && ranked[1] && rewardScore(spec, ranked[1]) >= 40) {
    const cost = CARD_BUY_COST[CARDS[ranked[1]]!.rarity];
    if (run.gold >= cost + 20) {
      run.gold -= cost;
      run.deck.push(ranked[1]!);
    }
  }
}

function visitShop(spec: SpecConfig, run: RunState): void {
  // Try to remove a bad off-spec card
  if (run.gold >= CARD_REMOVE_COST && run.deck.length > 8) {
    let worstIdx = -1;
    let worstScore = Infinity;
    for (let i = 0; i < run.deck.length; i++) {
      const id = run.deck[i]!;
      const form = cardForm(id);
      let sc = 0;
      if (form && isPreferred(spec, id)) sc = 100;
      else if (isUtility(spec, id)) sc = 40;
      else if (form && spec.removeForms.includes(form)) sc = -10;
      else sc = 10;
      // Prefer removing duplicates of off-spec
      const copies = run.deck.filter((c) => c === id).length;
      if (copies > 1 && sc < 50) sc -= 5;
      if (sc < worstScore) {
        worstScore = sc;
        worstIdx = i;
      }
    }
    if (worstIdx >= 0 && worstScore < 15) {
      run.deck.splice(worstIdx, 1);
      run.gold -= CARD_REMOVE_COST;
    }
  }

  // Buy preferred cards if affordable
  const offers = randomRewards(5, run.classId);
  const ranked = [...offers].sort((a, b) => rewardScore(spec, b) - rewardScore(spec, a));
  for (const id of ranked) {
    const score = rewardScore(spec, id);
    if (score < 35) continue;
    const cost = CARD_BUY_COST[CARDS[id]!.rarity];
    if (run.gold >= cost + 10) {
      run.gold -= cost;
      run.deck.push(id);
      break;
    }
  }
}

function nodePriority(type: string, hpPct: number): number {
  // Higher = better to pick
  if (type === 'rest' && hpPct < 0.65) return 100;
  if (type === 'rest') return 40;
  if (type === 'treasure') return 70;
  if (type === 'shop' && hpPct > 0.5) return 55;
  if (type === 'shop') return 30;
  if (type === 'elite' && hpPct > 0.7) return 50;
  if (type === 'elite') return 20;
  if (type === 'boss') return 10;
  return 35; // combat
}

function playRun(spec: SpecConfig, seed: number): RunResult {
  return withSeed(seed, () => {
    const run = createRun(spec.classId);
    const fights: FightResult[] = [];
    let deathCause: string | undefined;
    let bossTurns: number | undefined;
    let bossHpRemaining: number | undefined;

    while (true) {
      const nodes = availableNodes(run);
      if (!nodes.length) break;

      const hpPct = run.hp / run.maxHp;
      const ranked = [...nodes].sort(
        (a, b) => nodePriority(b.type, hpPct) - nodePriority(a.type, hpPct),
      );
      const node = ranked[0]!;
      run.currentNodeId = node.id;
      run.floor = node.floor;

      if (node.type === 'rest') {
        run.hp = Math.min(run.maxHp, run.hp + Math.floor(run.maxHp * 0.3));
        spendTalents(spec, run);
        node.cleared = true;
        continue;
      }

      if (node.type === 'treasure') {
        run.gold += 40;
        pickReward(spec, run, true);
        node.cleared = true;
        continue;
      }

      if (node.type === 'shop') {
        visitShop(spec, run);
        node.cleared = true;
        continue;
      }

      // combat / elite / boss
      const result = runCombat(spec, run, node.enemyIds);
      if (node.type === 'elite') result.type = 'elite';
      if (node.type === 'boss') result.type = 'boss';
      fights.push(result);

      if (!result.won) {
        deathCause = `${node.type} on floor ${node.floor}: ${node.enemyIds.join(', ')}`;
        if (node.type === 'boss') {
          bossTurns = result.turns;
          // Approximate boss HP left — re-check not available; store damage taken as proxy
          bossHpRemaining = undefined;
        }
        break;
      }

      spendTalents(spec, run);

      if (node.type === 'boss') {
        bossTurns = result.turns;
        node.cleared = true;
        break;
      }

      // Rewards after combat/elite
      run.gold += 15;
      pickReward(spec, run);
      node.cleared = true;
    }

    const deckForms: Record<string, number> = {};
    for (const id of run.deck) {
      const f = cardForm(id) ?? 'unknown';
      deckForms[f] = (deckForms[f] ?? 0) + 1;
    }

    const talentPointsSpent = Object.entries(run.talents).reduce((s, [id, r]) => {
      void id;
      return s + r;
    }, 0);

    return {
      spec: spec.id,
      won: fights.length > 0 && fights[fights.length - 1]!.won && fights[fights.length - 1]!.type === 'boss',
      floorReached: run.floor,
      fights,
      finalHp: run.hp,
      maxHp: run.maxHp,
      victories: run.victories,
      talentPointsSpent,
      deckSize: run.deck.length,
      deckForms,
      deathCause,
      bossTurns,
      bossHpRemaining,
    };
  });
}

interface SpecSummary {
  spec: SpecId;
  label: string;
  runs: number;
  wins: number;
  winRate: number;
  avgFloor: number;
  avgVictories: number;
  avgBossTurns: number | null;
  avgHpOnWin: number | null;
  avgDamagePerFight: number;
  deathFloors: number[];
  deathCauses: Record<string, number>;
  sampleDeckForms: Record<string, number>;
  powerNotes: string[];
}

function summarize(spec: SpecConfig, results: RunResult[]): SpecSummary {
  const wins = results.filter((r) => r.won);
  const deathCauses: Record<string, number> = {};
  for (const r of results) {
    if (r.deathCause) {
      const key = r.deathCause.replace(/n\d+_[a-z0-9]+/g, '').trim();
      // Simplify to floor + type
      const m = r.deathCause.match(/^(combat|elite|boss) on floor (\d+)/);
      const k = m ? `${m[1]} floor ${m[2]}` : r.deathCause;
      deathCauses[k] = (deathCauses[k] ?? 0) + 1;
    }
  }

  const allDamages = results.flatMap((r) => r.fights.map((f) => f.damageTaken));
  const avgDamagePerFight =
    allDamages.length > 0 ? allDamages.reduce((a, b) => a + b, 0) / allDamages.length : 0;

  const bossTurns = results.map((r) => r.bossTurns).filter((t): t is number => t != null);
  const avgBossTurns =
    bossTurns.length > 0 ? bossTurns.reduce((a, b) => a + b, 0) / bossTurns.length : null;

  return {
    spec: spec.id,
    label: spec.label,
    runs: results.length,
    wins: wins.length,
    winRate: wins.length / results.length,
    avgFloor: results.reduce((s, r) => s + r.floorReached, 0) / results.length,
    avgVictories: results.reduce((s, r) => s + r.victories, 0) / results.length,
    avgBossTurns,
    avgHpOnWin:
      wins.length > 0 ? wins.reduce((s, r) => s + r.finalHp, 0) / wins.length : null,
    avgDamagePerFight,
    deathFloors: results.filter((r) => !r.won).map((r) => r.floorReached),
    deathCauses,
    sampleDeckForms: results[0]?.deckForms ?? {},
    powerNotes: [],
  };
}

import fs from 'node:fs';

function main() {
  const RUNS_PER_SPEC = Number(process.env.RUNS ?? 40);
  const BASE_SEED = Number(process.env.SEED ?? 42);

  console.log(`=== Evolve Spec Playthrough Sim ===`);
  console.log(`Runs per spec: ${RUNS_PER_SPEC}, base seed: ${BASE_SEED}\n`);

  const summaries: SpecSummary[] = [];
  const allDetailed: Record<string, RunResult[]> = {};

  for (let si = 0; si < SPECS.length; si++) {
    const spec = SPECS[si]!;
    const results: RunResult[] = [];
    for (let i = 0; i < RUNS_PER_SPEC; i++) {
      const seed = BASE_SEED + si * 10000 + i * 97;
      results.push(playRun(spec, seed));
    }
    allDetailed[spec.id] = results;
    const summary = summarize(spec, results);
    summaries.push(summary);

    const wr = (summary.winRate * 100).toFixed(0);
    console.log(
      `${summary.label.padEnd(22)}  WR ${wr.padStart(3)}%  avgFloor ${summary.avgFloor.toFixed(1)}  ` +
        `avgDmg/fight ${summary.avgDamagePerFight.toFixed(1)}  ` +
        `bossTurns ${summary.avgBossTurns?.toFixed(1) ?? 'n/a'}  ` +
        `hpOnWin ${summary.avgHpOnWin?.toFixed(0) ?? 'n/a'}`,
    );
  }

  // Write JSON artifact
  const out = {
    meta: { runsPerSpec: RUNS_PER_SPEC, baseSeed: BASE_SEED, generatedAt: new Date().toISOString() },
    summaries,
    // Include a few sample runs per spec for narrative
    samples: Object.fromEntries(
      Object.entries(allDetailed).map(([id, runs]) => [
        id,
        {
          win: runs.find((r) => r.won) ?? null,
          loss: runs.find((r) => !r.won) ?? null,
          allFloors: runs.map((r) => ({
            won: r.won,
            floor: r.floorReached,
            victories: r.victories,
            death: r.deathCause,
            bossTurns: r.bossTurns,
            finalHp: r.finalHp,
          })),
        },
      ]),
    ),
  };

  fs.writeFileSync('/opt/cursor/artifacts/spec-sim-results.json', JSON.stringify(out, null, 2));
  console.log('\nWrote /opt/cursor/artifacts/spec-sim-results.json');
}

main();
