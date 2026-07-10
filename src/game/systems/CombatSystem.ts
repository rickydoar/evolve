import { CARDS } from '../data/cards';
import { ENEMIES } from '../data/enemies';
import {
  modifyEffectValue,
  talentSpellPowerBonus,
} from '../data/talents';
import type {
  CardDef,
  Combatant,
  EnemyIntent,
  RunState,
  StatusEffect,
} from '../data/types';

export type CombatPhase = 'player' | 'enemy' | 'victory' | 'defeat';

export interface CombatLogEntry {
  text: string;
  color?: string;
}

export interface CombatState {
  player: Combatant;
  enemies: Combatant[];
  energy: number;
  energyMax: number;
  drawPile: string[];
  discardPile: string[];
  hand: string[];
  exhaustPile: string[];
  phase: CombatPhase;
  turn: number;
  log: CombatLogEntry[];
  selectedCardId: string | null;
  awaitingTarget: boolean;
  spellPowerBonus: number;
  /** Snapshot of run talents for this combat. */
  talents: Record<string, number>;
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function pickIntent(enemyId: string): EnemyIntent {
  const def = ENEMIES[enemyId]!;
  return { ...def.intents[Math.floor(Math.random() * def.intents.length)]! };
}

export function startCombat(run: RunState, enemyIds: string[]): CombatState {
  const enemies: Combatant[] = enemyIds.map((id) => {
    const def = ENEMIES[id]!;
    return {
      id: uid(id),
      name: def.name,
      maxHp: def.maxHp,
      hp: def.maxHp,
      block: 0,
      statuses: [],
      art: def.art,
      enemyDefId: id,
      intent: pickIntent(id),
    };
  });

  const talentSp = talentSpellPowerBonus(run.talents);
  const state: CombatState = {
    player: {
      id: 'player',
      name: 'Druid',
      maxHp: run.maxHp,
      hp: run.hp,
      block: 0,
      statuses: [],
      isPlayer: true,
      art: 'hero-druid',
    },
    enemies,
    energy: run.energyMax,
    energyMax: run.energyMax,
    drawPile: shuffle([...run.deck]),
    discardPile: [],
    hand: [],
    exhaustPile: [],
    phase: 'player',
    turn: 1,
    log: [{ text: 'Combat begins. The grove stirs...', color: '#a8e6cf' }],
    selectedCardId: null,
    awaitingTarget: false,
    spellPowerBonus: run.spellPowerBonus + talentSp,
    talents: { ...run.talents },
  };

  if (talentSp > 0) {
    state.log.push({
      text: `Lunar Guidance: +${talentSp} Spell Power.`,
      color: '#a78bfa',
    });
  }

  drawCards(state, 5);
  return state;
}

export function drawCards(state: CombatState, count: number): void {
  for (let i = 0; i < count; i++) {
    if (state.hand.length >= 10) break;
    if (state.drawPile.length === 0) {
      if (state.discardPile.length === 0) break;
      state.drawPile = shuffle(state.discardPile);
      state.discardPile = [];
      state.log.push({ text: 'Shuffled discard into draw pile.', color: '#9aa5b1' });
    }
    const card = state.drawPile.pop();
    if (card) state.hand.push(card);
  }
}

function getStatus(c: Combatant, kind: StatusEffect['kind']): StatusEffect | undefined {
  return c.statuses.find((s) => s.kind === kind);
}

function addStatus(c: Combatant, status: StatusEffect): void {
  const existing = getStatus(c, status.kind);
  if (existing && status.stacks) {
    existing.value += status.value;
    existing.duration = Math.max(existing.duration, status.duration);
  } else if (existing) {
    existing.value = status.value;
    existing.duration = status.duration;
  } else {
    c.statuses.push({ ...status });
  }
}

export function applyDamage(
  target: Combatant,
  raw: number,
  state: CombatState,
  sourceLabel?: string,
): number {
  let amount = Math.max(0, Math.floor(raw));
  const weak = sourceLabel === 'player' ? getStatus(state.player, 'weak') : undefined;
  if (weak && sourceLabel === 'player') {
    amount = Math.floor(amount * 0.75);
  }

  const vuln = getStatus(target, 'vulnerable');
  if (vuln) amount = Math.floor(amount * 1.5);

  const blocked = Math.min(target.block, amount);
  target.block -= blocked;
  amount -= blocked;
  target.hp = Math.max(0, target.hp - amount);
  return amount + blocked;
}

function heal(target: Combatant, amount: number): number {
  const before = target.hp;
  target.hp = Math.min(target.maxHp, target.hp + Math.floor(amount));
  return target.hp - before;
}

function computeCardDamage(
  card: CardDef,
  base: number,
  state: CombatState,
  target?: Combatant,
): number {
  let dmg = base + state.spellPowerBonus;
  if (card.form === 'boomkin') {
    dmg += Math.floor(state.spellPowerBonus * 0.5);
  }
  if (
    (card.id === 'starfire' || card.id === 'wrath') &&
    target &&
    getStatus(target, 'earthAndMoon')
  ) {
    const bonus = getStatus(target, 'earthAndMoon')!;
    dmg = Math.floor(dmg * (1 + bonus.value / 100));
  }
  if (card.id === 'ferocious_bite' && target && getStatus(target, 'bleed')) {
    dmg += 10;
  }
  const str = getStatus(state.player, 'strength');
  if (str) dmg += str.value;
  return dmg;
}

function applyBleed(
  target: Combatant,
  total: number,
  duration: number,
  state: CombatState,
  sourceName: string,
): void {
  const perTick = Math.floor(total / Math.max(1, duration));
  addStatus(target, {
    id: uid('bleed'),
    name: sourceName,
    kind: 'bleed',
    value: perTick,
    duration,
    stacks: true,
  });
  state.log.push({
    text: `${sourceName}: ${perTick}/turn for ${duration} turns on ${target.name}.`,
    color: '#f87171',
  });
}

function consumeEarthAndMoon(target: Combatant, card: CardDef, state: CombatState): void {
  if (card.id !== 'starfire' && card.id !== 'wrath') return;
  const bonus = getStatus(target, 'earthAndMoon');
  if (!bonus) return;
  target.statuses = target.statuses.filter((s) => s.kind !== 'earthAndMoon');
  state.log.push({ text: 'Earth and Moon consumed.', color: '#c4b5fd' });
}

export function canPlayCard(state: CombatState, handIndex: number): boolean {
  if (state.phase !== 'player') return false;
  const id = state.hand[handIndex];
  if (!id) return false;
  const card = CARDS[id];
  if (!card) return false;
  return state.energy >= card.cost;
}

export function selectCard(state: CombatState, handIndex: number): string | null {
  if (!canPlayCard(state, handIndex)) return null;
  const id = state.hand[handIndex]!;
  const card = CARDS[id]!;
  state.selectedCardId = id;

  if (card.target === 'enemy') {
    state.awaitingTarget = true;
    return 'target';
  }

  playCard(state, handIndex);
  return 'played';
}

export function playCardOnEnemy(
  state: CombatState,
  handIndex: number,
  enemyId: string,
): boolean {
  const id = state.hand[handIndex];
  if (!id || !canPlayCard(state, handIndex)) return false;
  const card = CARDS[id]!;
  if (card.target !== 'enemy') return false;
  const enemy = state.enemies.find((e) => e.id === enemyId && e.hp > 0);
  if (!enemy) return false;

  state.energy -= card.cost;
  state.hand.splice(handIndex, 1);
  applyCardEffects(state, card, enemy);
  state.discardPile.push(id);
  state.selectedCardId = null;
  state.awaitingTarget = false;

  if (id === 'shred') drawCards(state, 1);
  checkCombatEnd(state);
  return true;
}

export function playCard(state: CombatState, handIndex: number): boolean {
  const id = state.hand[handIndex];
  if (!id || !canPlayCard(state, handIndex)) return false;
  const card = CARDS[id]!;

  if (card.target === 'enemy') return false;

  state.energy -= card.cost;
  state.hand.splice(handIndex, 1);
  applyCardEffects(state, card, undefined);
  state.discardPile.push(id);
  state.selectedCardId = null;
  state.awaitingTarget = false;

  if (id === 'shred') drawCards(state, 1);
  checkCombatEnd(state);
  return true;
}

function applyCardEffects(
  state: CombatState,
  card: CardDef,
  target?: Combatant,
): void {
  for (const effect of card.effects) {
    const value = modifyEffectValue(effect, card, state.talents);
    switch (effect.kind) {
      case 'damage': {
        if (!target) break;
        const dmg = computeCardDamage(card, value, state, target);
        const dealt = applyDamage(target, dmg, state, 'player');
        state.log.push({
          text: `${card.name}: ${dealt} damage to ${target.name}.`,
          color: '#ffb347',
        });
        consumeEarthAndMoon(target, card, state);
        break;
      }
      case 'aoeDamage': {
        const living = state.enemies.filter((e) => e.hp > 0);
        const targets = effect.maxTargets
          ? living.slice(0, effect.maxTargets)
          : living;
        const dmg = computeCardDamage(card, value, state);
        for (const e of targets) {
          const dealt = applyDamage(e, dmg, state, 'player');
          state.log.push({
            text: `${card.name}: ${dealt} to ${e.name}.`,
            color: '#ffb347',
          });
        }
        break;
      }
      case 'block': {
        state.player.block += value;
        state.log.push({
          text: `Gained ${value} Block.`,
          color: '#7dd3fc',
        });
        break;
      }
      case 'heal': {
        const healed = heal(state.player, value);
        state.log.push({ text: `Healed ${healed} HP.`, color: '#86efac' });
        break;
      }
      case 'healOverTime': {
        const perTick = Math.floor(value / (effect.duration ?? 1));
        addStatus(state.player, {
          id: uid('regen'),
          name: 'Rejuvenation',
          kind: 'regen',
          value: perTick,
          duration: effect.duration ?? 1,
        });
        state.log.push({
          text: `Rejuvenation: ${perTick} heal/turn for ${effect.duration} turns.`,
          color: '#86efac',
        });
        break;
      }
      case 'damageOverTime': {
        const duration = effect.duration ?? 1;
        if (card.target === 'allEnemies') {
          for (const e of state.enemies.filter((en) => en.hp > 0)) {
            applyBleed(e, value, duration, state, card.name);
          }
        } else if (target) {
          applyBleed(target, value, duration, state, card.name);
        }
        break;
      }
      case 'cleanse': {
        const debuffs: StatusEffect['kind'][] = ['poison', 'bleed', 'weak', 'vulnerable'];
        const before = state.player.statuses.length;
        state.player.statuses = state.player.statuses.filter(
          (s) => !debuffs.includes(s.kind),
        );
        const removed = before - state.player.statuses.length;
        state.log.push({
          text: `${card.name} removed ${removed} debuff(s).`,
          color: '#fde68a',
        });
        break;
      }
      case 'earthAndMoon': {
        if (!target) break;
        addStatus(target, {
          id: uid('eam'),
          name: 'Earth and Moon',
          kind: 'earthAndMoon',
          value,
          duration: 99,
        });
        state.log.push({
          text: `Earth and Moon: next Wrath or Starfire deals +${value}% to ${target.name}.`,
          color: '#c4b5fd',
        });
        break;
      }
      case 'draw': {
        drawCards(state, value);
        state.log.push({
          text: `Drew ${value} card${value === 1 ? '' : 's'}.`,
          color: '#e2e8f0',
        });
        break;
      }
      case 'spellPower': {
        state.spellPowerBonus += value;
        state.log.push({
          text: `Spell power +${value}.`,
          color: '#a78bfa',
        });
        break;
      }
      case 'strength': {
        addStatus(state.player, {
          id: uid('str'),
          name: "Tiger's Fury",
          kind: 'strength',
          value,
          duration: 99,
          stacks: true,
        });
        state.log.push({
          text: `Gained ${value} Strength.`,
          color: '#fbbf24',
        });
        break;
      }
      case 'vulnerable': {
        if (!target) break;
        addStatus(target, {
          id: uid('vuln'),
          name: 'Vulnerable',
          kind: 'vulnerable',
          value: 1,
          duration: effect.duration ?? 2,
        });
        state.log.push({
          text: `${target.name} is Vulnerable for ${effect.duration ?? 2} turns.`,
          color: '#fb923c',
        });
        break;
      }
      case 'energy': {
        state.energy += value;
        state.log.push({
          text: `Gained ${value} Energy.`,
          color: '#fde68a',
        });
        break;
      }
    }
  }
}

function tickStatuses(c: Combatant, state: CombatState, isPlayer: boolean): void {
  const remaining: StatusEffect[] = [];
  for (const s of c.statuses) {
    if (s.kind === 'regen') {
      const healed = heal(c, s.value);
      if (isPlayer) {
        state.log.push({ text: `Regen healed ${healed}.`, color: '#86efac' });
      }
    }
    if (s.kind === 'bleed' || s.kind === 'poison') {
      c.hp = Math.max(0, c.hp - s.value);
      state.log.push({
        text: `${c.name} takes ${s.value} from ${s.name}.`,
        color: '#f87171',
      });
    }
    // Earth and Moon lasts until Wrath/Starfire consumes it.
    if (s.kind === 'earthAndMoon') {
      remaining.push(s);
      continue;
    }
    s.duration -= 1;
    if (s.duration > 0) remaining.push(s);
  }
  c.statuses = remaining;
}

/** One animated beat of the enemy turn. */
export type EnemyTurnStep =
  | { kind: 'statusTick'; enemyId: string }
  | { kind: 'intent'; enemyId: string; intent: EnemyIntent };

/** End the player turn and return the enemy action queue (not yet applied). */
export function endPlayerTurn(state: CombatState): EnemyTurnStep[] {
  if (state.phase !== 'player') return [];
  state.awaitingTarget = false;
  state.selectedCardId = null;

  // Discard hand
  state.discardPile.push(...state.hand);
  state.hand = [];

  state.phase = 'enemy';
  state.log.push({ text: '— Enemy Turn —', color: '#fca5a5' });
  return buildEnemyTurnSteps(state);
}

function buildEnemyTurnSteps(state: CombatState): EnemyTurnStep[] {
  const steps: EnemyTurnStep[] = [];
  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) continue;
    steps.push({ kind: 'statusTick', enemyId: enemy.id });
    const intent = enemy.intent ?? pickIntent(enemy.enemyDefId!);
    steps.push({ kind: 'intent', enemyId: enemy.id, intent: { ...intent } });
  }
  return steps;
}

