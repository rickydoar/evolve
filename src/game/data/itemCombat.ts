/**
 * Runtime item effect resolution during combat.
 * Called from CombatSystem at lifecycle hooks.
 */
import {
  ITEMS,
  ITEM_CLEANSE_KINDS,
  createItemFlags,
  itemBlockCarryoverPct,
  itemFlatBlockBonus,
  itemFlatDamageBonus,
  itemFlatHealBonus,
  itemLifebloomCrown,
  itemRecoilReducePct,
  itemSacredFlameBonus,
  itemTreeCostReduce,
  itemTwinStar,
  resetItemTurnFlags,
  type CombatItemFlags,
  type ItemEffect,
} from './items';
import type { CardDef, Combatant, StatusEffect } from './types';

export type ItemCombatApi = {
  drawCards: (count: number) => void;
  gainBlock: (amount: number, triggerEcho?: boolean) => void;
  healPlayer: (amount: number, triggerEcho?: boolean) => number;
  dealRandom: (amount: number) => void;
  dealLowest: (amount: number) => void;
  dealAll: (amount: number) => void;
  addEnergy: (amount: number) => void;
  addSpellPower: (amount: number) => void;
  addStrength: (amount: number) => void;
  applyVulnerable: (duration: number, card?: CardDef) => void;
  applyBleedAll: (total: number, duration: number, name: string) => void;
  cleanseOne: () => void;
  addGold: (amount: number) => void;
  log: (text: string, color?: string) => void;
  player: Combatant;
  livingEnemies: () => Combatant[];
};

export interface ItemCombatState {
  items: string[];
  flags: CombatItemFlags;
  /** Tree cards played this turn (grove_battery). */
  treePlaysThisTurn: number;
}

export function createItemCombatState(items: string[]): ItemCombatState {
  return {
    items: [...items],
    flags: createItemFlags(),
    treePlaysThisTurn: 0,
  };
}

function effectKey(itemId: string, fxIndex: number): string {
  return `${itemId}#${fxIndex}`;
}

function matchesCard(fx: ItemEffect, card?: CardDef): boolean {
  if (!card) return !fx.forms && !fx.cardIds && fx.exactCost == null && fx.minCost == null;
  if (fx.forms && !fx.forms.includes(card.form)) return false;
  if (fx.cardIds && !fx.cardIds.includes(card.id)) return false;
  if (fx.exactCost != null && card.cost !== fx.exactCost) return false;
  if (fx.minCost != null && card.cost < fx.minCost) return false;
  return true;
}

function canFire(
  state: ItemCombatState,
  itemId: string,
  fxIndex: number,
  fx: ItemEffect,
): boolean {
  const key = effectKey(itemId, fxIndex);
  if (fx.oncePerCombat && state.flags.combat[key]) return false;
  if (fx.oncePerTurn && state.flags.turn[key]) return false;
  return true;
}

function markFired(
  state: ItemCombatState,
  itemId: string,
  fxIndex: number,
  fx: ItemEffect,
): void {
  const key = effectKey(itemId, fxIndex);
  if (fx.oncePerCombat) state.flags.combat[key] = true;
  if (fx.oncePerTurn) state.flags.turn[key] = true;
}

function hpRatio(player: Combatant): number {
  return player.maxHp <= 0 ? 1 : player.hp / player.maxHp;
}

export function itemBeginTurn(state: ItemCombatState): void {
  resetItemTurnFlags(state.flags);
  state.treePlaysThisTurn = 0;
}

export function itemModifyOutgoingDamage(
  items: string[],
  card: CardDef | undefined,
  base: number,
): number {
  let dmg = base + itemFlatDamageBonus(items);
  if (card) dmg += itemSacredFlameBonus(items, card.id);
  return dmg;
}

export function itemModifyHealAmount(items: string[], amount: number): number {
  return amount + itemFlatHealBonus(items);
}

export function itemModifyBlockAmount(items: string[], amount: number): number {
  return amount + itemFlatBlockBonus(items);
}

export function itemModifyCardCost(items: string[], card: CardDef, cost: number): number {
  let c = cost;
  if (card.form === 'tree') c = Math.max(0, c - itemTreeCostReduce(items));
  return c;
}

export function itemModifyRecoil(items: string[], amount: number): number {
  const pct = itemRecoilReducePct(items);
  if (pct <= 0) return amount;
  return Math.floor(amount * (1 - pct / 100));
}

export function itemExtraBlockCarryover(items: string[], block: number): number {
  const pct = itemBlockCarryoverPct(items);
  if (pct <= 0) return 0;
  return Math.floor(block * (pct / 100));
}

export function itemHotTickBlock(items: string[]): number {
  return itemLifebloomCrown(items) ? 1 : 0;
}

