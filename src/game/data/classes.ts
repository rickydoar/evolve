import { REWARD_POOLS, STARTER_DECKS } from './cards';
import type { ClassDef, ClassId, TalentTree } from './types';

export const CLASSES: Record<ClassId, ClassDef> = {
  druid: {
    id: 'druid',
    name: 'Druid',
    subtitle: 'Guardian of the Grove',
    blurb: 'Bear · Cat · Boomkin · Tree',
    heroArt: 'hero-druid',
    maxHp: 80,
    startingGold: 50,
    starterDeck: STARTER_DECKS.druid,
    rewardPool: REWARD_POOLS.druid,
    talentTrees: ['feral', 'resto', 'balance'],
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
  },
};

export const CLASS_ORDER: ClassId[] = ['druid', 'priest'];

export function getClass(id: ClassId): ClassDef {
  return CLASSES[id];
}

export function talentTreesForClass(id: ClassId): TalentTree[] {
  return CLASSES[id].talentTrees;
}