/**
 * Apply a single enemy-turn step. Returns false if combat has ended
 * (victory/defeat) and the sequence should stop.
 */
export function applyEnemyTurnStep(state: CombatState, step: EnemyTurnStep): boolean {
  if (isCombatOver(state)) return false;

  const enemy = state.enemies.find((e) => e.id === step.enemyId);
  if (!enemy || enemy.hp <= 0) {
    checkCombatEnd(state);
    return !isCombatOver(state);
  }

  if (step.kind === 'statusTick') {
    tickStatuses(enemy, state, false);
  } else {
    resolveIntent(state, enemy, step.intent);
    if (enemy.hp > 0 && enemy.enemyDefId) {
      enemy.intent = pickIntent(enemy.enemyDefId);
    }
  }

  checkCombatEnd(state);
  return !isCombatOver(state);
}

function isCombatOver(state: CombatState): boolean {
  return state.phase === 'victory' || state.phase === 'defeat';
}

/** Start the next player turn after the enemy sequence finishes. */
export function beginPlayerTurn(state: CombatState): void {
  if (state.phase === 'victory' || state.phase === 'defeat') return;

  // Block clears at start of YOUR turn (Slay the Spire style).
  state.turn += 1;
  state.phase = 'player';
  state.player.block = 0;
  tickStatuses(state.player, state, true);
  if (state.player.hp <= 0) {
    state.phase = 'defeat';
    state.log.push({ text: 'You have fallen...', color: '#ef4444' });
    return;
  }
  state.energy = state.energyMax;
  drawCards(state, 5);
  state.log.push({ text: `— Turn ${state.turn} —`, color: '#e2e8f0' });
}

