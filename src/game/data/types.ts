export type ClassId = 'druid' | 'priest' | 'shaman';

/** Druid forms + Priest schools + Shaman schools (card borders / affinity). */
export type Form =
  | 'bear'
  | 'cat'
  | 'boomkin'
  | 'tree'
  | 'holy'
  | 'shadow'
  | 'discipline'
  | 'resto'
  | 'enhance'
  | 'elemental';

export type TargetType = 'enemy' | 'allEnemies' | 'self' | 'none';

/** Tags used by typed draws / discard filters. */
export type CardTypeTag = 'attack' | 'heal' | 'block';

/** Totem element — only one living totem per element. */
export type TotemElement = 'earth' | 'fire' | 'water' | 'air';

export type TotemAuraKind =
  | 'strength'
  | 'spellPower'
  | 'regen'
  | 'thorns'
  | 'blockPerTurn'
  | 'energyOnTurn'
  /** Deal value damage to a random enemy each turn (Searing). */
  | 'randomDamagePerTurn'
  /** Enhance attacks have value% chance to trigger twice (Windfury). */
  | 'windfury'
  /** Next hit is redirected to this totem and destroys it (Grounding). */
  | 'grounding'
  /** +value Energy this turn; grows by +value each turn (Mana Tide). */
  | 'manaTide'
  /**
   * Searing identity: random damage + apply/refresh a small Flame Shock shred.
   * `value` = damage; shred magnitude is fixed in combat.
   */
  | 'searing'
  /**
   * Stoneskin identity: block each turn + grant Thorns while alive.
   * `value` = block/turn; thorns amount is fixed in combat.
   */
  | 'stoneskin';

export interface TotemAura {
  kind: TotemAuraKind;
  value: number;
}

export interface TotemDef {
  id: string;
  name: string;
  element: TotemElement;
  /**
   * Optional HP. Duration-based totems default to 0 HP and do not block
   * damage unless they have the grounding aura.
   */
  maxHp?: number;
  /** Turns the totem lasts (default 3). */
  duration?: number;
  art: string;
  aura: TotemAura;
  description: string;
}

export interface TotemCombatant {
  id: string;
  defId: string;
  name: string;
  element: TotemElement;
  maxHp: number;
  hp: number;
  /** Turns remaining; expires at 0. */
  turnsRemaining: number;
  art: string;
  aura: TotemAura;
  /** Mana Tide: current energy grant (starts at aura.value, +1 each turn). */
  manaTideEnergy?: number;
}

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
  | 'energy'
  | 'copyCard'
  | 'shuffleCurse'
  | 'weaken'
  | 'doubleBuffs'
  | 'drawTyped'
  | 'echo'
  | 'discardRandom'
  | 'discardDraw'
  | 'discardFor'
  | 'retrieveDiscard'
  | 'randomDamage'
  | 'recoil'
  | 'thorns'
  | 'summonTotem'
  /** Mark target: next elemental attack deals value% more damage. */
  | 'stormstrikeMark'
  /** Consume Flame Shock bleed on target; deal remaining DoT as instant damage. */
  | 'consumeFlameShock'
  /** Remove all buffs from targeted enemy. */
  | 'stripEnemyBuffs'
  /** Remove all totems; heal value HP per totem removed. */
  | 'removeTotemsHeal'
  /** Target cannot attack for duration turns. */
  | 'hex'
  /** Gain value energy next turn whenever attacked (duration turns). */
  | 'waterShield'
  /** While active, healing also deals 50% as damage to a random enemy. */
  | 'spiritWalkersGrace'
  /** Spell power +value for the rest of combat. */
  | 'masterElements'
  /** Repeat elemental attacks played this turn to random enemies. */
  | 'echoElements'
  /** Draw value; attacks cost 1 less; exhaust all cards played this turn. */
  | 'bloodlust'
  /** Exhaust this card after play (combat-only removal). */
  | 'exhaust'
  /** Refund value energy if target has Flame Shock. */
  | 'refundIfFlameShock'
  /** Card costs 0 when every card in hand is elemental. */
  | 'freeIfAllElemental'
  /** Gain value Astral Power stacks (Boomkin engine). */
  | 'gainAstral'
  /**
   * Spend all Astral Power: +value damage per stack to target (or random),
   * and refund 1 Energy if spending 2+ stacks.
   */
  | 'spendAstral'
  /** Refund value energy if target has any bleed/DoT. */
  | 'refundIfBleed'
  /** Consume all bleeds on target; deal remaining DoT as instant damage. */
  | 'consumeBleeds'
  /**
   * Voidform: enemy DoTs tick twice while active (value = unused; duration turns).
   */
  | 'voidform'
  /** This turn: each elemental attack is echoed once to a random enemy. */
  | 'elementalEchoTurn'
  /** While active, healing also draws value cards (once per heal). */
  | 'healAlsoDraw'
  /** Windfury 100% for duration turns (Ascendance). */
  | 'perfectWindfury'
  /** This turn, enemy DoTs tick an extra time when they would tick. */
  | 'doubleDotTicks';

