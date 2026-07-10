import { CARDS, CURSE_CARD_ID } from '../data/cards';
import { getClass } from '../data/classes';
import { ENEMIES } from '../data/enemies';
import {
  modifyEffectValue,
  talentSpellPowerBonus,
} from '../data/talents';
import type {
  CardDef,
  CardEffect,
  CardTypeTag,
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
  /** Curse (and similar) ids to merge into the run deck after victory. */
  pendingDeckCards: string[];
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
const CURSE_DRAW_DAMAGE = 5;
const WEAK_MULTIPLIER = 0.75;
const MAX_EFFECT_DEPTH = 6;

/** Prevent echo / retrieve recursion from looping forever. */
let effectDepth = 0;

export function cardHasType(card: CardDef | undefined, type: CardTypeTag): boolean {
  if (!card || card.curse) return false;
  switch (type) {
    case 'attack':
      return card.effects.some((e) =>
        ['damage', 'aoeDamage', 'damageOverTime', 'randomDamage'].includes(e.kind),
      );
    case 'heal':
      return card.effects.some((e) => e.kind === 'heal' || e.kind === 'healOverTime');
    case 'block':
      return card.effects.some((e) => e.kind === 'block' || e.kind === 'thorns');
    default:
      return false;
  }
}

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
    pendingDeckCards: [],
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

function onCardDrawn(state: CombatState, cardId: string): void {
  const def = CARDS[cardId];
  if (!def?.curse) return;
  const dealt = applyDamage(state.player, CURSE_DRAW_DAMAGE, state);
  state.log.push({
    text: `${def.name}! You take ${dealt} damage.`,
    color: '#c4b5fd',
  });
  checkCombatEnd(state);
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
    if (card) {
      state.hand.push(card);
      onCardDrawn(state, card);
      if (state.phase === 'defeat') break;
    }
  }
}

function reshuffleDiscardIfNeeded(state: CombatState): boolean {
  if (state.drawPile.length > 0) return true;
  if (state.discardPile.length === 0) return false;
  state.drawPile = shuffle(state.discardPile);
  state.discardPile = [];
  state.log.push({ text: 'Shuffled discard into draw pile.', color: '#9aa5b1' });
  return true;
}

function drawTypedCards(state: CombatState, count: number, type: CardTypeTag): number {
  let drawn = 0;
  for (let i = 0; i < count; i++) {
    if (state.hand.length >= 10) break;
    reshuffleDiscardIfNeeded(state);
    let idx = state.drawPile.findIndex((id) => cardHasType(CARDS[id], type));
    if (idx < 0 && state.discardPile.length > 0) {
      reshuffleDiscardIfNeeded(state);
      idx = state.drawPile.findIndex((id) => cardHasType(CARDS[id], type));
    }
    if (idx < 0) break;
    const [cardId] = state.drawPile.splice(idx, 1);
    if (!cardId) break;
    state.hand.push(cardId);
    onCardDrawn(state, cardId);
    drawn += 1;
    if (state.phase === 'defeat') break;
  }
  return drawn;
}

function getStatus(c: Combatant, kind: StatusEffect['kind']): StatusEffect | undefined {
  return c.statuses.find((s) => s.kind === kind);
}

function addStatus(c: Combatant, status: StatusEffect): void {
  const existing = getStatus(c, status.kind);
  if (status.kind === 'echo') {
    const match = c.statuses.find(
      (s) =>
        s.kind === 'echo' &&
        s.echoFrom === status.echoFrom &&
        s.echoTo === status.echoTo,
    );
    if (match) {
      match.value = status.value;
      match.duration = Math.max(match.duration, status.duration);
      return;
    }
    c.statuses.push({ ...status });
    return;
  }
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
    amount = Math.floor(amount * WEAK_MULTIPLIER);
  }

  const vuln = getStatus(target, 'vulnerable');
  if (vuln) amount = Math.floor(amount * 1.5);

  const blocked = Math.min(target.block, amount);
  target.block -= blocked;
  amount -= blocked;
  target.hp = Math.max(0, target.hp - amount);
  maybeTriggerEnrage(target, state);
  return amount + blocked;
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

function triggerEcho(state: CombatState, from: CardTypeTag): void {
  if (effectDepth >= MAX_EFFECT_DEPTH) return;
  const echoes = state.player.statuses.filter(
    (s) => s.kind === 'echo' && s.echoFrom === from && s.echoTo && s.echoTo !== from,
  );
  for (const echo of echoes) {
    const to = echo.echoTo!;
    effectDepth += 1;
    try {
      if (to === 'heal') {
        const healed = heal(state.player, echo.value);
        state.log.push({
          text: `Echo: healed ${healed}.`,
          color: '#86efac',
        });
      } else if (to === 'block') {
        state.player.block += echo.value;
        state.log.push({
          text: `Echo: gained ${echo.value} Block.`,
          color: '#7dd3fc',
        });
      } else if (to === 'attack') {
        dealRandomDamage(state, echo.value, undefined);
      }
    } finally {
      effectDepth -= 1;
    }
  }
}

