import { REWARD_POOLS, STARTER_DECKS } from './cards';
import type { ClassDef, ClassId, OpeningSpec, TalentTree } from './types';

export const CLASSES: Record<ClassId, ClassDef> = {
  druid: {
    id: 'druid',
    name: 'Druid',
    subtitle: 'Guardian of the Grove',
    blurb: 'Feral · Boomkin · Tree',
    heroArt: 'hero-druid',
    maxHp: 80,
    startingGold: 50,
    starterDeck: STARTER_DECKS.druid,
    rewardPool: REWARD_POOLS.druid,
    talentTrees: ['feral', 'resto', 'balance'],
    openingSpecs: ['feral', 'boomkin', 'tree'],
  },
  priest: {
    id: 'priest',
    name: 'Priest',
    subtitle: 'Light and Shadow',
    blurb: 'Holy · Shadow · Discipline',
    heroArt: 'hero-priest',
    maxHp: 75,
    startingGold: 50,
    starterDeck: STARTER_DECKS.priest,
    rewardPool: REWARD_POOLS.priest,
    talentTrees: ['holy', 'shadow', 'discipline'],
    openingSpecs: ['holy', 'shadow', 'discipline'],
  },
  shaman: {
    id: 'shaman',
    name: 'Shaman',
    subtitle: 'Master of the Elements',
    blurb: 'Resto · Enhance · Elemental',
    heroArt: 'hero-shaman',
    maxHp: 70,
    startingGold: 50,
    starterDeck: STARTER_DECKS.shaman,
    rewardPool: REWARD_POOLS.shaman,
    talentTrees: ['restoration', 'enhancement', 'elemental'],
    openingSpecs: ['resto', 'enhance', 'elemental'],
  },
};

export const CLASS_ORDER: ClassId[] = ['druid', 'priest', 'shaman'];

export function getClass(id: ClassId): ClassDef {
  return CLASSES[id];
}

export function talentTreesForClass(id: ClassId): TalentTree[] {
  return CLASSES[id].talentTrees;
}

export function openingSpecsForClass(id: ClassId): OpeningSpec[] {
  return CLASSES[id].openingSpecs;
}
