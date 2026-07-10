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

/** Flat bonuses applied per talent rank to matching card effects. */
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
}

export interface RunState {
  classId: ClassId;
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
}
