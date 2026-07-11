import {
  cloneCard,
  makeCard,
  scaleEffectValue,
} from '../data/cardInstance';
import { CARDS, CURSE_CARD_ID } from '../data/cards';
import { getClass } from '../data/classes';
import { ENEMIES } from '../data/enemies';
import {
  createItemCombatState,
  forEachItemEffect,
  itemBeginTurn,
  itemDotExtraDuration,
  itemDotTickBonus,
  itemHasDeathWish,
  itemHasTwinStar,
  itemHotTickBlock,
  itemModifyBlockAmount,
  itemModifyCardCost,
  itemModifyHealAmount,
  itemModifyOutgoingDamage,
  itemModifyRecoil,
  type ItemCombatApi,
  type ItemCombatState,
} from '../data/itemCombat';
import { itemBlockCarryoverPct } from '../data/items';
import { TOTEMS } from '../data/shamanCards';
import type {
  CardDef,
  CardEffect,
  CardInstance,
  CardTypeTag,
  Combatant,
  EnemyIntent,
  Form,
  RunState,
  StatusEffect,
  TotemCombatant,
  TotemElement,
} from '../data/types';

export type CombatPhase = 'player' | 'enemy' | 'victory' | 'defeat';

export interface CombatLogEntry {
  text: string;
  color?: string;
}

/** Short-lived UI callouts for notable card effects (consumed by CombatScene). */
export interface CombatAnnouncement {
  text: string;
  color?: string;
  /** 'play' = bonus card resolved from discard; 'retrieve' = returned to hand/draw. */
  kind?: 'play' | 'retrieve';
}

export type HitsplatKind = 'damage' | 'block' | 'heal';

/** Floating combat number; cleared after CombatScene shows it. */
export interface CombatHitsplat {
  targetId: string;
  kind: HitsplatKind;
  amount: number;
}

export interface CombatState {
  player: Combatant;
  enemies: Combatant[];
  /** Living totems — duration-based auras; grounding can redirect one hit. */
  totems: TotemCombatant[];
  energy: number;
  energyMax: number;
  drawPile: CardInstance[];
  discardPile: CardInstance[];
  hand: CardInstance[];
  exhaustPile: CardInstance[];
  phase: CombatPhase;
  turn: number;
  log: CombatLogEntry[];
  /** UI banners for discard plays / retrieves; cleared after CombatScene shows them. */
  pendingAnnouncements: CombatAnnouncement[];
  /** Damage / block / heal floating numbers; cleared after CombatScene shows them. */
  pendingHitsplats: CombatHitsplat[];
  selectedCardId: string | null;
  awaitingTarget: boolean;
  spellPowerBonus: number;
  /** Card instances to merge into the run deck after victory (curses excluded). */
  pendingDeckCards: CardInstance[];
  /** Form spell play counts (unused placeholder). */
  formSpellCounts: Partial<Record<Form, number>>;
  /** Energy granted mid-enemy-turn (applied at the start of your next turn). */
  pendingEnergy: number;
  playDrawUsedThisTurn: boolean;
  /** Passive items snapshot + runtime flags. */
  itemState: ItemCombatState;
  /** Gold granted by items during combat; merged into the run on victory. */
  pendingGold: number;
  /** Floor multiplier snapshot for this fight. */
  enemyScale: number;
  /** Cards played this turn (for Bloodlust exhaust / Echo of the Elements). */
  cardsPlayedThisTurn: CardInstance[];
  /** Elemental attack damages dealt this turn (for Echo of the Elements). */
  elementalAttacksThisTurn: number[];
  /** Bloodlust: attacks cost this much less. */
  attackCostReduction: number;
  /** Bloodlust: exhaust every card played this turn. */
  exhaustAllPlayedThisTurn: boolean;
  /** Water Shield: energy to grant at next turn start. */
  pendingEnergyFromWaterShield: number;
  /** Boomkin Astral Power stacks (0–5). */
  astralPower: number;
  /** Elemental Blast: remaining free echo hits for elemental attacks this turn. */
  elementalEchoCharges: number;
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
/** HP + intent scaling per map floor within an act. */
export const ENEMY_SCALE_PER_FLOOR = 0.05;
/** Flat power added in Act 2 (Barrens templates are already a harder tier). */
export const ENEMY_ACT2_FLAT_SCALE = 0;

/** Prevent echo / retrieve recursion from looping forever. */
let effectDepth = 0;

function cardDef(inst: CardInstance | string | undefined): CardDef | undefined {
  if (!inst) return undefined;
  if (typeof inst === 'string') return CARDS[inst];
  return CARDS[inst.defId];
}

function hasFlameShock(target: Combatant): boolean {
  return target.statuses.some(
    (s) => s.kind === 'bleed' && (s.name === 'Flame Shock' || s.name.startsWith('Flame Shock')),
  );
}


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
      return card.effects.some((e) => e.kind === 'block' || e.kind === 'thorns' || e.kind === 'summonTotem');
    default:
      return false;
  }
}

function scaleIntent(intent: EnemyIntent, mult: number): EnemyIntent {
  if (intent.type === 'summon') return { ...intent };
  if (mult === 1) return { ...intent };
  const value = Math.max(1, Math.floor(intent.value * mult));
  // Keep UI labels honest — raw defs embed unscaled numbers like "Bite 10".
  const label = intent.label.replace(/\d+/g, String(value));
  return { ...intent, value, label };
}

function pickIntent(enemyId: string, combatant?: Combatant, scale = 1): EnemyIntent {
  const def = ENEMIES[enemyId]!;
  const enraged =
    !!combatant &&
    !!def.enrageIntents?.length &&
    combatant.hp / combatant.maxHp <= ENRAGE_HP_RATIO;
  const pool = enraged ? def.enrageIntents! : def.intents;
  const chosen = pool[Math.floor(Math.random() * pool.length)]!;
  return scaleIntent({ ...chosen }, scale);
}

function createEnemyCombatant(enemyDefId: string, scale = 1): Combatant {
  const def = ENEMIES[enemyDefId]!;
  const maxHp = Math.max(1, Math.floor(def.maxHp * scale));
  return {
    id: uid(enemyDefId),
    name: def.name,
    maxHp,
    hp: maxHp,
    block: 0,
    statuses: [],
    art: def.art,
    enemyDefId,
    intent: pickIntent(enemyDefId, undefined, scale),
  };
}

/** Floor power multiplier used by combat.
 * Uses map floor (resets each act) plus a modest Act 2 flat bump —
 * Barrens templates are already a harder tier, so we do NOT reuse the
 * reward `progressionFloor` (+10) or Act 2 becomes wildly overtuned.
 */
export function enemyScaleForRun(run: RunState): number {
  const floorScale = 1 + run.floor * ENEMY_SCALE_PER_FLOOR;
  const actBump = run.act === 2 ? ENEMY_ACT2_FLAT_SCALE : 0;
  return floorScale + actBump;
}