function resolveIntent(
  state: CombatState,
  enemy: Combatant,
  intent: EnemyIntent,
): void {
  const strength = getStatus(enemy, 'strength');
  switch (intent.type) {
    case 'attack': {
      let dmg = intent.value + (strength?.value ?? 0);
      const dealt = applyDamage(state.player, dmg, state);
      state.log.push({
        text: `${enemy.name} attacks for ${dealt}!`,
        color: '#fca5a5',
      });
      break;
    }
    case 'defend': {
      enemy.block += intent.value;
      state.log.push({
        text: `${enemy.name} gains ${intent.value} Block.`,
        color: '#7dd3fc',
      });
      break;
    }
    case 'buff': {
      addStatus(enemy, {
        id: uid('str'),
        name: 'Strength',
        kind: 'strength',
        value: intent.value,
        duration: 99,
        stacks: true,
      });
      state.log.push({
        text: `${enemy.name} gains +${intent.value} Strength.`,
        color: '#fbbf24',
      });
      break;
    }
    case 'debuff': {
      if (intent.label.toLowerCase().includes('venom') || intent.value >= 4) {
        addStatus(state.player, {
          id: uid('poison'),
          name: 'Poison',
          kind: 'poison',
          value: intent.value,
          duration: 3,
          stacks: true,
        });
        state.log.push({
          text: `${enemy.name} poisons you (${intent.value}/turn).`,
          color: '#a3e635',
        });
      } else if (intent.label.toLowerCase().includes('curse')) {
        addStatus(state.player, {
          id: uid('weak'),
          name: 'Weak',
          kind: 'weak',
          value: 1,
          duration: intent.value || 2,
        });
        state.log.push({
          text: `${enemy.name} weakens you.`,
          color: '#c4b5fd',
        });
      } else {
        addStatus(state.player, {
          id: uid('vuln'),
          name: 'Vulnerable',
          kind: 'vulnerable',
          value: 1,
          duration: 2,
        });
        state.log.push({
          text: `${enemy.name} applies Vulnerable.`,
          color: '#fb923c',
        });
      }
      break;
    }
    case 'heal': {
      const healed = heal(enemy, intent.value);
      state.log.push({
        text: `${enemy.name} heals ${healed}.`,
        color: '#86efac',
      });
      break;
    }
  }
}

function checkCombatEnd(state: CombatState): void {
  if (state.player.hp <= 0) {
    state.phase = 'defeat';
    state.log.push({ text: 'Defeat...', color: '#ef4444' });
    return;
  }
  if (state.enemies.every((e) => e.hp <= 0)) {
    state.phase = 'victory';
    state.log.push({ text: 'Victory! The path opens.', color: '#4ade80' });
  }
}

export function cancelTarget(state: CombatState): void {
  state.awaitingTarget = false;
  state.selectedCardId = null;
}