function gainBlock(state: CombatState, amount: number, trigger = true): void {
  state.player.block += amount;
  state.log.push({
    text: `Gained ${amount} Block.`,
    color: '#7dd3fc',
  });
  if (trigger) triggerEcho(state, 'block');
}

function healPlayer(state: CombatState, amount: number, trigger = true): number {
  const healed = heal(state.player, amount);
  state.log.push({ text: `Healed ${healed} HP.`, color: '#86efac' });
  if (trigger && healed > 0) triggerEcho(state, 'heal');
  return healed;
}

function computeCardDamage(
  card: CardDef,
  base: number,
  state: CombatState,
  target?: Combatant,
): number {
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
  const bonus = getStatus(target, 'earthAndMoon');
  if (!bonus) return;
  target.statuses = target.statuses.filter((s) => s.kind !== 'earthAndMoon');
  state.log.push({ text: 'Earth and Moon consumed.', color: '#c4b5fd' });
}

function dealDamageTo(
  state: CombatState,
  card: CardDef,
  target: Combatant,
  base: number,
  triggerEchoOnHit = true,
): number {
  const dmg = computeCardDamage(card, base, state, target);
  const dealt = applyDamage(target, dmg, state, 'player');
  state.log.push({
    text: `${card.name}: ${dealt} damage to ${target.name}.`,
    color: '#ffb347',
  });
  consumeEarthAndMoon(target, card, state);
  if (triggerEchoOnHit && dealt > 0) triggerEcho(state, 'attack');
  return dealt;
}

function dealRandomDamage(
  state: CombatState,
  base: number,
  card?: CardDef,
): Combatant | undefined {
  const living = state.enemies.filter((e) => e.hp > 0);
  if (!living.length) return undefined;
  const target = living[Math.floor(Math.random() * living.length)]!;
  const fakeCard: CardDef =
    card ??
    ({
      id: 'echo_hit',
      name: 'Echo',
      form: 'bear',
      cost: 0,
      description: '',
      target: 'enemy',
      effects: [],
      art: '',
      rarity: 'common',
    } satisfies CardDef);
  dealDamageTo(state, fakeCard, target, base, !!card);
  if (!card) {
    // Echo random hits still count as attack echoes only from the original hit.
  }
  return target;
}

function discardRandomFromHand(state: CombatState, count: number): string[] {
  const discarded: string[] = [];
  for (let i = 0; i < count; i++) {
    if (state.hand.length === 0) break;
    const idx = Math.floor(Math.random() * state.hand.length);
    const [id] = state.hand.splice(idx, 1);
    if (!id) break;
    state.discardPile.push(id);
    discarded.push(id);
  }
  if (discarded.length) {
    const names = discarded.map((id) => CARDS[id]?.name ?? id).join(', ');
    state.log.push({
      text: `Discarded ${discarded.length}: ${names}.`,
      color: '#94a3b8',
    });
  }
  return discarded;
}

