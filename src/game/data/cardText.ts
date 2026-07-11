import { CARDS } from './cards';
import {
  cardDisplayName,
  scaleByUpgrade,
  scaleEffectValue,
} from './cardInstance';
import { TOTEMS } from './shamanCards';
import type { CardDef, CardEffect, CardInstance, Combatant } from './types';

/**
 * Static / upgrade-aware card description (no talent modifiers).
 * Pass upgrade via CardInstance; optional combat context adds live damage preview.
 */
export function getCardDescription(
  card: CardDef,
  _talentsOrUpgrade: Record<string, number> | number = 0,
  upgrade = 0,
): string {
  // Back-compat: old call sites passed talents Record — treat as upgrade 0.
  const up =
    typeof _talentsOrUpgrade === 'number' ? _talentsOrUpgrade : upgrade;
  return describeCard(card, up);
}

export function getCardInstanceDescription(inst: CardInstance): string {
  const def = CARDS[inst.defId];
  if (!def) return inst.defId;
  return describeCard(def, inst.upgrade);
}

function describeCard(card: CardDef, upgrade: number): string {
  if (card.id === 'penance') {
    return 'Deal damage and Heal equal to half your current Block.';
  }

  if (card.effects.length) {
    const parts = card.effects
      .map((e) => effectDescription(e, card, upgrade))
      .filter(Boolean);
    if (parts.length) return parts.join(' ');
  }

  return card.description;
}