export function forEachItemEffect(
  state: ItemCombatState,
  trigger: ItemEffect['trigger'],
  api: ItemCombatApi,
  ctx: {
    card?: CardDef;
    healAmount?: number;
    blockAmount?: number;
    damageAmount?: number;
    isRandomDamage?: boolean;
    wasFullHp?: boolean;
  } = {},
): void {
  for (const itemId of state.items) {
    const def = ITEMS[itemId];
    if (!def) continue;
    def.effects.forEach((fx, fxIndex) => {
      if (fx.trigger !== trigger) return;
      if (!canFire(state, itemId, fxIndex, fx)) return;
      if (!matchesCard(fx, ctx.card)) return;

      if (fx.maxHpRatio != null && hpRatio(api.player) > fx.maxHpRatio) return;
      if (fx.requireFullHp && !ctx.wasFullHp) return;
      if (fx.minHeal != null && (ctx.healAmount ?? 0) < fx.minHeal) return;
      if (fx.minBlock != null && (ctx.blockAmount ?? 0) < fx.minBlock) return;
      if (fx.requireBleed) {
        const bleeding = api.livingEnemies().some((e) =>
          e.statuses.some((s) => s.kind === 'bleed'),
        );
        if (!bleeding) return;
      }

      // Grove Battery: fire only on 2nd tree card
      if (itemId === 'grove_battery' && trigger === 'onPlayCard') {
        if (ctx.card?.form !== 'tree') return;
        if (state.treePlaysThisTurn !== 2) return;
      }

      // Twin Star only on random damage path
      if (fx.kind === 'doubleRandomHalf' && !ctx.isRandomDamage) return;

      // Barkbreaker: need cumulative block this turn including this gain >= 10,
      // and only once — minBlock checks current gain; use cumulative
      if (itemId === 'barkbreaker_seed' && trigger === 'onGainBlock') {
        const total = state.flags.blockGainedThisTurn;
        if (total < 10) return;
      }

      markFired(state, itemId, fxIndex, fx);
      resolveEffect(fx, def.name, api, ctx);
    });
  }
}

function resolveEffect(
  fx: ItemEffect,
  itemName: string,
  api: ItemCombatApi,
  ctx: {
    card?: CardDef;
    healAmount?: number;
    blockAmount?: number;
    damageAmount?: number;
  },
): void {
  switch (fx.kind) {
    case 'draw':
      api.drawCards(fx.value);
      api.log(`${itemName}: drew ${fx.value}.`, '#e2e8f0');
      break;
    case 'block':
      api.gainBlock(fx.value, false);
      api.log(`${itemName}: +${fx.value} Block.`, '#7dd3fc');
      break;
    case 'heal': {
      const h = api.healPlayer(fx.value, false);
      if (h > 0) api.log(`${itemName}: healed ${h}.`, '#86efac');
      break;
    }
    case 'energy':
      api.addEnergy(fx.value);
      api.log(`${itemName}: +${fx.value} Energy.`, '#fde68a');
      break;
    case 'spellPower':
      api.addSpellPower(fx.value);
      api.log(`${itemName}: +${fx.value} Spell Power.`, '#a78bfa');
      break;
    case 'strength':
      api.addStrength(fx.value);
      api.log(`${itemName}: +${fx.value} Strength.`, '#fca5a5');
      break;
    case 'damageRandom':
      api.dealRandom(fx.value);
      api.log(`${itemName}: ${fx.value} damage.`, '#ffb347');
      break;
    case 'damageLowest':
      api.dealLowest(fx.value);
      api.log(`${itemName}: ${fx.value} to lowest.`, '#ffb347');
      break;
    case 'damageAll':
      api.dealAll(fx.value);
      api.log(`${itemName}: ${fx.value} to all.`, '#ffb347');
      break;
    case 'healOnDotTick': {
      const h = api.healPlayer(fx.value, false);
      if (h > 0) api.log(`${itemName}: leeched ${h}.`, '#86efac');
      break;
    }
    case 'energyOnRecoil':
      api.addEnergy(fx.value);
      api.log(`${itemName}: +${fx.value} Energy from recoil.`, '#fde68a');
      break;
    case 'applyVulnerable': {
      const dur = fx.statusDuration ?? 1;
      api.applyVulnerable(dur, ctx.card);
      api.log(`${itemName}: Vulnerable ${dur}.`, '#fb923c');
      break;
    }
    case 'applyBleed': {
      const dur = fx.statusDuration ?? 2;
      api.applyBleedAll(fx.value, dur, itemName);
      break;
    }
    case 'cleanseOne':
      api.cleanseOne();
      api.log(`${itemName}: cleansed a debuff.`, '#fde68a');
      break;
    case 'gold':
      api.addGold(fx.value);
      api.log(`${itemName}: +${fx.value} Gold.`, '#fbbf24');
      break;
    case 'thornsBonusBlock':
      api.gainBlock(fx.value, false);
      api.log(`${itemName}: +${fx.value} Block.`, '#7dd3fc');
      break;
    case 'doubleRandomHalf': {
      const half = Math.ceil((ctx.damageAmount ?? 0) / 2);
      if (half > 0) {
        api.dealRandom(half);
        api.log(`${itemName}: twin hit ${half}.`, '#c4b5fd');
      }
      break;
    }
    case 'dotBonusPerTick':
    case 'dotExtraDuration':
    case 'reduceRecoilPct':
    case 'blockCarryoverPct':
    case 'vulnerableBonusDuration':
    case 'flag':
    case 'energyMax':
    case 'potion':
    case 'applyWeaken':
      // Handled via dedicated readers / other hooks
      break;
    default:
      break;
  }
}

export function itemDotTickBonus(items: string[]): number {
  let bonus = 0;
  if (items.includes('bloodfang_charm')) bonus += 4;
  if (items.includes('pain_amplifier')) bonus += 2;
  return bonus;
}

export function itemDotExtraDuration(items: string[]): number {
  let extra = 0;
  if (items.includes('venom_vial')) extra += 1;
  if (items.includes('pain_amplifier')) extra += 1;
  return extra;
}

export function itemHasVoidLeech(items: string[]): boolean {
  return items.includes('void_leech');
}

export function itemHasDeathWish(items: string[]): boolean {
  return items.includes('death_wish');
}

export function itemHasTwinStar(items: string[]): boolean {
  return itemTwinStar(items);
}

export function itemCleanseKinds(): StatusEffect['kind'][] {
  return ITEM_CLEANSE_KINDS;
}

export { createItemFlags, resetItemTurnFlags };
