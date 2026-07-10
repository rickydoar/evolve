export type Form = 'bear' | 'cat' | 'boomkin' | 'tree';

export type TalentTree = 'feral' | 'resto' | 'balance';

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
  /** Permanent spell power granted at combat start (per rank). Boomkin spells only. */
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
  type: 'attack' | 'defend' | 'buff' | 'debuff' | 'heal';
  value: number;
  label: string;
}

export interface EnemyDef {
  id: string;
  name: string;
  maxHp: number;
  art: string;
  intents: EnemyIntent[];
  isBoss?: boolean;
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

export interface RunState {
  classId: 'druid';
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