export interface CardEffect {
  kind: EffectKind;
  value: number;
  duration?: number;
  /** Max enemies hit for aoe (e.g. swipe hits 4) */
  maxTargets?: number;
  /** Typed draw / echo / discard-for filters. */
  cardType?: CardTypeTag;
  /** Echo: trigger when this happens… */
  echoFrom?: CardTypeTag;
  /** Echo: …also do this (must differ from echoFrom). */
  echoTo?: CardTypeTag;
  /** retrieveDiscard destination. */
  retrieveMode?: 'hand' | 'play' | 'top';
  /** Secondary count (e.g. cards drawn by discardDraw). */
  drawValue?: number;
  /** Cards to discard for discardFor / discardDraw. */
  discardCount?: number;
  /** Extra payoff per discarded card (discardFor). */
  bonusPerDiscard?: number;
  /** Payoff channel for discardFor. */
  payoffKind?: 'damage' | 'heal' | 'block' | 'randomDamage';
  /** Totem id for summonTotem effects. */
  totemId?: string;
}

/** Runtime card in a run/combat deck — upgrade lives on the instance. */
export interface CardInstance {
  defId: string;
  /** 0 = display " 1", 1 = " 2", 2 = " 3". Max 2 upgrades. */
  upgrade: number;
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
  /** Cannot be played from hand (curses). */
  unplayable?: boolean;
  /** Curse card — deals damage when drawn, clogs the hand. Combat-only; never persists in the run deck. */
  curse?: boolean;
  /** After play, go to exhaust pile instead of discard. */
  exhaust?: boolean;
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
    | 'weak'
    | 'thorns'
    | 'echo'
    /** Next elemental attack vs this target deals value% more. */
    | 'stormstrike'
    /** Cannot perform attack intents. */
    | 'hex'
    /** Player: gain energy when attacked. */
    | 'waterShield'
    /** Player: healing also damages a random enemy for 50%. */
    | 'spiritWalkersGrace'
    /** Player: enemy DoTs tick twice while active. */
    | 'voidform'
    /** Player: healing also draws cards. */
    | 'healAlsoDraw'
    /** Player: Windfury always procs (100%). */
    | 'perfectWindfury'
    /** Player: enemy DoTs tick twice this turn only. */
    | 'doubleDotTicks'
    /** Player: Astral Power stacks (Boomkin). */
    | 'astralPower';
  value: number;
  duration: number;
  stacks?: boolean;
  echoFrom?: CardTypeTag;
  echoTo?: CardTypeTag;
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

/**
 * Opening specialization chosen at run start.
 * Druid: Feral combines Cat + Bear card forms; Boomkin / Tree match card forms.
 * Priest: schools match card forms.
 * Shaman: Resto / Enhance / Elemental match card forms.
 */
export type OpeningSpec =
  | 'feral'
  | 'boomkin'
  | 'tree'
  | 'holy'
  | 'shadow'
  | 'discipline'
  | 'resto'
  | 'enhance'
  | 'elemental';

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
  /** Forms/schools offered as opening specializations. */
  openingSpecs: OpeningSpec[];
}

/** Act / zone within a run. 1 = Grove, 2 = Barrens. */
export type ActId = 1 | 2;

export interface RunState {
  classId: ClassId;
  /** Form/school chosen at run start; shapes the starter deck. */
  openingSpec: OpeningSpec;
  hp: number;
  maxHp: number;
  gold: number;
  floor: number;
  /** Current act/zone (Grove → Barrens). */
  act: ActId;
  deck: CardInstance[];
  discard: CardInstance[];
  drawPile: CardInstance[];
  hand: CardInstance[];
  map: MapNode[];
  currentNodeId: string | null;
  energyMax: number;
  spellPowerBonus: number;
  victories: number;
  /** Shop rerolls since last fight; cost = 1 + this value. Resets after each combat victory. */
  shopRerollCount: number;
  /** Heal potions held (usable from the map). */
  potions: number;
  /** Cards removed at shops this run (drives escalating remove cost). */
  cardsRemoved: number;
  /** True until the run's first shop card upgrade is claimed (that upgrade is free). */
  freeUpgradeAvailable: boolean;
  /** Passive item ids collected this run (elite rewards). */
  items: string[];
}
