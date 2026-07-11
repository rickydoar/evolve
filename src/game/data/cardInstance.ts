import type { CardDef, CardEffect, CardInstance, EffectKind, RunState } from './types';

export const MAX_CARD_UPGRADE = 2;
export const CARD_UPGRADE_SHOP_COST = 40;

/** First upgrade each run is free; later upgrades cost CARD_UPGRADE_SHOP_COST. */
export function cardUpgradeShopCost(run: Pick<RunState, 'freeUpgradeAvailable'>): number {
  return run.freeUpgradeAvailable ? 0 : CARD_UPGRADE_SHOP_COST;
}

/** Spend gold (if any) and clear the free-upgrade flag after a successful upgrade. */
export function payForCardUpgrade(run: RunState): boolean {
  const cost = cardUpgradeShopCost(run);
  if (run.gold < cost) return false;
  run.gold -= cost;
  run.freeUpgradeAvailable = false;
  return true;
}

export function makeCard(defId: string, upgrade = 0): CardInstance {
  return {
    defId,
    upgrade: Math.max(0, Math.min(MAX_CARD_UPGRADE, Math.floor(upgrade))),
  };
}

export function cloneCard(card: CardInstance): CardInstance {
  return { defId: card.defId, upgrade: card.upgrade };
}

export function makeDeck(defIds: string[]): CardInstance[] {
  return defIds.map((id) => makeCard(id));
}

/** Display name with upgrade suffix: base → " 1", first upgrade → " 2", second → " 3". */
export function cardDisplayName(card: CardInstance | string, def?: CardDef): string {
  const inst = typeof card === 'string' ? makeCard(card) : card;
  const base = def?.name ?? inst.defId;
  return `${base} ${inst.upgrade + 1}`;
}

/**
 * Each upgrade multiplies magnitude by 1.3, rounded down, applied sequentially.
 * Does NOT scale duration fields.
 */
export function scaleByUpgrade(base: number, upgrade: number): number {
  let v = Math.floor(base);
  for (let i = 0; i < upgrade; i++) {
    v = Math.floor(v * 1.3);
  }
  return v;
}

/** Effect kinds whose `value` does not scale with upgrades. */
const NON_SCALING: Set<EffectKind> = new Set([
  'cleanse',
  'doubleBuffs',
  'summonTotem',
  'vulnerable',
  'weaken',
  'hex',
  'exhaust',
  'stripEnemyBuffs',
  'retrieveDiscard',
  'freeIfAllElemental',
  'echoElements',
  'waterShield',
  'spiritWalkersGrace',
  'consumeFlameShock',
  'voidform',
  'elementalEchoTurn',
  'perfectWindfury',
  'doubleDotTicks',
  'healAlsoDraw',
  'consumeBleeds',
  'gainAstral',
]);

export function scaleEffectValue(effect: CardEffect, upgrade: number): number {
  if (
    effect.kind === 'bloodlust' ||
    effect.kind === 'removeTotemsHeal' ||
    effect.kind === 'refundIfFlameShock' ||
    effect.kind === 'masterElements' ||
    effect.kind === 'stormstrikeMark'
  ) {
    return scaleByUpgrade(effect.value, upgrade);
  }
  if (NON_SCALING.has(effect.kind)) return effect.value;
  return scaleByUpgrade(effect.value, upgrade);
}

export function canUpgradeCard(card: CardInstance): boolean {
  return card.upgrade < MAX_CARD_UPGRADE;
}

export function upgradeCard(card: CardInstance): CardInstance {
  if (!canUpgradeCard(card)) return cloneCard(card);
  return makeCard(card.defId, card.upgrade + 1);
}
