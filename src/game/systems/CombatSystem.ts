import { CARDS } from '../data/cards';
import { getClass } from '../data/classes';
import { ENEMIES } from '../data/enemies';
import {
  hasTalentSpecial,
  modifyEffectValue,
  talentAlsoVulnerable,
  talentBleedKillEnergy,
  talentBlockCarryoverPct,
  talentBlockGainHeal,
  talentBlockPerHot,
  talentCardCostReduce,
  talentCleanseOnPlay,
  talentCombatStartDraw,
  talentDamageGrantsBlock,
  talentDotExtraDuration,
  talentDotTickHeal,
  talentExhaustBlock,
  talentFreeSpellDraw,
  talentHealPlayBlock,
  talentHotExtraDuration,
  talentHotTickBlock,
  talentKillDraw,
  talentKillHeal,
  talentNthFormSpellFree,
  talentPlayDrawAmount,
  talentShredExhaustDraw,
  talentSpellPowerBonus,
  talentStartTurnBlock,
  talentStartTurnDraw,
  talentStartTurnEnergy,
} from '../data/talents';
import type {
  CardDef,
  Combatant,
  EnemyIntent,
  Form,
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
  /** Form spell play counts for nth-free talents (e.g. Shooting Stars). */
  formSpellCounts: Partial<Record<Form, number>>;
  /** Energy granted mid-enemy-turn (applied at the start of your next turn). */
  pendingEnergy: number;
  /** True after a once-per-turn playDraw talent has fired this turn. */
  playDrawUsedThisTurn: boolean;
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

const MAX_COMBAT_ENEMIES = 4;
const ENRAGE_HP_RATIO = 0.4;

function pickIntent(enemyId: string, combatant?: Combatant): EnemyIntent {
  const def = ENEMIES[enemyId]!;
  const enraged =
    !!combatant &&
    !!def.enrageIntents?.length &&
    combatant.hp / combatant.maxHp <= ENRAGE_HP_RATIO;
  const pool = enraged ? def.enrageIntents! : def.intents;
  const chosen = pool[Math.floor(Math.random() * pool.length)]!;
  return { ...chosen };
}

function createEnemyCombatant(enemyDefId: string): Combatant {
  const def = ENEMIES[enemyDefId]!;
  return {
    id: uid(enemyDefId),
    name: def.name,
    maxHp: def.maxHp,
    hp: def.maxHp,
    block: 0,
    statuses: [],
    art: def.art,
    enemyDefId,
    intent: pickIntent(enemyDefId),
  };
}

export function startCombat(run: RunState, enemyIds: string[]): CombatState {
  const enemies: Combatant[] = enemyIds.map((id) => createEnemyCombatant(id));

  const talentSp = talentSpellPowerBonus(run.talents);
  const cls = getClass(run.classId);
  const state: CombatState = {
    player: {
      id: 'player',
      name: cls.name,
      maxHp: run.maxHp,
      hp: run.hp,
      block: 0,
      statuses: [],
      isPlayer: true,
      art: cls.heroArt,
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
    formSpellCounts: {},
    pendingEnergy: 0,
    playDrawUsedThisTurn: false,
  };

  if (talentSp > 0) {
    state.log.push({
      text: `Spell Power: +${talentSp}.`,
      color: '#a78bfa',
    });
  }

  drawCards(state, 5);
  const bonusDraw = talentCombatStartDraw(run.talents);
  if (bonusDraw > 0) {
    drawCards(state, bonusDraw);
    state.log.push({
      text: `Combat start: drew ${bonusDraw} extra.`,
      color: '#e2e8f0',
    });
  }
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

  const prevHp = target.hp;
  const blocked = Math.min(target.block, amount);
  target.block -= blocked;
  amount -= blocked;
  target.hp = Math.max(0, target.hp - amount);
  maybeTriggerEnrage(target, state);

  if (
    sourceLabel === 'player' &&
    !target.isPlayer &&
    prevHp > 0 &&
    target.hp <= 0
  ) {
    onEnemyKilledByPlayer(state);
  }

  return amount + blocked;
}

function onEnemyKilledByPlayer(state: CombatState): void {
  const draw = talentKillDraw(state.talents);
  if (draw > 0) {
    drawCards(state, draw);
    state.log.push({ text: `Kill: drew ${draw}.`, color: '#e2e8f0' });
  }
  const healAmt = talentKillHeal(state.talents);
  if (healAmt > 0) {
    const healed = heal(state.player, healAmt);
    if (healed > 0) {
      state.log.push({ text: `Kill: healed ${healed}.`, color: '#86efac' });
    }
  }
}

function maybeTriggerEnrage(enemy: Combatant, state: CombatState): void {
  if (enemy.isPlayer || !enemy.enemyDefId || enemy.enraged || enemy.hp <= 0) return;
  const def = ENEMIES[enemy.enemyDefId];
  if (!def?.enrageIntents?.length) return;
  if (enemy.hp / enemy.maxHp <= ENRAGE_HP_RATIO) {
    enemy.enraged = true;
    state.log.push({
      text: `${enemy.name} enrages!`,
      color: '#f97316',
    });
  }
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
  // Spell power scales caster schools — Boomkin, Holy, Shadow, Discipline.
  let dmg = base;
  if (
    card.form === 'boomkin' ||
    card.form === 'holy' ||
    card.form === 'shadow' ||
    card.form === 'discipline'
  ) {
    dmg += state.spellPowerBonus + Math.floor(state.spellPowerBonus * 0.5);
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
  if (
    card.id === 'shadow_word_death' &&
    target &&
    target.hp < target.maxHp / 2
  ) {
    dmg += 12;
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
  // Keep each DoT as its own status so they display and tick independently.
  target.statuses.push({
    id: uid('bleed'),
    name: sourceName,
    kind: 'bleed',
    value: perTick,
    duration,
  });
  state.log.push({
    text: `${sourceName}: ${perTick}/turn for ${duration} turns on ${target.name}.`,
    color: '#f87171',
  });
}

function consumeEarthAndMoon(target: Combatant, card: CardDef, state: CombatState): void {
  if (card.id !== 'starfire' && card.id !== 'wrath') return;
  if (hasTalentSpecial(state.talents, 'earthAndMoonPersistent')) return;
  const bonus = getStatus(target, 'earthAndMoon');
  if (!bonus) return;
  target.statuses = target.statuses.filter((s) => s.kind !== 'earthAndMoon');
  state.log.push({ text: 'Earth and Moon consumed.', color: '#c4b5fd' });
}

function anyEnemyBleeding(state: CombatState): boolean {
  return state.enemies.some((e) => e.hp > 0 && !!getStatus(e, 'bleed'));
}

/** Effective energy cost after transformative talents. */
export function getCardPlayCost(
  state: CombatState,
  card: CardDef,
  target?: Combatant,
): number {
  let cost = card.cost;

  if (
    card.id === 'ferocious_bite' &&
    hasTalentSpecial(state.talents, 'bleedBiteFree')
  ) {
    if (target) {
      if (getStatus(target, 'bleed')) return 0;
    } else if (anyEnemyBleeding(state)) {
      return 0;
    }
  }

  const every = talentNthFormSpellFree(state.talents, card.form);
  if (every != null && every > 0) {
    const played = state.formSpellCounts[card.form] ?? 0;
    if ((played + 1) % every === 0) return 0;
  }

  cost -= talentCardCostReduce(state.talents, card.id);
  return Math.max(0, cost);
}

function resolveCardDestination(state: CombatState, cardId: string): void {
  const shredDraw = talentShredExhaustDraw(state.talents);
  if (cardId === 'shred' && shredDraw != null) {
    state.exhaustPile.push(cardId);
    const block = talentExhaustBlock(state.talents);
    if (block > 0) {
      state.player.block += block;
      state.log.push({ text: `Exhaust: gained ${block} Block.`, color: '#7dd3fc' });
    }
    return;
  }
  state.discardPile.push(cardId);
}

function afterCardPlayed(
  state: CombatState,
  card: CardDef,
  paidCost: number,
  dealtDamage: boolean,
  target?: Combatant,
): void {
  const every = talentNthFormSpellFree(state.talents, card.form);
  if (every != null) {
    state.formSpellCounts[card.form] = (state.formSpellCounts[card.form] ?? 0) + 1;
    if (paidCost === 0 && (state.formSpellCounts[card.form] ?? 0) % every === 0) {
      const draw = talentFreeSpellDraw(state.talents);
      if (draw > 0) {
        drawCards(state, draw);
        state.log.push({
          text: `Shooting Stars: drew ${draw}.`,
          color: '#c4b5fd',
        });
      }
    }
  }

  const healBlock = talentHealPlayBlock(state.talents, card);
  if (healBlock > 0) {
    state.player.block += healBlock;
    state.log.push({
      text: `Gained ${healBlock} Block from healing.`,
      color: '#7dd3fc',
    });
  }

  if (dealtDamage) {
    const dmgBlock = talentDamageGrantsBlock(state.talents, card);
    if (dmgBlock > 0) {
      state.player.block += dmgBlock;
      state.log.push({
        text: `Gained ${dmgBlock} Block from damage.`,
        color: '#7dd3fc',
      });
    }
  }

  if (talentCleanseOnPlay(state.talents, card)) {
    const debuffs: StatusEffect['kind'][] = ['poison', 'bleed', 'weak', 'vulnerable'];
    const before = state.player.statuses.length;
    state.player.statuses = state.player.statuses.filter(
      (s) => !debuffs.includes(s.kind),
    );
    const removed = before - state.player.statuses.length;
    if (removed > 0) {
      state.log.push({
        text: `${card.name} cleansed ${removed} debuff(s).`,
        color: '#fde68a',
      });
    }
  }

  const vulnDur = talentAlsoVulnerable(state.talents, card.id);
  if (vulnDur != null) {
    const vulnTargets =
      card.target === 'allEnemies'
        ? state.enemies.filter((e) => e.hp > 0)
        : target
          ? [target]
          : [];
    for (const t of vulnTargets) {
      addStatus(t, {
        id: uid('vuln'),
        name: 'Vulnerable',
        kind: 'vulnerable',
        value: 1,
        duration: vulnDur,
      });
      state.log.push({
        text: `${t.name} is Vulnerable for ${vulnDur} turns.`,
        color: '#fb923c',
      });
    }
  }

  const playDraw = talentPlayDrawAmount(
    state.talents,
    card,
    state.playDrawUsedThisTurn,
  );
  if (playDraw > 0) {
    drawCards(state, playDraw);
    state.playDrawUsedThisTurn = true;
    state.log.push({
      text: `Drew ${playDraw} from ${card.name}.`,
      color: '#e2e8f0',
    });
  }

  if (card.id === 'shred') {
    const shredDraw = talentShredExhaustDraw(state.talents);
    drawCards(state, shredDraw ?? 1);
  }

  if (card.id === 'void_eruption' && hasTalentSpecial(state.talents, 'voidDetonateDots')) {
    detonateEnemyDots(state);
  }
}

function detonateEnemyDots(state: CombatState): void {
  for (const enemy of state.enemies.filter((e) => e.hp > 0)) {
    const dots = enemy.statuses.filter((s) => s.kind === 'bleed' || s.kind === 'poison');
    if (!dots.length) continue;
    let total = 0;
    for (const d of dots) total += d.value * Math.max(1, d.duration);
    enemy.statuses = enemy.statuses.filter(
      (s) => s.kind !== 'bleed' && s.kind !== 'poison',
    );
    const dealt = applyDamage(enemy, total, state, 'player');
    state.log.push({
      text: `Void Eruption detonates DoTs for ${dealt} on ${enemy.name}.`,
      color: '#a78bfa',
    });
  }
}

export function canPlayCard(
  state: CombatState,
  handIndex: number,
  target?: Combatant,
): boolean {
  if (state.phase !== 'player') return false;
  const id = state.hand[handIndex];
  if (!id) return false;
  const card = CARDS[id];
  if (!card) return false;
  return state.energy >= getCardPlayCost(state, card, target);
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
  if (!id) return false;
  const card = CARDS[id]!;
  if (card.target !== 'enemy') return false;
  const enemy = state.enemies.find((e) => e.id === enemyId && e.hp > 0);
  if (!enemy) return false;
  if (!canPlayCard(state, handIndex, enemy)) return false;

  const cost = getCardPlayCost(state, card, enemy);
  state.energy -= cost;
  state.hand.splice(handIndex, 1);
  const dealt = applyCardEffects(state, card, enemy);
  resolveCardDestination(state, id);
  state.selectedCardId = null;
  state.awaitingTarget = false;

  afterCardPlayed(state, card, cost, dealt, enemy);
  checkCombatEnd(state);
  return true;
}

export function playCard(state: CombatState, handIndex: number): boolean {
  const id = state.hand[handIndex];
  if (!id || !canPlayCard(state, handIndex)) return false;
  const card = CARDS[id]!;

  if (card.target === 'enemy') return false;

  const cost = getCardPlayCost(state, card);
  state.energy -= cost;
  state.hand.splice(handIndex, 1);
  const dealt = applyCardEffects(state, card, undefined);
  resolveCardDestination(state, id);
  state.selectedCardId = null;
  state.awaitingTarget = false;

  afterCardPlayed(state, card, cost, dealt);
  checkCombatEnd(state);
  return true;
}

function applyCardEffects(
  state: CombatState,
  card: CardDef,
  target?: Combatant,
): boolean {
  let dealtDamage = false;

  // Penance: damage and heal scale with half current Block (armor).
  if (card.id === 'penance') {
    const halfBlock = Math.floor(state.player.block / 2);
    const dmgEffect = card.effects.find((e) => e.kind === 'damage');
    const healEffect = card.effects.find((e) => e.kind === 'heal');
    if (dmgEffect && target) {
      const base = modifyEffectValue(
        { ...dmgEffect, value: halfBlock },
        card,
        state.talents,
      );
      const dmg = computeCardDamage(card, base, state, target);
      const dealt = applyDamage(target, dmg, state, 'player');
      dealtDamage = true;
      state.log.push({
        text: `${card.name}: ${dealt} damage to ${target.name}.`,
        color: '#ffb347',
      });
    }
    if (healEffect) {
      const healAmt = modifyEffectValue(
        { ...healEffect, value: halfBlock },
        card,
        state.talents,
      );
      const healed = heal(state.player, healAmt);
      state.log.push({ text: `Healed ${healed} HP.`, color: '#86efac' });
    }
    return dealtDamage;
  }

  for (const effect of card.effects) {
    const value = modifyEffectValue(effect, card, state.talents);
    switch (effect.kind) {
      case 'damage': {
        if (!target) break;
        const dmg = computeCardDamage(card, value, state, target);
        const dealt = applyDamage(target, dmg, state, 'player');
        dealtDamage = true;
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
          dealtDamage = true;
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
        const blockHeal = talentBlockGainHeal(state.talents);
        if (blockHeal > 0) {
          const healed = heal(state.player, blockHeal);
          if (healed > 0) {
            state.log.push({
              text: `Focused Will healed ${healed}.`,
              color: '#86efac',
            });
          }
        }
        break;
      }
      case 'heal': {
        const healed = heal(state.player, value);
        state.log.push({ text: `Healed ${healed} HP.`, color: '#86efac' });
        break;
      }
      case 'healOverTime': {
        const baseDuration = effect.duration ?? 1;
        const duration =
          baseDuration + talentHotExtraDuration(state.talents, card.id);
        // Keep tick strength from the base duration; extra turns are bonus healing.
        const perTick = Math.floor(value / Math.max(1, baseDuration));
        addStatus(state.player, {
          id: uid('regen'),
          name: card.name,
          kind: 'regen',
          value: perTick,
          duration,
        });
        state.log.push({
          text: `${card.name}: ${perTick} heal/turn for ${duration} turns.`,
          color: '#86efac',
        });
        break;
      }
      case 'damageOverTime': {
        const duration =
          (effect.duration ?? 1) + talentDotExtraDuration(state.talents, card.id);
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
        const duration = effect.duration ?? 2;
        const vulnTargets =
          card.target === 'allEnemies'
            ? state.enemies.filter((e) => e.hp > 0)
            : target
              ? [target]
              : [];
        for (const t of vulnTargets) {
          addStatus(t, {
            id: uid('vuln'),
            name: 'Vulnerable',
            kind: 'vulnerable',
            value: 1,
            duration,
          });
          state.log.push({
            text: `${t.name} is Vulnerable for ${duration} turns.`,
            color: '#fb923c',
          });
        }
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

  return dealtDamage;
}

function tickStatuses(c: Combatant, state: CombatState, isPlayer: boolean): void {
  const remaining: StatusEffect[] = [];
  for (const s of c.statuses) {
    if (s.kind === 'regen') {
      const healed = heal(c, s.value);
      if (isPlayer) {
        state.log.push({ text: `Regen healed ${healed}.`, color: '#86efac' });
        const tickBlock = talentHotTickBlock(state.talents, s.name);
        if (tickBlock > 0) {
          state.player.block += tickBlock;
          state.log.push({
            text: `${s.name}: +${tickBlock} Block.`,
            color: '#7dd3fc',
          });
        }
      }
    }
    if (s.kind === 'bleed' || s.kind === 'poison') {
      c.hp = Math.max(0, c.hp - s.value);
      state.log.push({
        text: `${c.name} takes ${s.value} from ${s.name}.`,
        color: '#f87171',
      });
      if (!isPlayer) {
        const leech = talentDotTickHeal(state.talents);
        if (leech > 0) {
          const healed = heal(state.player, leech);
          state.log.push({
            text: `Vampiric Embrace healed ${healed}.`,
            color: '#86efac',
          });
        }
        if (c.hp <= 0) {
          const energy = talentBleedKillEnergy(state.talents);
          if (energy > 0 && s.kind === 'bleed') {
            state.pendingEnergy += energy;
            state.log.push({
              text: `Blood in the Water: +${energy} Energy next turn.`,
              color: '#fde68a',
            });
          }
        }
      }
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
      maybeTriggerEnrage(enemy, state);
      enemy.intent = pickIntent(enemy.enemyDefId, enemy);
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

  // Block clears at start of YOUR turn, unless talents carry some over.
  state.turn += 1;
  state.phase = 'player';
  state.playDrawUsedThisTurn = false;
  const carryPct = talentBlockCarryoverPct(state.talents);
  const carried =
    carryPct > 0 ? Math.floor(state.player.block * (carryPct / 100)) : 0;
  state.player.block = carried;
  if (carried > 0) {
    state.log.push({
      text: `Borrowed Time: ${carried} Block carries over.`,
      color: '#7dd3fc',
    });
  }

  tickStatuses(state.player, state, true);
  if (state.player.hp <= 0) {
    state.phase = 'defeat';
    state.log.push({ text: 'You have fallen...', color: '#ef4444' });
    return;
  }

  const perHot = talentBlockPerHot(state.talents);
  if (perHot > 0) {
    const hots = state.player.statuses.filter((s) => s.kind === 'regen').length;
    if (hots > 0) {
      const gained = perHot * hots;
      state.player.block += gained;
      state.log.push({
        text: `Tree of Life: +${gained} Block from ${hots} HoT(s).`,
        color: '#7dd3fc',
      });
    }
  }

  const turnBlock = talentStartTurnBlock(state.talents);
  if (turnBlock > 0) {
    state.player.block += turnBlock;
    state.log.push({
      text: `Start of turn: +${turnBlock} Block.`,
      color: '#7dd3fc',
    });
  }

  const turnEnergy = talentStartTurnEnergy(state.talents);
  state.energy = state.energyMax + state.pendingEnergy + turnEnergy;
  if (state.pendingEnergy > 0) {
    state.log.push({
      text: `Blood in the Water: +${state.pendingEnergy} Energy.`,
      color: '#fde68a',
    });
    state.pendingEnergy = 0;
  }
  if (turnEnergy > 0) {
    state.log.push({
      text: `Start of turn: +${turnEnergy} Energy.`,
      color: '#fde68a',
    });
  }

  drawCards(state, 5);
  const turnDraw = talentStartTurnDraw(state.talents);
  if (turnDraw > 0) {
    drawCards(state, turnDraw);
    state.log.push({
      text: `Start of turn: drew ${turnDraw}.`,
      color: '#e2e8f0',
    });
  }
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
    case 'summon': {
      const living = state.enemies.filter((e) => e.hp > 0).length;
      const summonId = intent.summonId ?? 'grove_wisp';
      const summonDef = ENEMIES[summonId];
      if (!summonDef) {
        state.log.push({
          text: `${enemy.name} fails to summon.`,
          color: '#9aa5b1',
        });
        break;
      }
      if (living >= MAX_COMBAT_ENEMIES) {
        // Field is full — siphon life instead so the intent still matters.
        const healed = heal(enemy, Math.max(8, intent.value * 8));
        state.log.push({
          text: `${enemy.name} cannot summon — absorbs ${healed} HP instead.`,
          color: '#86efac',
        });
        break;
      }
      const count = Math.max(1, intent.value);
      let spawned = 0;
      for (let i = 0; i < count; i++) {
        if (state.enemies.filter((e) => e.hp > 0).length >= MAX_COMBAT_ENEMIES) break;
        state.enemies.push(createEnemyCombatant(summonId));
        spawned += 1;
      }
      state.log.push({
        text:
          spawned > 1
            ? `${enemy.name} summons ${spawned} ${summonDef.name}s!`
            : `${enemy.name} summons a ${summonDef.name}!`,
        color: '#c4b5fd',
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