export function startCombat(run: RunState, enemyIds: string[]): CombatState {
  const enemyScale = enemyScaleForRun(run);
  const enemies: Combatant[] = enemyIds.map((id) => createEnemyCombatant(id, enemyScale));

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
    totems: [],
    energy: run.energyMax,
    energyMax: run.energyMax,
    drawPile: shuffle(run.deck.map(cloneCard)),
    discardPile: [],
    hand: [],
    exhaustPile: [],
    phase: 'player',
    turn: 1,
    log: [{ text: 'Combat begins. The grove stirs...', color: '#a8e6cf' }],
    pendingAnnouncements: [],
    pendingHitsplats: [],
    selectedCardId: null,
    awaitingTarget: false,
    spellPowerBonus: run.spellPowerBonus,
    pendingDeckCards: [],
    formSpellCounts: {},
    pendingEnergy: 0,
    playDrawUsedThisTurn: false,
    itemState: createItemCombatState(run.items ?? []),
    pendingGold: 0,
    enemyScale,
    cardsPlayedThisTurn: [],
    elementalAttacksThisTurn: [],
    attackCostReduction: 0,
    exhaustAllPlayedThisTurn: false,
    pendingEnergyFromWaterShield: 0,
    astralPower: 0,
    elementalEchoCharges: 0,
  };

  if (enemyScale > 1) {
    state.log.push({
      text: `Enemy power: +${Math.round((enemyScale - 1) * 100)}% (act ${run.act}, floor ${run.floor}).`,
      color: '#fca5a5',
    });
  }

  drawCards(state, 5);
  // Item combat-start effects (after opening hand)
  forEachItemEffect(state.itemState, 'combatStart', makeItemApi(state), {});
  return state;
}

function makeItemApi(state: CombatState): ItemCombatApi {
  return {
    drawCards: (n) => drawCards(state, n),
    gainBlock: (n, trigger = true) => gainBlock(state, n, trigger),
    healPlayer: (n, trigger = true) => healPlayer(state, n, trigger),
    dealRandom: (n) => {
      dealRandomDamage(state, n, undefined);
    },
    dealLowest: (n) => {
      const living = state.enemies.filter((e) => e.hp > 0).sort((a, b) => a.hp - b.hp);
      const t = living[0];
      if (!t) return;
      const fake: CardDef = {
        id: 'item_hit',
        name: 'Item',
        form: 'bear',
        cost: 0,
        description: '',
        target: 'enemy',
        effects: [],
        art: '',
        rarity: 'common',
      };
      dealDamageTo(state, fake, t, n, false);
    },
    dealAll: (n) => {
      const fake: CardDef = {
        id: 'item_aoe',
        name: 'Item',
        form: 'bear',
        cost: 0,
        description: '',
        target: 'allEnemies',
        effects: [],
        art: '',
        rarity: 'common',
      };
      for (const e of state.enemies.filter((en) => en.hp > 0)) {
        dealDamageTo(state, fake, e, n, false);
      }
    },
    addEnergy: (n) => {
      state.energy += n;
    },
    addSpellPower: (n) => {
      state.spellPowerBonus += n;
    },
    addStrength: (n) => {
      addStatus(state.player, {
        id: uid('str'),
        name: 'Strength',
        kind: 'strength',
        value: n,
        duration: 99,
        stacks: true,
      });
    },
    applyVulnerable: (duration, card) => {
      const targets =
        card?.target === 'allEnemies'
          ? state.enemies.filter((e) => e.hp > 0)
          : state.enemies.filter((e) => e.hp > 0);
      // Prefer current intent target if single — apply to all living for simplicity on play
      for (const t of targets) {
        addStatus(t, {
          id: uid('vuln'),
          name: 'Vulnerable',
          kind: 'vulnerable',
          value: 1,
          duration,
        });
      }
    },
    applyBleedAll: (total, duration, name) => {
      for (const e of state.enemies.filter((en) => en.hp > 0)) {
        applyBleed(e, total, duration, state, name);
      }
    },
    cleanseOne: () => {
      const debuffs: StatusEffect['kind'][] = ['poison', 'bleed', 'weak', 'vulnerable'];
      const idx = state.player.statuses.findIndex((s) => debuffs.includes(s.kind));
      if (idx >= 0) state.player.statuses.splice(idx, 1);
    },
    addGold: (n) => {
      state.pendingGold += n;
    },
    log: (text, color) => state.log.push({ text, color }),
    player: state.player,
    livingEnemies: () => state.enemies.filter((e) => e.hp > 0),
  };
}

