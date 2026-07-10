export type ClassId = 'druid' | 'priest';

/** Druid forms + Priest schools (used for card borders / talent matching). */
export type Form =
  | 'bear'
  | 'cat'
  | 'boomkin'
  | 'tree'
  | 'holy'
  | 'shadow'
  | 'discipline';

export type TalentTree =
  | 'feral'
  | 'resto'
  | 'balance'
  | 'holy'
  | 'shadow'
  | 'discipline';

export type TargetType = 'enemy' | 'allEnemies' | 'self' | 'none';

export type EffectKind =
  | 'damage'
  | 'aoeDamage'
  | 'block'
  | 'heal'
  | 'healOverTime'
  | 'damageOverTime'
  | 'cleanse'
  | 'spellPower'
  | 'earthAndMoon'
  | 'draw'
  | 'strength'
  | 'vulnerable'
  | 'energy';

export interface CardEffect {
  kind: EffectKind;
  value: number;
  duration?: number;
  /** Max enemies hit for aoe (e.g. swipe hits 4) */
  maxTargets?: number;
}

export interface CardDef {
  id: string;
  name: string;
  form: Form;
  cost: number;
  description: string;
  target: TargetType;
  effects: CardEffect[];
  art: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

/**
 * Transformative combat behaviors. Flat +X is fine early; mid/capstones should
 * change how cards play (new verbs), not just inflate numbers.
 */
export type TalentSpecial =
  /** Shred goes to Exhaust and draws this many (replaces the base draw 1). */
  | { type: 'shredExhaustDraw'; draw: number }
  /** When you Exhaust a card, gain this much Block (per rank). */
  | { type: 'exhaustGrantsBlock'; block: number }
  /** Ferocious Bite costs 0 while any living enemy is bleeding. */
  | { type: 'bleedBiteFree' }
  /** Named HoT cards also grant Block each regen tick (per rank). */
  | { type: 'hotTickBlock'; cardIds: string[]; blockPerTick: number }
  /** Heal-over-time effects from matching cards last this many extra turns (per rank). */
  | { type: 'hotExtraDuration'; cardIds: string[]; extra: number }
  /** Every Nth card of this form costs 0. */
  | { type: 'nthFormSpellFree'; form: Form; every: number }
  /** When a form spell costs 0 from nthFormSpellFree, draw this many. */
  | { type: 'freeSpellDraw'; draw: number }
  /** Earth and Moon is not consumed by Wrath / Starfire. */
  | { type: 'earthAndMoonPersistent' }
  /** This percent of leftover Block carries into your next turn. */
  | { type: 'blockCarryover'; pct: number }
  /** Void Eruption detonates enemy DoTs for their remaining damage. */
  | { type: 'voidDetonateDots' }
  /** When an enemy DoT ticks, heal the player (per rank). */
  | { type: 'dotTickHeal'; heal: number }
  /** When a bleed tick kills an enemy, gain Energy (per rank). */
  | { type: 'bleedKillEnergy'; energy: number }
  /** After playing a matching heal card, gain Block (per rank). */
  | { type: 'healPlayGrantsBlock'; forms?: Form[]; cardIds?: string[]; block: number }
  /** At turn start, gain Block per active player HoT (per rank). */
  | { type: 'blockPerHot'; block: number }
  /** Draw this many cards at combat start (per rank). */
  | { type: 'combatStartDraw'; draw: number }
  /** When you kill an enemy, draw this many (per rank). */
  | { type: 'killDraw'; draw: number }
  /** When you kill an enemy, heal this much (per rank). */
  | { type: 'killHeal'; heal: number }
  /** Draw this many at the start of each of your turns (per rank). */
  | { type: 'startTurnDraw'; draw: number }
  /** Gain this much Block at the start of each of your turns (per rank). */
  | { type: 'startTurnBlock'; block: number }
  /** Gain this much Energy at the start of each of your turns (per rank). */
  | { type: 'startTurnEnergy'; energy: number }
  /** After a matching card deals damage, gain Block (per rank). */
  | { type: 'damageGrantsBlock'; forms?: Form[]; cardIds?: string[]; block: number }
  /** After playing a matching card, draw (optionally once per turn). */
  | {
      type: 'playDraw';
      forms?: Form[];
      cardIds?: string[];
      draw: number;
      oncePerTurn?: boolean;
    }
  /** Reduce energy cost of matching cards (per rank). */
  | { type: 'cardCostReduce'; cardIds: string[]; amount: number }
  /** Playing a matching card also removes your debuffs. */
  | { type: 'cleanseOnPlay'; forms?: Form[]; cardIds?: string[] }
  /** Playing a matching card also applies Vulnerable. */
  | { type: 'alsoVulnerable'; cardIds: string[]; duration: number }
  /** When you gain Block from a card, also heal (per rank). */
  | { type: 'blockGainHeal'; heal: number }
  /** Damage-over-time from matching cards lasts extra turns (per rank). */
  | { type: 'dotExtraDuration'; cardIds: string[]; extra: number };

/** Flat bonuses + optional transformative specials applied per talent rank. */
export interface TalentModifier {
  /** Card ids this talent affects. Empty / omitted = use forms. */
  cardIds?: string[];
  /** Forms this talent affects when cardIds is omitted. */
  forms?: Form[];
  /** Effect kinds to boost. Omit to boost all matching kinds below. */
  effectKinds?: EffectKind[];
  damageBonus?: number;
  healBonus?: number;
  blockBonus?: number;
  /** Permanent spell power granted at combat start (per rank). Caster spells only. */
  spellPowerBonus?: number;
  /** Multiplicative heal bonus as percent (e.g. 20 = +20%). */
  healPct?: number;
  /** Multiplicative damage bonus as percent (e.g. 15 = +15%). */
  damagePct?: number;
  /** Multiplicative block bonus as percent (e.g. 25 = +25%). */
  blockPct?: number;
  /** Transformative combat behaviors (mid/capstone verbs). */
  specials?: TalentSpecial[];
}

export interface TalentDef {
  id: string;
  name: string;
  tree: TalentTree;
  description: string;
  maxRanks: number;
  /** Row in the tree (0 = top). Unlocking requires tier * POINTS_PER_TIER points in this tree. */
  tier: number;
  /** Column within the tree (0–2) for layout. */
  column: number;
  /** Talent that must have ≥1 rank before this can be taken. */
  requires?: string;
  /** Short glyph shown in the talent node (1–2 chars). */
  glyph: string;
  modifiers: TalentModifier;
}

export interface StatusEffect {
  id: string;
  name: string;
  kind:
    | 'block'
    | 'vulnerable'
    | 'poison'
    | 'bleed'
    | 'regen'
    | 'spellPower'
    | 'earthAndMoon'
    | 'strength'
    | 'weak';
  value: number;
  duration: number;
  stacks?: boolean;
}

export interface EnemyIntent {
  type: 'attack' | 'defend' | 'buff' | 'debuff' | 'heal' | 'summon';
  value: number;
  label: string;
  /** Enemy id to spawn for summon intents. */
  summonId?: string;
}

export interface EnemyDef {
  id: string;
  name: string;
  maxHp: number;
  art: string;
  intents: EnemyIntent[];
  isBoss?: boolean;
  isElite?: boolean;
  /**
   * When HP falls to 40% or below, the enemy switches to this intent pool
   * (enrage / second phase).
   */
  enrageIntents?: EnemyIntent[];
}

export interface Combatant {
  id: string;
  name: string;
  maxHp: number;
  hp: number;
  block: number;
  statuses: StatusEffect[];
  art?: string;
  isPlayer?: boolean;
  enemyDefId?: string;
  intent?: EnemyIntent;
  /** True after the enemy has entered its enrage / phase-2 intent pool. */
  enraged?: boolean;
}

export type NodeType = 'combat' | 'elite' | 'rest' | 'treasure' | 'shop' | 'boss';

export interface MapNode {
  id: string;
  floor: number;
  index: number;
  type: NodeType;
  enemyIds: string[];
  connections: string[];
  cleared: boolean;
}

/** Opening form (Druid) or school (Priest) chosen at run start. */
export type OpeningSpec = Form;

export interface ClassDef {
  id: ClassId;
  name: string;
  subtitle: string;
  blurb: string;
  heroArt: string;
  maxHp: number;
  startingGold: number;
  starterDeck: string[];
  rewardPool: string[];
  talentTrees: TalentTree[];
  /** Forms/schools offered as opening specializations. */
  openingSpecs: OpeningSpec[];
}

export interface RunState {
  classId: ClassId;
  /** Form/school chosen at run start; shapes the starter deck. */
  openingSpec: OpeningSpec;
  hp: number;
  maxHp: number;
  gold: number;
  floor: number;
  deck: string[];
  discard: string[];
  drawPile: string[];
  hand: string[];
  map: MapNode[];
  currentNodeId: string | null;
  energyMax: number;
  spellPowerBonus: number;
  victories: number;
  /** Unspent talent points (1 awarded per fight won). */
  talentPoints: number;
  /** Talent id → ranks allocated. */
  talents: Record<string, number>;
  /** Shop rerolls since last fight; cost = 1 + this value. Resets after each combat victory. */
  shopRerollCount: number;
  /** Heal potions held (usable from the map). */
  potions: number;
  /** Cards removed at shops this run (drives escalating remove cost). */
  cardsRemoved: number;
}
