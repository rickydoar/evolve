/**
 * Detailed Evolve balance report — power curves, floor pressure, elite/boss stats.
 */
import fs from 'node:fs';
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
  talentPriority: string[];
  keepUtility: string[];
  removeForms: Form[];
}

const SPECS: SpecConfig[] = [
  {
    id: 'cat',
    label: 'Cat',
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
    label: 'Bear',
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
    label: 'Balance',
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
    label: 'Resto',
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

type PlayStyle = 'optimal' | 'greedy_damage' | 'no_talents' | 'random_cards';

interface FightMetrics {
  floor: number;
  type: string;
  enemies: string[];
  won: boolean;
  turns: number;
  hpBefore: number;
  hpAfter: number;
  damageTaken: number;
  damageDealt: number;
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

function cardScore(
  spec: SpecConfig,
  cardId: string,
  combat: CombatState,
  style: PlayStyle,
): number {
  const card = CARDS[cardId];
  if (!card) return -999;

  if (style === 'random_cards') return Math.random() * 100;

  const preferred = isPreferred(spec, cardId);
  const living = combat.enemies.filter((e) => e.hp > 0);
  const lowest = living[0]
    ? living.reduce((a, b) => (a.hp <= b.hp ? a : b), living[0])
    : null;
  const hpPct = combat.player.hp / combat.player.maxHp;
  const incoming = living.reduce(
    (s, e) => (e.intent?.type === 'attack' ? s + e.intent.value : s),
    0,
  );
  const needBlock = combat.player.block < incoming && incoming > 0;
  const needHeal = hpPct < 0.55;

  let score = 0;
  for (const e of card.effects) {
    switch (e.kind) {
      case 'damage':
        score += e.value * (preferred ? 2.2 : 1.0);
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
        if (style === 'greedy_damage') {
          score += e.value * (needBlock ? 1.5 : 0.2);
        } else {
          score += e.value * (needBlock ? 2.5 : 0.6);
          if (needBlock) score += 10;
        }
        break;
      case 'heal':
      case 'healOverTime':
        if (style === 'greedy_damage') {
          score += e.value * (hpPct < 0.35 ? 2 : 0.1);
        } else {
          score += e.value * (needHeal ? 2.2 : 0.35);
          if (needHeal) score += 12;
          if (hpPct > 0.85) score -= 20;
        }
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
        if (
          combat.player.statuses.some(
            (s) => s.kind === 'poison' || s.kind === 'weak' || s.kind === 'bleed',
          )
        ) {
          score += 20;
        } else score -= 5;
        break;
      case 'earthAndMoon':
        score += preferred ? 14 : 4;
        break;
    }
  }

  if (cardId === 'shred') score += 10;
  if (cardId === 'tigers_fury') score += 18;
  if (cardId === 'ferocious_bite' && lowest?.statuses.some((s) => s.kind === 'bleed')) score += 12;
  if (cardId === 'shadow_word_death' && lowest && lowest.hp < lowest.maxHp / 2) score += 15;
  if (card.cost === 0) score += 5;
  if (!preferred && !isUtility(spec, cardId)) score -= 6;

  if ((spec.id === 'resto' || spec.id === 'holy') && hpPct > 0.7) {
    if (card.effects.some((e) => e.kind === 'damage' || e.kind === 'aoeDamage' || e.kind === 'damageOverTime')) {
      score += 10;
    }
  }

  score -= card.cost * 0.5;
  return score;
}

function pickTarget(combat: CombatState): string | null {
  const living = combat.enemies.filter((e) => e.hp > 0);
  if (!living.length) return null;
  living.sort((a, b) => {
    const aAtk = a.intent?.type === 'attack' ? 1 : 0;
    const bAtk = b.intent?.type === 'attack' ? 1 : 0;
    if (aAtk !== bAtk) return bAtk - aAtk;
    return a.hp - b.hp;
  });
  return living[0]!.id;
}

function playPlayerTurn(spec: SpecConfig, combat: CombatState, style: PlayStyle): void {
  let guard = 0;
  while (combat.phase === 'player' && guard++ < 40) {
    let bestIdx = -1;
    let bestScore = -Infinity;
    for (let i = 0; i < combat.hand.length; i++) {
      if (!canPlayCard(combat, i)) continue;
      const s = cardScore(spec, combat.hand[i]!, combat, style);
      if (s > bestScore) {
        bestScore = s;
        bestIdx = i;
      }
    }
    if (bestIdx < 0 || (style !== 'random_cards' && bestScore < -50)) break;

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

function totalEnemyHp(combat: CombatState): number {
  return combat.enemies.reduce((s, e) => s + Math.max(0, e.hp), 0);
}

function runCombat(
  spec: SpecConfig,
  run: RunState,
  enemyIds: string[],
  style: PlayStyle,
): FightMetrics {
  const hpBefore = run.hp;
  const combat = startCombat(run, enemyIds);
  const startEnemyHp = totalEnemyHp(combat);
  let turns = 0;

  while (combat.phase === 'player' || combat.phase === 'enemy') {
    if (combat.phase === 'player') {
      turns++;
      if (turns > 60) {
        combat.phase = 'defeat';
        break;
      }
      playPlayerTurn(spec, combat, style);
      if (combat.phase !== 'player') break;
      const steps = endPlayerTurn(combat);
      for (const step of steps) {
        if (!applyEnemyTurnStep(combat, step)) break;
      }
      if (combat.phase === 'enemy') beginPlayerTurn(combat);
    } else break;
  }

  const won = combat.phase === 'victory';
  const damageDealt = startEnemyHp - totalEnemyHp(combat);
  if (won) {
    run.hp = combat.player.hp;
    run.victories++;
    if (style !== 'no_talents') run.talentPoints++;
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
    damageDealt,
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

function rewardScore(spec: SpecConfig, cardId: string, style: PlayStyle): number {
  if (style === 'random_cards') return Math.random() * 100;
  const card = CARDS[cardId];
  if (!card) return -999;
  let s = 0;
  if (isPreferred(spec, cardId)) s += 50;
  else if (isUtility(spec, cardId)) s += 15;
  else if (spec.removeForms.includes(card.form)) s -= 20;
  else s += 5;
  s += { common: 0, rare: 8, epic: 16, legendary: 28 }[card.rarity];
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

function pickReward(spec: SpecConfig, run: RunState, style: PlayStyle): void {
  const offers = randomRewards(3, run.classId);
  const ranked = [...offers].sort((a, b) => rewardScore(spec, b, style) - rewardScore(spec, a, style));
  const best = ranked[0]!;
  if (style !== 'random_cards' && rewardScore(spec, best, style) < 0) return;
  run.deck.push(best);
}

function visitShop(spec: SpecConfig, run: RunState, style: PlayStyle): void {
  if (style === 'random_cards') return;
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
  const offers = randomRewards(5, run.classId);
  const ranked = [...offers].sort((a, b) => rewardScore(spec, b, style) - rewardScore(spec, a, style));
  for (const id of ranked) {
    if (rewardScore(spec, id, style) < 35) continue;
    const cost = CARD_BUY_COST[CARDS[id]!.rarity];
    if (run.gold >= cost + 10) {
      run.gold -= cost;
      run.deck.push(id);
      break;
    }
  }
}

function nodePriority(type: string, hpPct: number): number {
  if (type === 'rest' && hpPct < 0.65) return 100;
  if (type === 'rest') return 40;
  if (type === 'treasure') return 70;
  if (type === 'shop' && hpPct > 0.5) return 55;
  if (type === 'shop') return 30;
  if (type === 'elite' && hpPct > 0.7) return 50;
  if (type === 'elite') return 20;
  if (type === 'boss') return 10;
  return 35;
}

interface RunResult {
  won: boolean;
  floorReached: number;
  fights: FightMetrics[];
  finalHp: number;
  victories: number;
  deathCause?: string;
  bossTurns?: number;
  bossDamageTaken?: number;
}

function playRun(spec: SpecConfig, seed: number, style: PlayStyle): RunResult {
  return withSeed(seed, () => {
    const run = createRun(spec.classId);
    const fights: FightMetrics[] = [];
    let deathCause: string | undefined;
    let bossTurns: number | undefined;
    let bossDamageTaken: number | undefined;

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
        if (style !== 'no_talents') spendTalents(spec, run);
        node.cleared = true;
        continue;
      }
      if (node.type === 'treasure') {
        run.gold += 40;
        pickReward(spec, run, style);
        node.cleared = true;
        continue;
      }
      if (node.type === 'shop') {
        visitShop(spec, run, style);
        node.cleared = true;
        continue;
      }

      const result = runCombat(spec, run, node.enemyIds, style);
      if (node.type === 'elite') result.type = 'elite';
      if (node.type === 'boss') result.type = 'boss';
      fights.push(result);

      if (!result.won) {
        deathCause = `${node.type} floor ${node.floor}`;
        if (node.type === 'boss') {
          bossTurns = result.turns;
          bossDamageTaken = result.damageTaken;
        }
        break;
      }

      if (style !== 'no_talents') spendTalents(spec, run);

      if (node.type === 'boss') {
        bossTurns = result.turns;
        bossDamageTaken = result.damageTaken;
        node.cleared = true;
        break;
      }

      run.gold += 15;
      pickReward(spec, run, style);
      node.cleared = true;
    }

    return {
      won:
        fights.length > 0 &&
        fights[fights.length - 1]!.won &&
        fights[fights.length - 1]!.type === 'boss',
      floorReached: run.floor,
      fights,
      finalHp: run.hp,
      victories: run.victories,
      deathCause,
      bossTurns,
      bossDamageTaken,
    };
  });
}

function avg(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

function main() {
  const RUNS = Number(process.env.RUNS ?? 50);
  const BASE = Number(process.env.SEED ?? 7);

  const report: Record<string, unknown> = { meta: { RUNS, BASE }, specs: {} };

  console.log('=== Spec Power Report ===\n');

  for (let si = 0; si < SPECS.length; si++) {
    const spec = SPECS[si]!;
    const styles: PlayStyle[] = ['optimal', 'greedy_damage', 'no_talents', 'random_cards'];
    const styleResults: Record<string, unknown> = {};

    for (const style of styles) {
      const results: RunResult[] = [];
      for (let i = 0; i < RUNS; i++) {
        results.push(playRun(spec, BASE + si * 20000 + styles.indexOf(style) * 5000 + i * 91, style));
      }

      const wins = results.filter((r) => r.won);
      const allFights = results.flatMap((r) => r.fights);
      const elites = allFights.filter((f) => f.type === 'elite');
      const bosses = allFights.filter((f) => f.type === 'boss');
      const early = allFights.filter((f) => f.floor <= 3);
      const mid = allFights.filter((f) => f.floor >= 4 && f.floor <= 7);
      const late = allFights.filter((f) => f.floor >= 8);

      const byFloor: Record<number, { dmg: number; turns: number; n: number; deaths: number }> = {};
      for (const f of allFights) {
        const b = (byFloor[f.floor] ??= { dmg: 0, turns: 0, n: 0, deaths: 0 });
        b.dmg += f.damageTaken;
        b.turns += f.turns;
        b.n++;
        if (!f.won) b.deaths++;
      }

      styleResults[style] = {
        winRate: wins.length / results.length,
        avgFloor: avg(results.map((r) => r.floorReached)),
        avgBossTurns: avg(results.map((r) => r.bossTurns ?? 0).filter(Boolean)),
        avgBossDmgTaken: avg(results.map((r) => r.bossDamageTaken ?? 0)),
        avgHpOnWin: wins.length ? avg(wins.map((r) => r.finalHp)) : null,
        avgDmgTaken: avg(allFights.map((f) => f.damageTaken)),
        avgTurns: avg(allFights.map((f) => f.turns)),
        avgDmgDealtPerTurn: avg(
          allFights.filter((f) => f.turns > 0).map((f) => f.damageDealt / f.turns),
        ),
        elite: {
          winRate: elites.filter((f) => f.won).length / Math.max(1, elites.length),
          avgDmgTaken: avg(elites.map((f) => f.damageTaken)),
          avgTurns: avg(elites.map((f) => f.turns)),
        },
        boss: {
          winRate: bosses.filter((f) => f.won).length / Math.max(1, bosses.length),
          avgDmgTaken: avg(bosses.map((f) => f.damageTaken)),
          avgTurns: avg(bosses.map((f) => f.turns)),
        },
        earlyDmg: avg(early.map((f) => f.damageTaken)),
        midDmg: avg(mid.map((f) => f.damageTaken)),
        lateDmg: avg(late.map((f) => f.damageTaken)),
        deathCauses: results
          .filter((r) => !r.won)
          .reduce<Record<string, number>>((acc, r) => {
            const k = r.deathCause ?? 'unknown';
            acc[k] = (acc[k] ?? 0) + 1;
            return acc;
          }, {}),
        byFloor: Object.fromEntries(
          Object.entries(byFloor).map(([fl, v]) => [
            fl,
            {
              avgDmg: v.dmg / v.n,
              avgTurns: v.turns / v.n,
              fights: v.n,
              deaths: v.deaths,
            },
          ]),
        ),
      };
    }

    const opt = styleResults.optimal as Record<string, number>;
    const greedy = styleResults.greedy_damage as Record<string, number>;
    const none = styleResults.no_talents as Record<string, number>;
    const rand = styleResults.random_cards as Record<string, number>;

    console.log(`## ${spec.label} (${spec.classId})`);
    console.log(
      `  Optimal:   WR ${(opt.winRate * 100).toFixed(0)}%  boss ${Number(opt.avgBossTurns).toFixed(1)}t  ` +
        `dmg/fight ${Number(opt.avgDmgTaken).toFixed(1)}  dps/turn ${Number(opt.avgDmgDealtPerTurn).toFixed(1)}  ` +
        `hpWin ${opt.avgHpOnWin != null ? Number(opt.avgHpOnWin).toFixed(0) : 'n/a'}`,
    );
    console.log(
      `  Greedy:    WR ${(greedy.winRate * 100).toFixed(0)}%  boss ${Number(greedy.avgBossTurns).toFixed(1)}t  dmg ${Number(greedy.avgDmgTaken).toFixed(1)}`,
    );
    console.log(
      `  No talents:WR ${(none.winRate * 100).toFixed(0)}%  boss ${Number(none.avgBossTurns).toFixed(1)}t  dmg ${Number(none.avgDmgTaken).toFixed(1)}`,
    );
    console.log(
      `  Random:    WR ${(rand.winRate * 100).toFixed(0)}%  avgFloor ${Number(rand.avgFloor).toFixed(1)}  deaths: ${JSON.stringify((styleResults.random_cards as { deathCauses: unknown }).deathCauses)}`,
    );
    console.log(
      `  Pressure:  early ${Number(opt.earlyDmg).toFixed(1)} → mid ${Number(opt.midDmg).toFixed(1)} → late ${Number(opt.lateDmg).toFixed(1)} dmg/fight`,
    );
    console.log('');

    report.specs[spec.id] = { label: spec.label, classId: spec.classId, styles: styleResults };
  }

  fs.writeFileSync('/opt/cursor/artifacts/spec-power-report.json', JSON.stringify(report, null, 2));
  console.log('Wrote /opt/cursor/artifacts/spec-power-report.json');
}

main();