function effectDescription(effect: CardEffect, card: CardDef, upgrade: number): string {
  const value = scaleEffectValue(effect, upgrade);
  const dur = effect.duration;
  switch (effect.kind) {
    case 'damage':
      return `Deal ${value} damage.`;
    case 'aoeDamage':
      return effect.maxTargets
        ? `Deal ${value} damage to up to ${effect.maxTargets} enemies.`
        : `Deal ${value} damage to ALL enemies.`;
    case 'randomDamage':
      return `Deal ${value} damage to a random enemy.`;
    case 'recoil':
      return `Take ${value} recoil.`;
    case 'block':
      return `Gain ${value} Block.`;
    case 'heal':
      return `Heal ${value} health.`;
    case 'healOverTime':
      return `Heal ${value} health over ${dur ?? 1} turns.`;
    case 'damageOverTime':
      return `Deal ${value} damage over ${dur ?? 1} turns.`;
    case 'cleanse':
      return 'Remove all debuffs from yourself.';
    case 'earthAndMoon':
      return `Apply Earth and Moon: next Wrath or Starfire deals +${value}% damage.`;
    case 'draw':
      return `Draw ${value} card${value === 1 ? '' : 's'}.`;
    case 'drawTyped': {
      const label =
        effect.cardType === 'heal' ? 'Heal' : effect.cardType === 'block' ? 'Armor' : 'Attack';
      return `Draw ${value} random ${label} card${value === 1 ? '' : 's'}.`;
    }
    case 'spellPower':
    case 'masterElements':
      return `Spell power +${value} for the rest of combat.`;
    case 'strength':
      return `Gain ${value} Strength this combat.`;
    case 'vulnerable':
      return `Apply Vulnerable for ${dur ?? 2} turn${(dur ?? 2) === 1 ? '' : 's'}.`;
    case 'weaken':
      return `Apply Weak for ${dur ?? 2} turn${(dur ?? 2) === 1 ? '' : 's'} (enemies deal 25% less).`;
    case 'energy':
      return `Gain ${value} Energy.`;
    case 'copyCard':
      return `Copy ${value} random card${value === 1 ? '' : 's'} into your draw pile.`;
    case 'shuffleCurse':
      return `Shuffle ${value} Nightmare into your deck this combat.`;
    case 'doubleBuffs':
      return 'Double your current buffs.';
    case 'echo': {
      const from =
        effect.echoFrom === 'heal'
          ? 'Heal'
          : effect.echoFrom === 'block'
            ? 'gain Block'
            : 'deal damage';
      const to =
        effect.echoTo === 'heal'
          ? `Heal ${value}`
          : effect.echoTo === 'block'
            ? `gain ${value} Block`
            : `deal ${value} damage to a random enemy`;
      return `This turn, whenever you ${from}, also ${to}.`;
    }
    case 'discardRandom':
      return `Discard ${value} card${value === 1 ? '' : 's'}.`;
    case 'discardDraw': {
      const d = effect.discardCount ?? value;
      const draw = effect.drawValue ?? value;
      return `Discard ${d}: Draw ${draw}.`;
    }
    case 'discardFor': {
      const d = effect.discardCount ?? 1;
      const bonus = effect.bonusPerDiscard
        ? scaleByUpgrade(effect.bonusPerDiscard, upgrade)
        : 0;
      const kind = effect.payoffKind ?? 'block';
      const payoff =
        kind === 'heal'
          ? `Heal ${value}`
          : kind === 'damage' || kind === 'randomDamage'
            ? `Deal ${value} damage`
            : `Gain ${value} Block`;
      return `Discard up to ${d} cards. ${payoff}${bonus ? ` + ${bonus} per discarded` : ''}.`;
    }
    case 'retrieveDiscard': {
      const mode = effect.retrieveMode ?? 'hand';
      const typeLabel =
        effect.cardType === 'attack'
          ? 'Attack '
          : effect.cardType === 'heal'
            ? 'Heal '
            : effect.cardType === 'block'
              ? 'Armor '
              : '';
      if (mode === 'play') return `Play a random ${typeLabel}card from your discard.`;
      if (mode === 'top') return `Put a random ${typeLabel}discard card on top of your draw pile.`;
      return `Add a random ${typeLabel}card from your discard to your hand.`;
    }
    case 'thorns':
      return `Gain Thorns ${value} for ${dur ?? 3} turns.`;
    case 'summonTotem': {
      const totem = effect.totemId ? TOTEMS[effect.totemId] : undefined;
      if (!totem) return card.description;
      const elementLabel =
        totem.element === 'earth'
          ? 'Earth'
          : totem.element === 'fire'
            ? 'Fire'
            : totem.element === 'water'
              ? 'Water'
              : 'Air';
      return `Summon ${totem.name} for ${totem.duration ?? 3} turns. ${totem.description} Replaces your ${elementLabel} totem.`;
    }
    case 'stormstrikeMark':
      return `The next elemental attack deals ${value}% more damage on the target.`;
    case 'consumeFlameShock':
      return 'Consume a Flame Shock to instantly deal the remaining burn damage.';
    case 'stripEnemyBuffs':
      return 'Remove all buffs from an enemy.';
    case 'removeTotemsHeal':
      return `Remove all totems — Gain ${value} life per totem removed.`;
    case 'hex':
      return `Target cannot attack for ${dur ?? 2} turns.`;
    case 'waterShield':
      return `Lasts ${dur ?? 3} turns. Gain ${value} energy next turn every time you are attacked.`;
    case 'spiritWalkersGrace':
      return `Lasts ${dur ?? 3} turns. All healing does ${value}% damage to a random enemy.`;
    case 'echoElements':
      return 'Repeat all elemental attacks played this turn dealt to random enemies.';
    case 'bloodlust':
      return `Draw ${value} cards. All attacks cost 1 less. Exhaust all cards played this turn.`;
    case 'exhaust':
      return 'Exhaust.';
    case 'refundIfFlameShock':
      return `Refund ${value} energy if targeting an enemy with Flame Shock.`;
    case 'freeIfAllElemental':
      return 'Costs zero if all cards in hand are elemental.';
    case 'gainAstral':
      return `Gain ${value} Astral Power.`;
    case 'spendAstral':
      return `Spend all Astral Power: +${value} damage per stack; refund 1 Energy if spending 2+.`;
    case 'refundIfBleed':
      return `Refund ${value} energy if the target is already bleeding/DoTted.`;
    case 'consumeBleeds':
      return 'Consume all bleeds on the target, dealing remaining DoT damage instantly.';
    case 'voidform':
      return `Enter Voidform for ${dur ?? 2} turns (enemy DoTs tick twice).`;
    case 'elementalEchoTurn':
      return `This turn, your next ${value} elemental attack(s) each echo once to a random enemy.`;
    case 'healAlsoDraw':
      return `While active, healing also draws ${value} card${value === 1 ? '' : 's'}.`;
    case 'perfectWindfury':
      return `For ${dur ?? 2} turns, Windfury always triggers. Attacks cost 1 less this turn.`;
    case 'doubleDotTicks':
      return `Enemy DoTs tick twice for ${dur ?? 1} turn${(dur ?? 1) === 1 ? '' : 's'}.`;
    default:
      return '';
  }
}

/** Preview enemy attack damage after strength / weak. */
export function previewEnemyAttackDamage(enemy: Combatant): number {
  if (!enemy.intent || enemy.intent.type !== 'attack') return 0;
  let dmg = enemy.intent.value;
  const strength = enemy.statuses.find((s) => s.kind === 'strength');
  dmg += strength?.value ?? 0;
  const weak = enemy.statuses.find((s) => s.kind === 'weak');
  if (weak) dmg = Math.floor(dmg * 0.75);
  return Math.max(0, dmg);
}

/** Label for enemy intent including live damage preview. */
export function formatEnemyIntentLabel(enemy: Combatant): string {
  const intent = enemy.intent;
  if (!intent) return '';
  if (intent.type === 'attack') {
    const dmg = previewEnemyAttackDamage(enemy);
    return `⚔ ${dmg}`;
  }
  if (intent.type === 'summon') return `✦ ${intent.label}`;
  if (intent.type === 'heal') return `✚ ${intent.label}`;
  if (intent.type === 'buff') return `⬆ ${intent.label}`;
  if (intent.type === 'defend') return `🛡 ${intent.label}`;
  if (intent.type === 'debuff') return `☠ ${intent.label}`;
  return intent.label;
}

export { cardDisplayName };