function onCardDrawn(state: CombatState, card: CardInstance): void {
  const def = cardDef(card);
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
    let idx = state.drawPile.findIndex((inst) => cardHasType(cardDef(inst), type));
    if (idx < 0 && state.discardPile.length > 0) {
      reshuffleDiscardIfNeeded(state);
      idx = state.drawPile.findIndex((inst) => cardHasType(cardDef(inst), type));
    }
    if (idx < 0) break;
    const [cardInst] = state.drawPile.splice(idx, 1);
    if (!cardInst) break;
    state.hand.push(cardInst);
    onCardDrawn(state, cardInst);
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

function queueHitsplat(
  state: CombatState,
  targetId: string,
  kind: HitsplatKind,
  amount: number,
): void {
  const n = Math.floor(amount);
  if (n <= 0) return;
  state.pendingHitsplats.push({ targetId, kind, amount: n });
}

/** Grant block/armor and queue a grey hitsplat. */
function grantBlock(target: Combatant, amount: number, state: CombatState): number {
  const n = Math.max(0, Math.floor(amount));
  if (n <= 0) return 0;
  target.block += n;
  queueHitsplat(state, target.id, 'block', n);
  return n;
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

  // Grounding Totem: redirect the next hit and destroy the totem.
  if (target.isPlayer && amount > 0) {
    const grounding = state.totems.find((t) => t.aura.kind === 'grounding' && t.turnsRemaining > 0);
    if (grounding) {
      state.log.push({
        text: `${grounding.name} redirects the hit and is destroyed!`,
        color: '#94a3b8',
      });
      state.totems = state.totems.filter((t) => t.id !== grounding.id);
      const water = getStatus(state.player, 'waterShield');
      if (water) state.pendingEnergyFromWaterShield += water.value;
      return amount; // fully redirected
    }
    const water = getStatus(state.player, 'waterShield');
    if (water) state.pendingEnergyFromWaterShield += water.value;
  }

  const prevHp = target.hp;
  const blocked = Math.min(target.block, amount);
  target.block -= blocked;
  amount -= blocked;
  target.hp = Math.max(0, target.hp - amount);
  maybeTriggerEnrage(target, state);

  const total = amount + blocked;
  if (total > 0) queueHitsplat(state, target.id, 'damage', total);

  if (
    sourceLabel === 'player' &&
    !target.isPlayer &&
    prevHp > 0 &&
    target.hp <= 0
  ) {
    onEnemyKilledByPlayer(state);
  }

  return total;
}

function onTotemDestroyed(state: CombatState, totem: TotemCombatant): void {
  state.log.push({
    text: `${totem.name} fades!`,
    color: '#f87171',
  });
}

export function livingTotems(state: CombatState): TotemCombatant[] {
  return state.totems.filter((t) => t.turnsRemaining > 0);
}

export function totemAuraBonus(
  state: CombatState,
  kind: TotemCombatant['aura']['kind'],
): number {
  let total = 0;
  for (const t of livingTotems(state)) {
    if (t.aura.kind === kind) total += t.aura.value;
  }
  return total;
}

function summonTotem(state: CombatState, totemId: string): void {
  const def = TOTEMS[totemId];
  if (!def) {
    state.log.push({ text: `Unknown totem: ${totemId}`, color: '#f87171' });
    return;
  }
  state.totems = state.totems.filter((t) => t.element !== def.element);
  const duration = def.duration ?? 3;
  const maxHp = def.maxHp ?? 0;
  const totem: TotemCombatant = {
    id: uid(def.id),
    defId: def.id,
    name: def.name,
    element: def.element as TotemElement,
    maxHp,
    hp: maxHp,
    turnsRemaining: duration,
    art: def.art,
    aura: { ...def.aura },
    manaTideEnergy: def.aura.kind === 'manaTide' ? def.aura.value : undefined,
  };
  state.totems.push(totem);
  const auraDesc = describeTotemAura(totem);
  state.log.push({
    text: `Summoned ${totem.name} for ${duration} turns. ${auraDesc}`,
    color: '#67e8f9',
  });
}

function describeTotemAura(totem: TotemCombatant): string {
  const v = totem.aura.value;
  switch (totem.aura.kind) {
    case 'strength':
      return `+${v} Strength while alive.`;
    case 'spellPower':
      return `+${v} Spell Power while alive.`;
    case 'regen':
      return `Regen ${v}/turn while alive.`;
    case 'thorns':
      return `Thorns ${v} while alive.`;
    case 'blockPerTurn':
      return `+${v} Block/turn while alive.`;
    case 'energyOnTurn':
      return `+${v} Energy/turn while alive.`;
    case 'randomDamagePerTurn':
      return `Deal ${v} to a random enemy each turn.`;
    case 'searing':
      return `Deal ${v} to a random enemy and apply/refresh Flame Shock shred each turn.`;
    case 'stoneskin':
      return `+${v} Block/turn and Thorns 6 while alive.`;
    case 'windfury':
      return `Enhance attacks: ${v}% chance to strike twice.`;
    case 'grounding':
      return 'Redirects the next hit, then is destroyed.';
    case 'manaTide':
      return `+${v} Energy this turn, increasing each turn.`;
    default:
      return '';
  }
}

const SEARING_FLAME_SHOCK_TOTAL = 24;
const SEARING_FLAME_SHOCK_DURATION = 3;
const STONESKIN_THORNS = 5;

/** Apply passive totem auras at the start of the player's turn, then tick durations. */
function tickTotemAuras(state: CombatState): void {
  const totems = livingTotems(state);
  if (!totems.length) return;

  const blockGain =
    totemAuraBonus(state, 'blockPerTurn') + totemAuraBonus(state, 'stoneskin');
  if (blockGain > 0) {
    gainBlock(state, blockGain, false);
    state.log.push({ text: `Totems: +${blockGain} Block.`, color: '#7dd3fc' });
  }

  // Stoneskin: maintain Thorns while the totem lives.
  if (totemAuraBonus(state, 'stoneskin') > 0 || totemAuraBonus(state, 'thorns') > 0) {
    const thornsVal = Math.max(STONESKIN_THORNS, totemAuraBonus(state, 'thorns'));
    const existing = getStatus(state.player, 'thorns');
    if (existing) {
      existing.value = Math.max(existing.value, thornsVal);
      existing.duration = Math.max(existing.duration, 1);
    } else {
      addStatus(state.player, {
        id: uid('thorns'),
        name: 'Stoneskin Thorns',
        kind: 'thorns',
        value: thornsVal,
        duration: 1,
      });
    }
    state.log.push({
      text: `Totems: Thorns ${thornsVal}.`,
      color: '#86efac',
    });
  }

  const regen = totemAuraBonus(state, 'regen');
  if (regen > 0) healPlayer(state, regen, false);

  const energy = totemAuraBonus(state, 'energyOnTurn');
  if (energy > 0) {
    state.energy += energy;
    state.log.push({ text: `Totems: +${energy} Energy.`, color: '#fde68a' });
  }

  for (const t of totems) {
    if (t.aura.kind === 'randomDamagePerTurn' || t.aura.kind === 'searing') {
      const hit = dealRandomDamage(state, t.aura.value);
      state.log.push({ text: `${t.name}: ${t.aura.value} damage.`, color: '#fb923c' });
      if (t.aura.kind === 'searing' && hit && hit.hp > 0) {
        // Apply or refresh a Flame Shock shred so Lava Burst / Lava Lash stay relevant.
        const existing = hit.statuses.find(
          (s) => s.kind === 'bleed' && s.name.startsWith('Flame Shock'),
        );
        if (existing) {
          existing.duration = Math.max(existing.duration, SEARING_FLAME_SHOCK_DURATION);
          existing.value = Math.max(
            existing.value,
            Math.floor(SEARING_FLAME_SHOCK_TOTAL / SEARING_FLAME_SHOCK_DURATION),
          );
          state.log.push({
            text: `${t.name} refreshes Flame Shock on ${hit.name}.`,
            color: '#fb923c',
          });
        } else {
          applyBleed(
            hit,
            SEARING_FLAME_SHOCK_TOTAL,
            SEARING_FLAME_SHOCK_DURATION,
            state,
            'Flame Shock',
          );
        }
      }
    }
    if (t.aura.kind === 'manaTide') {
      const grant = t.manaTideEnergy ?? t.aura.value;
      state.energy += grant;
      state.log.push({ text: `${t.name}: +${grant} Energy.`, color: '#fde68a' });
      t.manaTideEnergy = grant + t.aura.value;
    }
  }

  // Tick durations after applying auras
  for (const t of state.totems) {
    t.turnsRemaining -= 1;
    if (t.turnsRemaining <= 0) onTotemDestroyed(state, t);
  }
  state.totems = state.totems.filter((t) => t.turnsRemaining > 0);
}

function onEnemyKilledByPlayer(state: CombatState): void {
  forEachItemEffect(state.itemState, 'onKill', makeItemApi(state), {});
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

function heal(target: Combatant, amount: number, state: CombatState): number {
  const before = target.hp;
  target.hp = Math.min(target.maxHp, target.hp + Math.floor(amount));
  const healed = target.hp - before;
  if (healed > 0) queueHitsplat(state, target.id, 'heal', healed);
  return healed;
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
        const healed = heal(state.player, echo.value, state);
        state.log.push({
          text: `Echo: healed ${healed}.`,
          color: '#86efac',
        });
      } else if (to === 'block') {
        grantBlock(state.player, echo.value, state);
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
  const boosted = itemModifyBlockAmount(state.itemState.items, amount);
  grantBlock(state.player, boosted, state);
  state.itemState.flags.blockGainedThisTurn += boosted;
  state.log.push({
    text: `Gained ${boosted} Block.`,
    color: '#7dd3fc',
  });
  if (trigger) triggerEcho(state, 'block');
  if (trigger) {
    forEachItemEffect(state.itemState, 'onGainBlock', makeItemApi(state), {
      blockAmount: boosted,
    });
  }
}

function healPlayer(state: CombatState, amount: number, trigger = true): number {
  const wasFull = state.player.hp >= state.player.maxHp;
  const boosted = itemModifyHealAmount(state.itemState.items, amount);
  const healed = heal(state.player, boosted, state);
  state.log.push({ text: `Healed ${healed} HP.`, color: '#86efac' });
  if (trigger && healed > 0) triggerEcho(state, 'heal');
  if (trigger && healed > 0) {
    const grace = getStatus(state.player, 'spiritWalkersGrace');
    if (grace) {
      const dmg = Math.floor(healed * (grace.value / 100));
      if (dmg > 0) dealRandomDamage(state, dmg);
    }
    const healDraw = getStatus(state.player, 'healAlsoDraw');
    if (healDraw && healDraw.value > 0) {
      drawCards(state, healDraw.value);
      state.log.push({
        text: `Heal draws ${healDraw.value} card${healDraw.value === 1 ? '' : 's'}.`,
        color: '#fde68a',
      });
    }
    forEachItemEffect(state.itemState, 'onHeal', makeItemApi(state), {
      healAmount: healed,
      wasFullHp: wasFull,
    });
  }
  return healed;
}

function getAstralPower(state: CombatState): number {
  return state.astralPower;
}

function gainAstralPower(state: CombatState, amount: number): void {
  if (amount <= 0) return;
  state.astralPower = Math.min(5, state.astralPower + amount);
  state.log.push({
    text: `Astral Power: ${state.astralPower}/5.`,
    color: '#c4b5fd',
  });
}

function totalBleedRemaining(target: Combatant): number {
  return target.statuses
    .filter((s) => s.kind === 'bleed' || s.kind === 'poison')
    .reduce((sum, s) => sum + s.value * Math.max(1, s.duration), 0);
}

function countDots(target: Combatant): number {
  return target.statuses.filter((s) => s.kind === 'bleed' || s.kind === 'poison').length;
}

export function computeCardDamage(
  card: CardDef,
  base: number,
  state: CombatState,
  target?: Combatant,
  consumeMarks = true,
): number {
  let dmg = base;
  if (
    card.form === 'boomkin' ||
    card.form === 'holy' ||
    card.form === 'shadow' ||
    card.form === 'discipline' ||
    card.form === 'elemental'
  ) {
    const totemSp = totemAuraBonus(state, 'spellPower');
    const sp = state.spellPowerBonus + totemSp;
    dmg += sp + Math.floor(sp * 0.5);
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
  if (card.form === 'elemental' && target) {
    const mark = getStatus(target, 'stormstrike');
    if (mark) {
      dmg = Math.floor(dmg * (1 + mark.value / 100));
      if (consumeMarks) {
        target.statuses = target.statuses.filter((s) => s.kind !== 'stormstrike');
      }
    }
  }
  const str = getStatus(state.player, 'strength');
  const totemStr = totemAuraBonus(state, 'strength');
  dmg += (str?.value ?? 0) + totemStr;
  return itemModifyOutgoingDamage(state.itemState.items, card, dmg);
}

/** Preview outgoing card damage after buffs/debuffs/items (does not consume marks). */
export function previewCardDamage(
  state: CombatState,
  card: CardDef,
  base: number,
  target?: Combatant,
): number {
  let dmg = computeCardDamage(card, base, state, target, false);
  if (getStatus(state.player, 'weak')) dmg = Math.floor(dmg * WEAK_MULTIPLIER);
  if (target && getStatus(target, 'vulnerable')) dmg = Math.floor(dmg * 1.5);
  return dmg;
}

function applyBleed(
  target: Combatant,
  total: number,
  duration: number,
  state: CombatState,
  sourceName: string,
): void {
  const extra = itemDotExtraDuration(state.itemState.items);
  const dur = duration + extra;
  const perTick = Math.floor(total / Math.max(1, duration));
  // Keep each DoT as its own status so they display and tick independently.
  target.statuses.push({
    id: uid('bleed'),
    name: sourceName,
    kind: 'bleed',
    value: perTick,
    duration: dur,
  });
  state.log.push({
    text: `${sourceName}: ${perTick}/turn for ${dur} turns on ${target.name}.`,
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
  let dealt = applyDamage(target, dmg, state, 'player');
  state.log.push({
    text: `${card.name}: ${dealt} damage to ${target.name}.`,
    color: '#ffb347',
  });
  // Windfury: enhance attacks may strike twice (Ascendance = always)
  const perfectWf = !!getStatus(state.player, 'perfectWindfury');
  const wfChance = perfectWf ? 100 : totemAuraBonus(state, 'windfury');
  if (card.form === 'enhance' && target.hp > 0 && wfChance > 0 && Math.random() * 100 < wfChance) {
    const again = applyDamage(target, dmg, state, 'player');
    dealt += again;
    state.log.push({
      text: `Windfury! Extra ${again} damage to ${target.name}.`,
      color: '#67e8f9',
    });
  }
  if (card.form === 'elemental' && dealt > 0) {
    state.elementalAttacksThisTurn.push(dmg);
    // Elemental Blast: free single echo of this attack to a random enemy.
    if (state.elementalEchoCharges > 0 && card.id !== 'echo_hit' && card.id !== 'elemental_blast') {
      state.elementalEchoCharges -= 1;
      const living = state.enemies.filter((e) => e.hp > 0);
      if (living.length) {
        const t2 = living[Math.floor(Math.random() * living.length)]!;
        const echoDmg = applyDamage(t2, dmg, state, 'player');
        state.log.push({
          text: `Elemental Echo: ${echoDmg} to ${t2.name}.`,
          color: '#818cf8',
        });
      }
    }
  }
  consumeEarthAndMoon(target, card, state);
  if (triggerEchoOnHit && dealt > 0) triggerEcho(state, 'attack');
  if (dealt > 0 && card.id !== 'item_hit' && card.id !== 'item_aoe' && card.id !== 'echo_hit') {
    forEachItemEffect(state.itemState, 'onDealDamage', makeItemApi(state), {
      card,
      damageAmount: dealt,
      isRandomDamage: false,
    });
  }
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
  return target;
}

function discardRandomFromHand(state: CombatState, count: number): CardInstance[] {
  const discarded: CardInstance[] = [];
  for (let i = 0; i < count; i++) {
    if (state.hand.length === 0) break;
    const idx = Math.floor(Math.random() * state.hand.length);
    const [inst] = state.hand.splice(idx, 1);
    if (!inst) break;
    state.discardPile.push(inst);
    discarded.push(inst);
  }
  if (discarded.length) {
    const names = discarded.map((c) => cardDef(c)?.name ?? c.defId).join(', ');
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
): { index: number; card: CardInstance } | null {
  if (!state.discardPile.length) return null;
  const indices = state.discardPile
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => {
      const def = cardDef(card);
      if (!def || def.curse) return false;
      if (preferType) return cardHasType(def, preferType);
      return true;
    });
  const pool = indices.length
    ? indices
    : state.discardPile
        .map((card, index) => ({ card, index }))
        .filter(({ card }) => !cardDef(card)?.curse);
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

function announce(
  state: CombatState,
  text: string,
  color: string,
  kind?: CombatAnnouncement['kind'],
): void {
  state.log.push({ text, color });
  state.pendingAnnouncements.push({ text, color, kind });
}

function retrieveFromDiscard(
  state: CombatState,
  mode: 'hand' | 'play' | 'top',
  preferType?: CardTypeTag,
  sourceCard?: CardDef,
): void {
  const source = sourceCard?.name;
  const pick = pickFromDiscard(state, preferType);
  if (!pick) {
    const emptyText = source
      ? `${source}: no cards in discard to retrieve.`
      : 'No cards in discard to retrieve.';
    announce(state, emptyText, '#9aa5b1', 'retrieve');
    return;
  }
  const [inst] = state.discardPile.splice(pick.index, 1);
  if (!inst) return;
  const card = cardDef(inst)!;
  if (mode === 'hand') {
    if (state.hand.length >= 10) {
      state.drawPile.push(inst);
      const text = source
        ? `${source}: hand full — ${card.name} goes on top of your draw pile.`
        : `Hand full — ${card.name} goes on top of your draw pile.`;
      announce(state, text, '#e2e8f0', 'retrieve');
    } else {
      state.hand.push(inst);
      const text = source
        ? `${source} returns ${card.name} from discard to your hand!`
        : `Added ${card.name} from discard to your hand.`;
      announce(state, text, '#fde68a', 'retrieve');
    }
    return;
  }
  if (mode === 'top') {
    state.drawPile.push(inst);
    const text = source
      ? `${source} puts ${card.name} on top of your draw pile!`
      : `Put ${card.name} on top of your draw pile.`;
    announce(state, text, '#fde68a', 'retrieve');
    return;
  }
  // play immediately
  const playText = source
    ? `${source} plays ${card.name} from discard!`
    : `Playing ${card.name} from discard!`;
  announce(state, playText, '#fbbf24', 'play');
  let target: Combatant | undefined;
  if (card.target === 'enemy') {
    const living = state.enemies.filter((e) => e.hp > 0);
    target = living.sort((a, b) => a.hp - b.hp)[0];
  }
  if (effectDepth < MAX_EFFECT_DEPTH) {
    effectDepth += 1;
    try {
      applyCardEffects(state, card, target, inst.upgrade);
    } finally {
      effectDepth -= 1;
    }
  } else {
    announce(
      state,
      `${card.name} fizzles — too many chained plays.`,
      '#9aa5b1',
      'play',
    );
  }
  state.discardPile.push(inst);
}

/** Effective energy cost after items / Bloodlust / Lightning Bolt free condition. */
export function getCardPlayCost(
  state: CombatState,
  card: CardDef,
  _target?: Combatant,
): number {
  let cost = card.cost;

  if (card.effects.some((e) => e.kind === 'freeIfAllElemental')) {
    const allElemental = state.hand.every((inst) => cardDef(inst)?.form === 'elemental');
    if (allElemental && state.hand.length > 0) return 0;
  }

  if (cardHasType(card, 'attack') && state.attackCostReduction > 0) {
    cost -= state.attackCostReduction;
  }

  cost = itemModifyCardCost(state.itemState.items, card, cost);
  return Math.max(0, cost);
}

function resolveCardDestination(
  state: CombatState,
  cardInst: CardInstance,
  def: CardDef,
): void {
  const shouldExhaust =
    def.exhaust ||
    def.effects.some((e) => e.kind === 'exhaust') ||
    state.exhaustAllPlayedThisTurn;
  if (shouldExhaust) {
    state.exhaustPile.push(cardInst);
    state.log.push({ text: `Exhausted ${def.name}.`, color: '#94a3b8' });
    return;
  }
  state.discardPile.push(cardInst);
}

function afterCardPlayed(
  state: CombatState,
  card: CardDef,
  _paidCost: number,
  dealtDamage: boolean,
  _target?: Combatant,
): void {
  if (card.form === 'tree') {
    state.itemState.treePlaysThisTurn += 1;
  }
  // Boomkin: one Astral from damage cards that don't already grant/spend it.
  if (
    card.form === 'boomkin' &&
    dealtDamage &&
    !card.effects.some((e) => e.kind === 'gainAstral' || e.kind === 'spendAstral') &&
    card.id !== 'starsurge' &&
    card.id !== 'incarnation'
  ) {
    gainAstralPower(state, 1);
  }
  // Mind Blast: multi-DoT void builder refund.
  if (card.id === 'mind_blast') {
    const multiDot = state.enemies.some((e) => e.hp > 0 && countDots(e) >= 2);
    if (multiDot) {
      state.energy += 1;
      state.log.push({
        text: 'Mind Blast: multi-DoT refund +1 Energy.',
        color: '#a78bfa',
      });
    }
  }
  forEachItemEffect(state.itemState, 'onPlayCard', makeItemApi(state), { card });
}


export function canPlayCard(
  state: CombatState,
  handIndex: number,
  target?: Combatant,
): boolean {
  if (state.phase !== 'player') return false;
  const inst = state.hand[handIndex];
  if (!inst) return false;
  const card = cardDef(inst);
  if (!card || card.unplayable || card.curse) return false;
  return state.energy >= getCardPlayCost(state, card, target);
}

export function selectCard(state: CombatState, handIndex: number): string | null {
  if (!canPlayCard(state, handIndex)) return null;
  const inst = state.hand[handIndex]!;
  const card = cardDef(inst)!;
  state.selectedCardId = inst.defId;

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
  const inst = state.hand[handIndex];
  if (!inst) return false;
  const card = cardDef(inst)!;
  if (card.target !== 'enemy') return false;
  const enemy = state.enemies.find((e) => e.id === enemyId && e.hp > 0);
  if (!enemy) return false;
  if (!canPlayCard(state, handIndex, enemy)) return false;

  const cost = getCardPlayCost(state, card, enemy);
  state.energy -= cost;
  state.hand.splice(handIndex, 1);
  state.cardsPlayedThisTurn.push(cloneCard(inst));
  const dealt = applyCardEffects(state, card, enemy, inst.upgrade);
  resolveCardDestination(state, inst, card);
  state.selectedCardId = null;
  state.awaitingTarget = false;

  afterCardPlayed(state, card, cost, dealt, enemy);
  checkCombatEnd(state);
  return true;
}

export function playCard(state: CombatState, handIndex: number): boolean {
  const inst = state.hand[handIndex];
  if (!inst || !canPlayCard(state, handIndex)) return false;
  const card = cardDef(inst)!;

  if (card.target === 'enemy') return false;

  const cost = getCardPlayCost(state, card);
  state.energy -= cost;
  state.hand.splice(handIndex, 1);
  state.cardsPlayedThisTurn.push(cloneCard(inst));
  const dealt = applyCardEffects(state, card, undefined, inst.upgrade);
  resolveCardDestination(state, inst, card);
  state.selectedCardId = null;
  state.awaitingTarget = false;

  afterCardPlayed(state, card, cost, dealt);
  checkCombatEnd(state);
  return true;
}

function applyDiscardFor(
  state: CombatState,
  card: CardDef,
  effect: CardEffect,
  target?: Combatant,
): boolean {
  const discardCount = effect.discardCount ?? 1;
  const discarded = discardRandomFromHand(state, discardCount);
  const bonus = (effect.bonusPerDiscard ?? 0) * discarded.length;
  const total = scaleEffectValue(
    { ...effect, value: effect.value + bonus },
    0,
  );
  const kind = effect.payoffKind ?? 'block';
  if (kind === 'block') {
    gainBlock(state, total);
    return false;
  }
  if (kind === 'heal') {
    healPlayer(state, total);
    return false;
  }
  if (kind === 'damage' && target) {
    dealDamageTo(state, card, target, total);
    return true;
  }
  if (kind === 'randomDamage' || kind === 'damage') {
    const living = state.enemies.filter((e) => e.hp > 0);
    if (living.length) {
      const t = living[Math.floor(Math.random() * living.length)]!;
      dealDamageTo(state, card, t, total);
      return true;
    }
  }
  return false;
}

function applyCardEffects(
  state: CombatState,
  card: CardDef,
  target?: Combatant,
  upgrade = 0,
): boolean {
  let dealtDamage = false;

  // Penance: damage and heal scale with half current Block (armor).
  if (card.id === 'penance') {
    const halfBlock = Math.floor(state.player.block / 2);
    const dmgEffect = card.effects.find((e) => e.kind === 'damage');
    const healEffect = card.effects.find((e) => e.kind === 'heal');
    if (dmgEffect && target) {
      const base = scaleEffectValue({ ...dmgEffect, value: halfBlock }, upgrade);
      dealDamageTo(state, card, target, base);
      dealtDamage = true;
    }
    if (healEffect) {
      const healAmt = scaleEffectValue({ ...healEffect, value: halfBlock }, upgrade);
      healPlayer(state, healAmt);
    }
    return dealtDamage;
  }

  for (const effect of card.effects) {
    const value = scaleEffectValue(effect, upgrade);
    switch (effect.kind) {
      case 'damage': {
        if (!target) break;
        dealDamageTo(state, card, target, value);
        dealtDamage = true;
        break;
      }
      case 'aoeDamage': {
        const living = state.enemies.filter((e) => e.hp > 0);
        const targets = effect.maxTargets
          ? living.slice(0, effect.maxTargets)
          : living;
        for (const e of targets) {
          dealDamageTo(state, card, e, value);
          dealtDamage = true;
        }
        break;
      }
      case 'randomDamage': {
        const living = state.enemies.filter((e) => e.hp > 0);
        if (!living.length) break;
        const t = living[Math.floor(Math.random() * living.length)]!;
        const dealt = dealDamageTo(state, card, t, value);
        dealtDamage = true;
        if (itemHasTwinStar(state.itemState.items) && dealt > 0) {
          const others = state.enemies.filter((e) => e.hp > 0 && e.id !== t.id);
          const half = Math.ceil(dealt / 2);
          if (others.length && half > 0) {
            const t2 = others[Math.floor(Math.random() * others.length)]!;
            dealDamageTo(state, card, t2, half, false);
            state.log.push({
              text: `Twin Star: ${half} to ${t2.name}.`,
              color: '#c4b5fd',
            });
          } else if (half > 0 && t.hp > 0) {
            dealDamageTo(state, card, t, half, false);
            state.log.push({
              text: `Twin Star: ${half} again.`,
              color: '#c4b5fd',
            });
          }
        }
        break;
      }
      case 'recoil': {
        const reduced = itemModifyRecoil(state.itemState.items, value);
        const dealt = applyDamage(state.player, reduced, state);
        state.log.push({
          text: `Recoil: you take ${dealt} damage.`,
          color: '#f87171',
        });
        if (itemHasDeathWish(state.itemState.items)) {
          state.energy += 1;
          state.log.push({ text: 'Death Wish: +1 Energy.', color: '#fde68a' });
        }
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
        const baseDuration = effect.duration ?? 1;
        const duration = baseDuration;
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
        const duration = effect.duration ?? 1;
        const dotName = card.id === 'flame_shock' ? 'Flame Shock' : card.name;
        if (card.target === 'allEnemies') {
          for (const e of state.enemies.filter((en) => en.hp > 0)) {
            applyBleed(e, value, duration, state, dotName);
          }
        } else if (target) {
          applyBleed(target, value, duration, state, dotName);
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
          (inst) => inst.defId !== card.id && !cardDef(inst)?.curse,
        );
        for (let i = 0; i < value; i++) {
          if (!pool.length) {
            state.log.push({ text: 'Nothing to copy.', color: '#9aa5b1' });
            break;
          }
          const src = pool[Math.floor(Math.random() * pool.length)]!;
          const copy = cloneCard(src);
          const insertAt = Math.floor(Math.random() * (state.drawPile.length + 1));
          state.drawPile.splice(insertAt, 0, copy);
          state.log.push({
            text: `Copied ${cardDef(copy)?.name ?? copy.defId} into your draw pile.`,
            color: '#e2e8f0',
          });
        }
        break;
      }
      case 'shuffleCurse': {
        for (let i = 0; i < value; i++) {
          const insertAt = Math.floor(Math.random() * (state.drawPile.length + 1));
          state.drawPile.splice(insertAt, 0, makeCard(CURSE_CARD_ID));
        }
        state.log.push({
          text: `Shuffled ${value} Nightmare into your deck this combat.`,
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
        const duration = effect.duration ?? 1;
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
          text: `Echo: this turn, whenever you ${fromLabel}, also ${toLabel} ${value}.`,
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
        if (applyDiscardFor(state, card, effect, target)) {
          dealtDamage = true;
        }
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
        forEachItemEffect(state.itemState, 'onGainThorns', makeItemApi(state), {
          card,
        });
        break;
      }
      case 'summonTotem': {
        if (effect.totemId) {
          summonTotem(state, effect.totemId);
        }
        break;
      }
      case 'stormstrikeMark': {
        if (!target) break;
        addStatus(target, {
          id: uid('stormstrike'),
          name: 'Stormstrike',
          kind: 'stormstrike',
          value,
          duration: 99,
        });
        state.log.push({
          text: `Next elemental attack on ${target.name} deals +${value}% damage.`,
          color: '#818cf8',
        });
        break;
      }
      case 'consumeFlameShock': {
        if (!target) break;
        const shocks = target.statuses.filter(
          (s) => s.kind === 'bleed' && s.name.startsWith('Flame Shock'),
        );
        if (!shocks.length) {
          state.log.push({ text: 'No Flame Shock to consume.', color: '#9aa5b1' });
          break;
        }
        let total = 0;
        for (const s of shocks) total += s.value * Math.max(1, s.duration);
        target.statuses = target.statuses.filter(
          (s) => !(s.kind === 'bleed' && s.name.startsWith('Flame Shock')),
        );
        const dealt = applyDamage(target, total, state, 'player');
        dealtDamage = true;
        state.log.push({
          text: `Consumed Flame Shock for ${dealt} damage!`,
          color: '#fb923c',
        });
        break;
      }
      case 'stripEnemyBuffs': {
        if (!target) break;
        const buffs: StatusEffect['kind'][] = [
          'strength',
          'spellPower',
          'thorns',
          'regen',
          'echo',
          'block',
        ];
        const before = target.statuses.length;
        target.statuses = target.statuses.filter((s) => !buffs.includes(s.kind));
        const removed = before - target.statuses.length;
        state.log.push({
          text: `Purged ${removed} buff(s) from ${target.name}.`,
          color: '#fde68a',
        });
        break;
      }
      case 'removeTotemsHeal': {
        const count = state.totems.length;
        state.totems = [];
        if (count > 0) {
          const healed = healPlayer(state, value * count);
          state.log.push({
            text: `Spirit Link: removed ${count} totem(s), healed ${healed}.`,
            color: '#86efac',
          });
        } else {
          state.log.push({ text: 'No totems to remove.', color: '#9aa5b1' });
        }
        break;
      }
      case 'hex': {
        if (!target) break;
        const duration = effect.duration ?? 2;
        addStatus(target, {
          id: uid('hex'),
          name: 'Hex',
          kind: 'hex',
          value: 1,
          duration,
        });
        state.log.push({
          text: `${target.name} is Hexed and cannot attack for ${duration} turns.`,
          color: '#a78bfa',
        });
        break;
      }
      case 'waterShield': {
        const duration = effect.duration ?? 3;
        addStatus(state.player, {
          id: uid('waterShield'),
          name: 'Water Shield',
          kind: 'waterShield',
          value,
          duration,
        });
        state.log.push({
          text: `Water Shield (${duration} turns): +${value} Energy next turn when attacked.`,
          color: '#38bdf8',
        });
        break;
      }
      case 'spiritWalkersGrace': {
        const duration = effect.duration ?? 3;
        addStatus(state.player, {
          id: uid('spiritGrace'),
          name: "Spirit Walker's Grace",
          kind: 'spiritWalkersGrace',
          value,
          duration,
        });
        state.log.push({
          text: `Spirit Walker's Grace (${duration} turns): healing damages enemies.`,
          color: '#86efac',
        });
        break;
      }
      case 'masterElements': {
        state.spellPowerBonus += value;
        state.log.push({
          text: `Spell Power +${value} for the rest of combat.`,
          color: '#a78bfa',
        });
        break;
      }
      case 'echoElements': {
        const hits = [...state.elementalAttacksThisTurn];
        if (!hits.length) {
          state.log.push({ text: 'No elemental attacks to echo.', color: '#9aa5b1' });
          break;
        }
        for (const dmg of hits) {
          dealRandomDamage(state, dmg, card);
          dealtDamage = true;
        }
        if (hits.length >= 2) {
          state.energy += 1;
          state.log.push({
            text: `Echo of the Elements repeats ${hits.length} attack(s)! +1 Energy.`,
            color: '#818cf8',
          });
        } else {
          state.log.push({
            text: `Echo of the Elements repeats ${hits.length} attack(s)!`,
            color: '#818cf8',
          });
        }
        break;
      }
      case 'bloodlust': {
        drawCards(state, value);
        state.attackCostReduction += 1;
        state.exhaustAllPlayedThisTurn = true;
        // Exhaust cards already played this turn (still in discard).
        for (const played of state.cardsPlayedThisTurn) {
          const idx = state.discardPile.findIndex(
            (c) => c.defId === played.defId && c.upgrade === played.upgrade,
          );
          if (idx >= 0) {
            const [moved] = state.discardPile.splice(idx, 1);
            if (moved) state.exhaustPile.push(moved);
          }
        }
        state.log.push({
          text: `Bloodlust: drew ${value}. Attacks cost 1 less. Cards played this turn Exhaust.`,
          color: '#f97316',
        });
        break;
      }
      case 'exhaust':
        break;
      case 'refundIfFlameShock': {
        if (target && hasFlameShock(target)) {
          state.energy += value;
          state.log.push({
            text: `Flame Shock! Refunded ${value} Energy.`,
            color: '#fde68a',
          });
        }
        break;
      }
      case 'freeIfAllElemental':
        break;
      case 'gainAstral': {
        gainAstralPower(state, value);
        break;
      }
      case 'spendAstral': {
        const stacks = getAstralPower(state);
        if (stacks <= 0) {
          state.log.push({ text: 'No Astral Power to spend.', color: '#9aa5b1' });
          break;
        }
        const bonus = value * stacks;
        if (target) {
          dealDamageTo(state, card, target, bonus);
          dealtDamage = true;
        } else {
          dealRandomDamage(state, bonus, card);
          dealtDamage = true;
        }
        if (stacks >= 2) {
          state.energy += 1;
          state.log.push({
            text: `Spent ${stacks} Astral Power: +${bonus} damage, +1 Energy.`,
            color: '#c4b5fd',
          });
        } else {
          state.log.push({
            text: `Spent ${stacks} Astral Power: +${bonus} damage.`,
            color: '#c4b5fd',
          });
        }
        state.astralPower = 0;
        break;
      }
      case 'refundIfBleed': {
        if (target && totalBleedRemaining(target) > 0) {
          state.energy += value;
          state.log.push({
            text: `Bleed payoff: refunded ${value} Energy.`,
            color: '#fde68a',
          });
        }
        break;
      }
      case 'consumeBleeds': {
        if (!target) break;
        const total = totalBleedRemaining(target);
        if (total <= 0) {
          state.log.push({ text: 'No bleeds to consume.', color: '#9aa5b1' });
          break;
        }
        target.statuses = target.statuses.filter(
          (s) => s.kind !== 'bleed' && s.kind !== 'poison',
        );
        const dealt = applyDamage(target, total, state, 'player');
        dealtDamage = true;
        state.log.push({
          text: `Consumed bleeds for ${dealt} damage!`,
          color: '#fb923c',
        });
        break;
      }
      case 'voidform': {
        const duration = effect.duration ?? 2;
        addStatus(state.player, {
          id: uid('voidform'),
          name: 'Voidform',
          kind: 'voidform',
          value: 1,
          duration,
        });
        state.log.push({
          text: `Voidform (${duration} turns): enemy DoTs tick twice.`,
          color: '#a78bfa',
        });
        break;
      }
      case 'elementalEchoTurn': {
        // Charge count = number of free elemental echoes this turn.
        state.elementalEchoCharges += Math.max(1, value);
        state.log.push({
          text: `Elemental Echo: next ${state.elementalEchoCharges} elemental attack(s) echo once.`,
          color: '#818cf8',
        });
        break;
      }
      case 'healAlsoDraw': {
        const duration = effect.duration ?? 99;
        addStatus(state.player, {
          id: uid('healDraw'),
          name: 'Ancestral Guidance',
          kind: 'healAlsoDraw',
          value: Math.max(1, value),
          duration,
        });
        state.log.push({
          text: `Healing also draws ${Math.max(1, value)} card(s).`,
          color: '#86efac',
        });
        break;
      }
      case 'perfectWindfury': {
        const duration = effect.duration ?? 2;
        addStatus(state.player, {
          id: uid('perfectWf'),
          name: 'Ascendance',
          kind: 'perfectWindfury',
          value: 100,
          duration,
        });
        state.attackCostReduction += 1;
        state.log.push({
          text: `Ascendance (${duration} turns): Windfury always triggers; attacks cost 1 less this turn.`,
          color: '#67e8f9',
        });
        break;
      }
      case 'doubleDotTicks': {
        const duration = effect.duration ?? 1;
        addStatus(state.player, {
          id: uid('doubleDot'),
          name: 'Eclipse',
          kind: 'doubleDotTicks',
          value: 1,
          duration,
        });
        state.log.push({
          text: `DoTs tick twice for ${duration} turn${duration === 1 ? '' : 's'}.`,
          color: '#c4b5fd',
        });
        break;
      }
    }
  }

  // Void Eruption payoff: bonus damage per active DoT on each enemy.
  if (card.id === 'void_eruption') {
    for (const e of state.enemies.filter((en) => en.hp > 0)) {
      const dots = countDots(e);
      if (dots <= 0) continue;
      const bonus = 12 * dots;
      const dealt = applyDamage(e, bonus, state, 'player');
      dealtDamage = true;
      state.log.push({
        text: `Void Eruption: +${dealt} from ${dots} DoT(s) on ${e.name}.`,
        color: '#a78bfa',
      });
    }
  }

  return dealtDamage;
}

function tickStatuses(c: Combatant, state: CombatState, isPlayer: boolean): void {
  const remaining: StatusEffect[] = [];
  for (const s of c.statuses) {
    if (s.kind === 'regen') {
      const healed = heal(c, s.value, state);
      if (isPlayer) {
        state.log.push({ text: `Regen healed ${healed}.`, color: '#86efac' });
        if (healed > 0) triggerEcho(state, 'heal');
        const itemHot = itemHotTickBlock(state.itemState.items);
        if (itemHot > 0) {
          grantBlock(state.player, itemHot, state);
          state.log.push({
            text: `Lifebloom Crown: +${itemHot} Block.`,
            color: '#7dd3fc',
          });
        }
        if (healed > 0) {
          forEachItemEffect(state.itemState, 'onHeal', makeItemApi(state), {
            healAmount: healed,
            wasFullHp: false,
          });
        }
      }
    }
    if (s.kind === 'bleed' || s.kind === 'poison') {
      const bonus = !isPlayer ? itemDotTickBonus(state.itemState.items) : 0;
      const ticks =
        !isPlayer &&
        (getStatus(state.player, 'voidform') || getStatus(state.player, 'doubleDotTicks'))
          ? 2
          : 1;
      for (let tick = 0; tick < ticks; tick++) {
        const tickDmg = s.value + bonus;
        c.hp = Math.max(0, c.hp - tickDmg);
        queueHitsplat(state, c.id, 'damage', tickDmg);
        state.log.push({
          text: `${c.name} takes ${tickDmg} from ${s.name}${ticks > 1 && tick === 1 ? ' (extra tick)' : ''}.`,
          color: '#f87171',
        });
        if (!isPlayer) {
          forEachItemEffect(state.itemState, 'onEnemyDotTick', makeItemApi(state), {});
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

  state.discardPile.push(...state.hand);
  state.hand = [];
  state.cardsPlayedThisTurn = [];
  state.elementalAttacksThisTurn = [];
  state.attackCostReduction = 0;
  state.exhaustAllPlayedThisTurn = false;
  state.elementalEchoCharges = 0;

  state.phase = 'enemy';
  state.log.push({ text: '— Enemy Turn —', color: '#fca5a5' });
  return buildEnemyTurnSteps(state);
}

function buildEnemyTurnSteps(state: CombatState): EnemyTurnStep[] {
  const steps: EnemyTurnStep[] = [];
  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) continue;
    steps.push({ kind: 'statusTick', enemyId: enemy.id });
    const intent = enemy.intent ?? pickIntent(enemy.enemyDefId!, undefined, state.enemyScale);
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
      enemy.intent = pickIntent(enemy.enemyDefId, enemy, state.enemyScale);
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
  state.playDrawUsedThisTurn = false;
  state.cardsPlayedThisTurn = [];
  state.elementalAttacksThisTurn = [];
  state.attackCostReduction = 0;
  state.exhaustAllPlayedThisTurn = false;
  itemBeginTurn(state.itemState);
  const itemPct = itemBlockCarryoverPct(state.itemState.items);
  const totalPct = Math.min(100, itemPct);
  const finalCarried =
    totalPct > 0 ? Math.floor(state.player.block * (totalPct / 100)) : 0;
  state.player.block = finalCarried;
  if (finalCarried > 0) {
    state.log.push({
      text: `Block carries over: ${finalCarried} (${totalPct}%).`,
      color: '#7dd3fc',
    });
  }

  tickStatuses(state.player, state, true);
  if (state.player.hp <= 0) {
    state.phase = 'defeat';
    state.log.push({ text: 'You have fallen...', color: '#ef4444' });
    return;
  }

  const waterEnergy = state.pendingEnergyFromWaterShield;
  state.energy =
    state.energyMax + state.pendingEnergy + waterEnergy;
  if (state.pendingEnergy > 0) {
    state.log.push({
      text: `Pending energy: +${state.pendingEnergy}.`,
      color: '#fde68a',
    });
    state.pendingEnergy = 0;
  }
  if (waterEnergy > 0) {
    state.log.push({
      text: `Water Shield: +${waterEnergy} Energy.`,
      color: '#38bdf8',
    });
    state.pendingEnergyFromWaterShield = 0;
  }

  drawCards(state, 5);
  tickTotemAuras(state);
  forEachItemEffect(state.itemState, 'turnStart', makeItemApi(state), {});
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
      if (getStatus(enemy, 'hex')) {
        state.log.push({
          text: `${enemy.name} is Hexed and cannot attack!`,
          color: '#a78bfa',
        });
        break;
      }
      let dmg = intent.value + (strength?.value ?? 0);
      const weak = getStatus(enemy, 'weak');
      if (weak) dmg = Math.floor(dmg * WEAK_MULTIPLIER);
      const dealt = applyDamage(state.player, dmg, state);
      state.log.push({
        text: `${enemy.name} attacks for ${dealt}!`,
        color: '#fca5a5',
      });
      const thornsStatus = getStatus(state.player, 'thorns');
      const totemThorns = totemAuraBonus(state, 'thorns');
      const thornsValue = (thornsStatus?.value ?? 0) + totemThorns;
      if (thornsValue > 0 && enemy.hp > 0) {
        const reflected = applyDamage(enemy, thornsValue, state, 'player');
        state.log.push({
          text: `Thorns deal ${reflected} to ${enemy.name}!`,
          color: '#86efac',
        });
      }
      break;
    }
    case 'defend': {
      grantBlock(enemy, intent.value, state);
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
      const label = intent.label.toLowerCase();
      const isPoison =
        label.includes('venom') || label.includes('poison');
      const isWeak =
        label.includes('curse') ||
        label.includes('slumber') ||
        label.includes('sleep') ||
        label.includes('screech') ||
        label.includes('daze') ||
        label.includes('nightmare') ||
        label.includes('grasping') ||
        label.includes('vines');
      const isVuln =
        label.includes('crush') ||
        label.includes('thunderclap') ||
        label.includes('terrify') ||
        label.includes('tear') ||
        label.includes('mark') ||
        label.includes('static') ||
        label.includes('pin');

      if (isPoison || (!isWeak && !isVuln && intent.value >= 4)) {
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
      } else if (isWeak) {
        addStatus(state.player, {
          id: uid('weak'),
          name: 'Weak',
          kind: 'weak',
          value: 1,
          duration: Math.max(2, intent.value || 2),
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
      const healed = heal(enemy, intent.value, state);
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
        const healed = heal(enemy, Math.max(8, intent.value * 8), state);
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
        // Summons inherit the fight's floor scale (previously spawned at base stats).
        state.enemies.push(createEnemyCombatant(summonId, state.enemyScale));
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

/** Persist combat-gained deck cards/gold after a win. Curses never leave the fight. */
export function commitPendingDeckCards(run: RunState, state: CombatState): void {
  for (const inst of state.pendingDeckCards) {
    if (cardDef(inst)?.curse) continue;
    run.deck.push(cloneCard(inst));
  }
  state.pendingDeckCards = [];
  run.deck = run.deck.filter((inst) => !cardDef(inst)?.curse);
  if (state.pendingGold > 0) {
    run.gold += state.pendingGold;
    state.pendingGold = 0;
  }
}
