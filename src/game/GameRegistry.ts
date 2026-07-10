import type { RunState } from './data/types';
import type { CombatState } from './systems/CombatSystem';

/** Shared mutable run between Phaser scenes */
export const GameRegistry = {
  run: null as RunState | null,
  combat: null as CombatState | null,
  pendingNodeId: null as string | null,
};