function pickFromDiscard(
  state: CombatState,
  preferType?: CardTypeTag,
): { index: number; id: string } | null {
  if (!state.discardPile.length) return null;
  const indices = state.discardPile
    .map((id, index) => ({ id, index }))
    .filter(({ id }) => {
      const card = CARDS[id];
      if (!card || card.curse) return false;
      if (preferType) return cardHasType(card, preferType);
      return true;
    });
  const pool = indices.length
    ? indices
    : state.discardPile
        .map((id, index) => ({ id, index }))
        .filter(({ id }) => !CARDS[id]?.curse);
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

function retrieveFromDiscard(
  state: CombatState,
  mode: 'hand' | 'play' | 'top',
  preferType?: CardTypeTag,
  sourceCard?: CardDef,
): void {
  const pick = pickFromDiscard(state, preferType);
  if (!pick) {
    state.log.push({ text: 'No cards in discard to retrieve.', color: '#9aa5b1' });
    return;
  }
  const [id] = state.discardPile.splice(pick.index, 1);
  if (!id) return;
  const card = CARDS[id]!;
  if (mode === 'hand') {
    if (state.hand.length >= 10) {
      state.drawPile.push(id);
      state.log.push({
        text: `Hand full — ${card.name} goes on top of your draw pile.`,
        color: '#e2e8f0',
      });
    } else {
      state.hand.push(id);
      state.log.push({
        text: `Added ${card.name} from discard to your hand.`,
        color: '#e2e8f0',
      });
    }
    return;
  }
  if (mode === 'top') {
    state.drawPile.push(id);
    state.log.push({
      text: `Put ${card.name} on top of your draw pile.`,
      color: '#e2e8f0',
    });
    return;
  }
  // play immediately
  state.log.push({
    text: `Playing ${card.name} from discard!`,
    color: '#fde68a',
  });
  let target: Combatant | undefined;
  if (card.target === 'enemy') {
    const living = state.enemies.filter((e) => e.hp > 0);
    target = living.sort((a, b) => a.hp - b.hp)[0];
  }
  if (effectDepth < MAX_EFFECT_DEPTH) {
    effectDepth += 1;
    try {
      applyCardEffects(state, card, target);
    } finally {
      effectDepth -= 1;
    }
  }
  state.discardPile.push(id);
  void sourceCard;
}

export function canPlayCard(state: CombatState, handIndex: number): boolean {
  if (state.phase !== 'player') return false;
  const id = state.hand[handIndex];
  if (!id) return false;
  const card = CARDS[id];
  if (!card || card.unplayable || card.curse) return false;
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

  checkCombatEnd(state);
  return true;
}

function applyDiscardFor(
  state: CombatState,
  card: CardDef,
  effect: CardEffect,
  target?: Combatant,
): void {
  const discardCount = effect.discardCount ?? 1;
  const discarded = discardRandomFromHand(state, discardCount);
  const bonus = (effect.bonusPerDiscard ?? 0) * discarded.length;
  const total = modifyEffectValue(
    { ...effect, value: effect.value + bonus },
    card,
    state.talents,
  );
  const kind = effect.payoffKind ?? 'block';
  if (kind === 'block') {
    gainBlock(state, total);
  } else if (kind === 'heal') {
    healPlayer(state, total);
  } else if (kind === 'damage' && target) {
    dealDamageTo(state, card, target, total);
  } else if (kind === 'randomDamage' || kind === 'damage') {
    const living = state.enemies.filter((e) => e.hp > 0);
    if (living.length) {
      const t = living[Math.floor(Math.random() * living.length)]!;
      dealDamageTo(state, card, t, total);
    }
  }
}

function applyCardEffects(
  state: CombatState,
  card: CardDef,
  target?: Combatant,
): void {
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
      dealDamageTo(state, card, target, base);
    }
    if (healEffect) {
      const healAmt = modifyEffectValue(
        { ...healEffect, value: halfBlock },
        card,
        state.talents,
      );
      healPlayer(state, healAmt);
    }
    return;
  }

  for (const effect of card.effects) {
    const value = modifyEffectValue(effect, card, state.talents);
    switch (effect.kind) {
      case 'damage': {
        if (!target) break;
        dealDamageTo(state, card, target, value);
        break;
      }
      case 'aoeDamage': {
        const living = state.enemies.filter((e) => e.hp > 0);
        const targets = effect.maxTargets
          ? living.slice(0, effect.maxTargets)
          : living;
        for (const e of targets) {
          dealDamageTo(state, card, e, value);
        }
        break;
      }
      case 'randomDamage': {
        const living = state.enemies.filter((e) => e.hp > 0);
        if (!living.length) break;
        const t = living[Math.floor(Math.random() * living.length)]!;
        dealDamageTo(state, card, t, value);
        break;
      }
      case 'recoil': {
        const dealt = applyDamage(state.player, value, state);
        state.log.push({
          text: `Recoil: you take ${dealt} damage.`,
          color: '#f87171',
        });
        break;
      }
      case 'block': {
        gainBlock(state, value);
        break;
      }
      case 'heal': {
        healPlayer(state, value);
        break;
      }
      case 'healOverTime': {
        const perTick = Math.floor(value / (effect.duration ?? 1));
        addStatus(state.player, {
          id: uid('regen'),
          name: card.name,
          kind: 'regen',
          value: perTick,
          duration: effect.duration ?? 1,
        });
        state.log.push({
          text: `${card.name}: ${perTick} heal/turn for ${effect.duration} turns.`,
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
      case 'drawTyped': {
        const type = effect.cardType ?? 'attack';
        const drawn = drawTypedCards(state, value, type);
        const label = type === 'attack' ? 'Attack' : type === 'heal' ? 'Heal' : 'Armor';
        state.log.push({
          text: `Drew ${drawn} ${label} card${drawn === 1 ? '' : 's'}.`,
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
      case 'weaken': {
        const duration = effect.duration ?? 2;
        const weakTargets =
          card.target === 'allEnemies'
            ? state.enemies.filter((e) => e.hp > 0)
            : target
              ? [target]
              : [];
        for (const t of weakTargets) {
          addStatus(t, {
            id: uid('weak'),
            name: 'Weak',
            kind: 'weak',
            value: 1,
            duration,
          });
          state.log.push({
            text: `${t.name} is Weakened for ${duration} turns.`,
            color: '#c4b5fd',
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
      case 'copyCard': {
        const pool = [...state.hand, ...state.discardPile].filter(
          (id) => id !== card.id && !CARDS[id]?.curse,
        );
        for (let i = 0; i < value; i++) {
          if (!pool.length) {
            state.log.push({ text: 'Nothing to copy.', color: '#9aa5b1' });
            break;
          }
          const copyId = pool[Math.floor(Math.random() * pool.length)]!;
          const insertAt = Math.floor(Math.random() * (state.drawPile.length + 1));
          state.drawPile.splice(insertAt, 0, copyId);
          state.log.push({
            text: `Copied ${CARDS[copyId]?.name ?? copyId} into your draw pile.`,
            color: '#e2e8f0',
          });
        }
        break;
      }
      case 'shuffleCurse': {
        for (let i = 0; i < value; i++) {
          const insertAt = Math.floor(Math.random() * (state.drawPile.length + 1));
          state.drawPile.splice(insertAt, 0, CURSE_CARD_ID);
          state.pendingDeckCards.push(CURSE_CARD_ID);
        }
        state.log.push({
          text: `Shuffled ${value} Nightmare into your deck.`,
          color: '#c4b5fd',
        });
        break;
      }
      case 'doubleBuffs': {
        const str = getStatus(state.player, 'strength');
        if (str) str.value *= 2;
        state.spellPowerBonus *= 2;
        state.player.block *= 2;
        for (const s of state.player.statuses) {
          if (
            s.kind === 'regen' ||
            s.kind === 'thorns' ||
            s.kind === 'echo' ||
            s.kind === 'spellPower'
          ) {
            s.value *= 2;
          }
        }
        state.log.push({
          text: 'Your buffs are doubled!',
          color: '#fbbf24',
        });
        break;
      }
      case 'echo': {
        const from = effect.echoFrom;
        const to = effect.echoTo;
        if (!from || !to || from === to) break;
        const duration = effect.duration ?? 99;
        addStatus(state.player, {
          id: uid('echo'),
          name: `${card.name} Echo`,
          kind: 'echo',
          value,
          duration,
          echoFrom: from,
          echoTo: to,
        });
        const fromLabel = from === 'attack' ? 'deal damage' : from === 'heal' ? 'heal' : 'gain Block';
        const toLabel = to === 'attack' ? 'deal damage' : to === 'heal' ? 'heal' : 'gain Block';
        state.log.push({
          text: `Echo: whenever you ${fromLabel}, also ${toLabel} ${value}.`,
          color: '#a78bfa',
        });
        break;
      }
      case 'discardRandom': {
        discardRandomFromHand(state, value);
        break;
      }
      case 'discardDraw': {
        const discardCount = effect.discardCount ?? value;
        const drawCount = effect.drawValue ?? value;
        discardRandomFromHand(state, discardCount);
        drawCards(state, drawCount);
        state.log.push({
          text: `Drew ${drawCount} card${drawCount === 1 ? '' : 's'}.`,
          color: '#e2e8f0',
        });
        break;
      }
      case 'discardFor': {
        applyDiscardFor(state, card, effect, target);
        break;
      }
      case 'retrieveDiscard': {
        retrieveFromDiscard(
          state,
          effect.retrieveMode ?? 'hand',
          effect.cardType,
          card,
        );
        break;
      }
      case 'thorns': {
        const duration = effect.duration ?? 3;
        addStatus(state.player, {
          id: uid('thorns'),
          name: 'Thorns',
          kind: 'thorns',
          value,
          duration,
        });
        state.log.push({
          text: `Thorns ${value} for ${duration} turns.`,
          color: '#86efac',
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
        if (healed > 0) triggerEcho(state, 'heal');
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
      const weak = getStatus(enemy, 'weak');
      if (weak) dmg = Math.floor(dmg * WEAK_MULTIPLIER);
      const dealt = applyDamage(state.player, dmg, state);
      state.log.push({
        text: `${enemy.name} attacks for ${dealt}!`,
        color: '#fca5a5',
      });
      const thorns = getStatus(state.player, 'thorns');
      if (thorns && thorns.value > 0 && enemy.hp > 0) {
        const reflected = applyDamage(enemy, thorns.value, state, 'player');
        state.log.push({
          text: `Thorns deal ${reflected} to ${enemy.name}!`,
          color: '#86efac',
        });
      }
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

/** Persist combat-gained curses (etc.) into the run deck after a win. */
export function commitPendingDeckCards(run: RunState, state: CombatState): void {
  for (const id of state.pendingDeckCards) {
    run.deck.push(id);
  }
  state.pendingDeckCards = [];
}
