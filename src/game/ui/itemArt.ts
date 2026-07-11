import type Phaser from 'phaser';
import { ITEMS, type ItemDef } from '../data/items';

/** Texture key for an item icon. */
export function itemArtKey(itemId: string): string {
  return `item-${itemId}`;
}

type Shape =
  | 'boots'
  | 'fang'
  | 'vial'
  | 'shield'
  | 'coin'
  | 'flask'
  | 'bracer'
  | 'feather'
  | 'heart'
  | 'orb'
  | 'paint'
  | 'eye'
  | 'wind'
  | 'beads'
  | 'lens'
  | 'pouch'
  | 'band'
  | 'claw'
  | 'totem'
  | 'mark'
  | 'wraps'
  | 'cloak'
  | 'star'
  | 'seed'
  | 'leaf'
  | 'crown'
  | 'censer'
  | 'bell'
  | 'flame'
  | 'rosary'
  | 'book'
  | 'mask'
  | 'spike'
  | 'brand'
  | 'watch'
  | 'loop'
  | 'gem';

interface ArtRecipe {
  shape: Shape;
  primary: number;
  secondary: number;
  accent: number;
  bg: number;
}

const RARITY_BG: Record<ItemDef['rarity'], number> = {
  common: 0x1e293b,
  rare: 0x1e3a5f,
  epic: 0x3b1d5e,
};

/** Hand-tuned silhouette + palette per item so each relic reads uniquely. */
const RECIPES: Record<string, ArtRecipe> = {
  travelers_boots: { shape: 'boots', primary: 0x92400e, secondary: 0xd97706, accent: 0xfde68a, bg: 0x1e293b },
  sharpened_fang: { shape: 'fang', primary: 0xe2e8f0, secondary: 0x94a3b8, accent: 0xf87171, bg: 0x1e293b },
  soothing_balm: { shape: 'vial', primary: 0x86efac, secondary: 0x22c55e, accent: 0xbbf7d0, bg: 0x1e293b },
  iron_buckler: { shape: 'shield', primary: 0x94a3b8, secondary: 0x64748b, accent: 0xe2e8f0, bg: 0x1e293b },
  lucky_coin: { shape: 'coin', primary: 0xfbbf24, secondary: 0xd97706, accent: 0xfef3c7, bg: 0x1e293b },
  spare_flask: { shape: 'flask', primary: 0xc084fc, secondary: 0x7c3aed, accent: 0xe9d5ff, bg: 0x1e293b },
  heavy_bracer: { shape: 'bracer', primary: 0x78716c, secondary: 0xa8a29e, accent: 0xfbbf24, bg: 0x1e293b },
  crow_feather: { shape: 'feather', primary: 0x334155, secondary: 0x64748b, accent: 0xf8fafc, bg: 0x1e293b },
  blood_pact: { shape: 'heart', primary: 0xdc2626, secondary: 0x7f1d1d, accent: 0xfca5a5, bg: 0x1e293b },
  ember_charm: { shape: 'orb', primary: 0xf97316, secondary: 0xea580c, accent: 0xfde68a, bg: 0x1e293b },
  war_paint: { shape: 'paint', primary: 0xef4444, secondary: 0x1e293b, accent: 0xfbbf24, bg: 0x1e293b },
  restless_mind: { shape: 'eye', primary: 0xa78bfa, secondary: 0x6366f1, accent: 0xe0e7ff, bg: 0x1e293b },
  second_wind: { shape: 'wind', primary: 0x7dd3fc, secondary: 0x38bdf8, accent: 0xe0f2fe, bg: 0x1e293b },
  adrenaline_vial: { shape: 'vial', primary: 0xfbbf24, secondary: 0xf59e0b, accent: 0xfef3c7, bg: 0x1e293b },
  monk_beads: { shape: 'beads', primary: 0xd6d3d1, secondary: 0xa8a29e, accent: 0xfde68a, bg: 0x1e293b },
  venom_vial: { shape: 'vial', primary: 0xa3e635, secondary: 0x65a30d, accent: 0xd9f99d, bg: 0x1e293b },
  crystal_lens: { shape: 'lens', primary: 0x67e8f9, secondary: 0x22d3ee, accent: 0xecfeff, bg: 0x1e293b },
  scavenger_pouch: { shape: 'pouch', primary: 0xb45309, secondary: 0x92400e, accent: 0xfde68a, bg: 0x1e293b },
  tempered_heart: { shape: 'heart', primary: 0xf87171, secondary: 0x94a3b8, accent: 0xe2e8f0, bg: 0x1e293b },
  focus_band: { shape: 'band', primary: 0x6366f1, secondary: 0x4338ca, accent: 0xc7d2fe, bg: 0x1e293b },

  bloodfang_charm: { shape: 'fang', primary: 0xf87171, secondary: 0xb91c1c, accent: 0xfef2f2, bg: 0x3f1d1d },
  ironpelt_totem: { shape: 'totem', primary: 0xa8a29e, secondary: 0x57534e, accent: 0xfbbf24, bg: 0x3f1d1d },
  frenzy_claw: { shape: 'claw', primary: 0xfbbf24, secondary: 0xea580c, accent: 0xfef3c7, bg: 0x3f1d1d },
  alpha_mark: { shape: 'mark', primary: 0xf97316, secondary: 0x1e293b, accent: 0xfde68a, bg: 0x3f1d1d },
  thick_hide_wraps: { shape: 'wraps', primary: 0x92400e, secondary: 0x78350f, accent: 0xd6d3d1, bg: 0x3f1d1d },

  celestial_orb: { shape: 'orb', primary: 0xa78bfa, secondary: 0x7c3aed, accent: 0xfde68a, bg: 0x1e1b4b },
  thornwoven_cloak: { shape: 'cloak', primary: 0x166534, secondary: 0x14532d, accent: 0x86efac, bg: 0x1e1b4b },
  twin_star: { shape: 'star', primary: 0xfde68a, secondary: 0xfbbf24, accent: 0xc4b5fd, bg: 0x1e1b4b },
  hurricane_eye: { shape: 'eye', primary: 0x38bdf8, secondary: 0x0ea5e9, accent: 0xe0f2fe, bg: 0x1e1b4b },
  astral_battery: { shape: 'gem', primary: 0xc4b5fd, secondary: 0x8b5cf6, accent: 0xf5f3ff, bg: 0x1e1b4b },

  verdant_lash: { shape: 'leaf', primary: 0x4ade80, secondary: 0x16a34a, accent: 0xbbf7d0, bg: 0x14532d },
  lifebloom_crown: { shape: 'crown', primary: 0xfbbf24, secondary: 0x22c55e, accent: 0xfef9c3, bg: 0x14532d },
  grove_battery: { shape: 'seed', primary: 0x86efac, secondary: 0x15803d, accent: 0xd9f99d, bg: 0x14532d },
  barkbreaker_seed: { shape: 'seed', primary: 0xa3e635, secondary: 0x78350f, accent: 0xfde68a, bg: 0x14532d },
  swiftroot_charm: { shape: 'leaf', primary: 0x34d399, secondary: 0x059669, accent: 0xecfdf5, bg: 0x14532d },

  radiant_censer: { shape: 'censer', primary: 0xfde68a, secondary: 0xd97706, accent: 0xfff7ed, bg: 0x422006 },
  serenity_bell: { shape: 'bell', primary: 0xfef3c7, secondary: 0xfbbf24, accent: 0xffffff, bg: 0x422006 },
  sacred_flame: { shape: 'flame', primary: 0xfbbf24, secondary: 0xf97316, accent: 0xfef9c3, bg: 0x422006 },
  martyr_rosary: { shape: 'rosary', primary: 0xf87171, secondary: 0xfde68a, accent: 0xffffff, bg: 0x422006 },
  hymn_book: { shape: 'book', primary: 0xfef3c7, secondary: 0xb45309, accent: 0xfbbf24, bg: 0x422006 },

  void_leech: { shape: 'orb', primary: 0x7c3aed, secondary: 0x4c1d95, accent: 0xe9d5ff, bg: 0x2e1065 },
  pain_amplifier: { shape: 'spike', primary: 0xc084fc, secondary: 0x6b21a8, accent: 0xf0abfc, bg: 0x2e1065 },
  scream_mask: { shape: 'mask', primary: 0xa78bfa, secondary: 0x1e1b4b, accent: 0xe0e7ff, bg: 0x2e1065 },
  shadow_absorb: { shape: 'cloak', primary: 0x4c1d95, secondary: 0x1e1b4b, accent: 0xc4b5fd, bg: 0x2e1065 },
  death_wish: { shape: 'mark', primary: 0xe2e8f0, secondary: 0x7c3aed, accent: 0xf87171, bg: 0x2e1065 },

  shield_spike: { shape: 'spike', primary: 0x7dd3fc, secondary: 0x94a3b8, accent: 0xe0f2fe, bg: 0x0c4a6e },
  penitent_brand: { shape: 'brand', primary: 0xfbbf24, secondary: 0xdc2626, accent: 0xfef3c7, bg: 0x0c4a6e },
  borrowed_timepiece: { shape: 'watch', primary: 0xfde68a, secondary: 0x78716c, accent: 0x7dd3fc, bg: 0x0c4a6e },
  smite_echo: { shape: 'flame', primary: 0xfef08a, secondary: 0xfbbf24, accent: 0xffffff, bg: 0x0c4a6e },
  radiance_loop: { shape: 'loop', primary: 0xfde68a, secondary: 0x38bdf8, accent: 0xffffff, bg: 0x0c4a6e },
};

function recipeFor(def: ItemDef): ArtRecipe {
  const known = RECIPES[def.id];
  if (known) return known;
  return {
    shape: 'gem',
    primary: 0x94a3b8,
    secondary: 0x64748b,
    accent: 0xe2e8f0,
    bg: RARITY_BG[def.rarity],
  };
}

/**
 * Generate a unique 96×96 relic icon texture for every item.
 * Call once from BootScene.create().
 */
export function generateAllItemArt(scene: Phaser.Scene): void {
  for (const def of Object.values(ITEMS)) {
    const key = itemArtKey(def.id);
    if (scene.textures.exists(key)) continue;
    drawItemIcon(scene, key, recipeFor(def));
  }
}

function drawItemIcon(scene: Phaser.Scene, key: string, r: ArtRecipe): void {
  const g = scene.make.graphics({ x: 0, y: 0 });
  const S = 96;
  const cx = S / 2;
  const cy = S / 2;

  // Plate
  g.fillStyle(r.bg, 1);
  g.fillRoundedRect(4, 4, S - 8, S - 8, 14);
  g.lineStyle(3, r.accent, 0.55);
  g.strokeRoundedRect(4, 4, S - 8, S - 8, 14);

  switch (r.shape) {
    case 'boots':
      g.fillStyle(r.primary, 1);
      g.fillRoundedRect(28, 36, 18, 36, 4);
      g.fillRoundedRect(50, 36, 18, 36, 4);
      g.fillStyle(r.secondary, 1);
      g.fillRoundedRect(26, 64, 22, 10, 3);
      g.fillRoundedRect(48, 64, 22, 10, 3);
      g.fillStyle(r.accent, 1);
      g.fillCircle(37, 44, 3);
      g.fillCircle(59, 44, 3);
      break;
    case 'fang':
      g.fillStyle(r.primary, 1);
      g.fillTriangle(cx, 22, 30, 72, 66, 72);
      g.fillStyle(r.secondary, 1);
      g.fillTriangle(cx, 34, 38, 68, 58, 68);
      g.fillStyle(r.accent, 1);
      g.fillCircle(cx - 6, 52, 3);
      break;
    case 'vial':
      g.fillStyle(r.secondary, 1);
      g.fillRoundedRect(cx - 8, 18, 16, 12, 3);
      g.fillStyle(r.primary, 1);
      g.fillRoundedRect(cx - 16, 30, 32, 44, 8);
      g.fillStyle(r.accent, 0.85);
      g.fillEllipse(cx - 4, 44, 10, 16);
      break;
    case 'flask':
      g.fillStyle(r.secondary, 1);
      g.fillRoundedRect(cx - 6, 16, 12, 14, 2);
      g.fillStyle(r.primary, 1);
      g.fillTriangle(cx - 18, 30, cx + 18, 30, cx, 78);
      g.fillStyle(r.accent, 0.7);
      g.fillCircle(cx - 4, 48, 6);
      break;
    case 'shield':
      g.fillStyle(r.primary, 1);
      g.fillRoundedRect(cx - 22, 22, 44, 48, 10);
      g.fillTriangle(cx - 22, 60, cx + 22, 60, cx, 78);
      g.fillStyle(r.accent, 1);
      g.fillCircle(cx, 46, 10);
      g.fillStyle(r.secondary, 1);
      g.fillCircle(cx, 46, 5);
      break;
    case 'coin':
      g.fillStyle(r.secondary, 1);
      g.fillCircle(cx, cy, 28);
      g.fillStyle(r.primary, 1);
      g.fillCircle(cx, cy, 22);
      g.fillStyle(r.accent, 1);
      g.fillCircle(cx - 6, cy - 6, 5);
      break;
    case 'bracer':
      g.fillStyle(r.primary, 1);
      g.fillRoundedRect(24, 30, 48, 36, 8);
      g.fillStyle(r.secondary, 1);
      g.fillRect(28, 38, 40, 6);
      g.fillRect(28, 52, 40, 6);
      g.fillStyle(r.accent, 1);
      g.fillCircle(cx, cy, 6);
      break;
    case 'feather':
      g.fillStyle(r.primary, 1);
      g.fillEllipse(cx + 4, cy, 18, 48);
      g.fillStyle(r.secondary, 1);
      g.fillTriangle(cx - 4, 20, cx + 10, 28, cx - 2, 70);
      g.lineStyle(2, r.accent, 1);
      g.lineBetween(cx + 2, 24, cx + 2, 72);
      break;
    case 'heart':
      g.fillStyle(r.primary, 1);
      g.fillCircle(cx - 12, cy - 8, 14);
      g.fillCircle(cx + 12, cy - 8, 14);
      g.fillTriangle(cx - 24, cy - 2, cx + 24, cy - 2, cx, 74);
      g.fillStyle(r.accent, 0.7);
      g.fillCircle(cx - 14, cy - 12, 4);
      break;
    case 'orb':
      g.fillStyle(r.secondary, 0.45);
      g.fillCircle(cx, cy, 34);
      g.fillStyle(r.primary, 1);
      g.fillCircle(cx, cy, 24);
      g.fillStyle(r.accent, 1);
      g.fillCircle(cx - 8, cy - 8, 7);
      break;
    case 'paint':
      g.fillStyle(r.primary, 1);
      g.fillCircle(cx - 10, cy - 6, 14);
      g.fillCircle(cx + 12, cy + 4, 12);
      g.fillStyle(r.accent, 1);
      g.fillCircle(cx, cy + 14, 8);
      g.fillStyle(r.secondary, 1);
      g.fillRoundedRect(cx - 4, 18, 8, 20, 2);
      break;
    case 'eye':
      g.fillStyle(r.primary, 1);
      g.fillEllipse(cx, cy, 40, 24);
      g.fillStyle(r.secondary, 1);
      g.fillCircle(cx, cy, 12);
      g.fillStyle(r.accent, 1);
      g.fillCircle(cx, cy, 5);
      break;
    case 'wind':
      g.lineStyle(5, r.primary, 1);
      g.strokeEllipse(cx, cy - 8, 50, 18);
      g.lineStyle(4, r.secondary, 1);
      g.strokeEllipse(cx, cy + 8, 42, 14);
      g.fillStyle(r.accent, 1);
      g.fillCircle(cx + 18, cy - 8, 4);
      break;
    case 'beads':
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        g.fillStyle(i % 2 ? r.primary : r.secondary, 1);
        g.fillCircle(cx + Math.cos(a) * 22, cy + Math.sin(a) * 22, 7);
      }
      g.fillStyle(r.accent, 1);
      g.fillCircle(cx, cy, 6);
      break;
    case 'lens':
      g.fillStyle(r.secondary, 1);
      g.fillCircle(cx, cy, 28);
      g.fillStyle(r.primary, 0.85);
      g.fillCircle(cx, cy, 20);
      g.fillStyle(r.accent, 1);
      g.fillCircle(cx - 6, cy - 6, 6);
      break;
    case 'pouch':
      g.fillStyle(r.primary, 1);
      g.fillRoundedRect(26, 34, 44, 38, 10);
      g.fillStyle(r.secondary, 1);
      g.fillRect(34, 24, 28, 12);
      g.fillStyle(r.accent, 1);
      g.fillCircle(cx, 52, 7);
      break;
    case 'band':
      g.fillStyle(r.primary, 1);
      g.fillRoundedRect(20, 38, 56, 20, 10);
      g.fillStyle(r.accent, 1);
      g.fillCircle(cx, cy, 8);
      g.fillStyle(r.secondary, 1);
      g.fillCircle(cx, cy, 3);
      break;
    case 'claw':
      g.fillStyle(r.primary, 1);
      g.fillTriangle(30, 70, 38, 28, 46, 70);
      g.fillTriangle(44, 72, 52, 22, 60, 72);
      g.fillTriangle(56, 70, 64, 30, 72, 70);
      g.fillStyle(r.accent, 1);
      g.fillCircle(52, 26, 3);
      break;
    case 'totem':
      g.fillStyle(r.primary, 1);
      g.fillRoundedRect(cx - 12, 24, 24, 52, 4);
      g.fillStyle(r.secondary, 1);
      g.fillTriangle(cx - 20, 28, cx + 20, 28, cx, 12);
      g.fillStyle(r.accent, 1);
      g.fillCircle(cx, 44, 5);
      g.fillCircle(cx, 58, 4);
      break;
    case 'mark':
      g.fillStyle(r.primary, 1);
      g.fillCircle(cx, cy, 26);
      g.fillStyle(r.secondary, 1);
      g.fillTriangle(cx, 28, 34, 64, 62, 64);
      g.fillStyle(r.accent, 1);
      g.fillCircle(cx, cy + 4, 5);
      break;
    case 'wraps':
      g.fillStyle(r.primary, 1);
      g.fillRoundedRect(22, 28, 52, 40, 8);
      g.fillStyle(r.secondary, 1);
      g.fillRect(26, 36, 44, 8);
      g.fillRect(26, 52, 44, 8);
      g.fillStyle(r.accent, 1);
      g.fillRect(40, 28, 6, 40);
      break;
    case 'cloak':
      g.fillStyle(r.primary, 1);
      g.fillTriangle(cx, 20, 22, 78, 74, 78);
      g.fillStyle(r.secondary, 1);
      g.fillEllipse(cx, 30, 28, 14);
      g.fillStyle(r.accent, 1);
      g.fillCircle(cx, 48, 4);
      g.fillCircle(cx - 10, 58, 3);
      g.fillCircle(cx + 10, 58, 3);
      break;
    case 'star':
      drawStar(g, cx - 10, cy - 4, 14, r.primary, r.accent);
      drawStar(g, cx + 14, cy + 10, 12, r.secondary, r.accent);
      break;
    case 'seed':
      g.fillStyle(r.primary, 1);
      g.fillEllipse(cx, cy + 4, 22, 30);
      g.fillStyle(r.secondary, 1);
      g.fillEllipse(cx, cy + 10, 12, 16);
      g.fillStyle(r.accent, 1);
      g.fillTriangle(cx, 18, cx - 6, 32, cx + 6, 32);
      break;
    case 'leaf':
      g.fillStyle(r.primary, 1);
      g.fillEllipse(cx, cy, 20, 36);
      g.fillStyle(r.secondary, 1);
      g.fillTriangle(cx, 18, cx - 4, 40, cx + 4, 40);
      g.lineStyle(2, r.accent, 1);
      g.lineBetween(cx, 24, cx, 70);
      break;
    case 'crown':
      g.fillStyle(r.primary, 1);
      g.fillTriangle(28, 58, 36, 28, 44, 58);
      g.fillTriangle(42, 58, 48, 22, 54, 58);
      g.fillTriangle(52, 58, 60, 28, 68, 58);
      g.fillStyle(r.secondary, 1);
      g.fillRoundedRect(26, 54, 44, 14, 4);
      g.fillStyle(r.accent, 1);
      g.fillCircle(48, 24, 4);
      break;
    case 'censer':
      g.fillStyle(r.secondary, 1);
      g.fillRoundedRect(cx - 14, 40, 28, 28, 6);
      g.fillStyle(r.primary, 1);
      g.fillCircle(cx, 36, 12);
      g.lineStyle(3, r.accent, 1);
      g.lineBetween(cx - 10, 22, cx - 10, 36);
      g.lineBetween(cx + 10, 22, cx + 10, 36);
      break;
    case 'bell':
      g.fillStyle(r.primary, 1);
      g.fillEllipse(cx, cy + 4, 28, 34);
      g.fillStyle(r.secondary, 1);
      g.fillRoundedRect(cx - 6, 18, 12, 12, 3);
      g.fillStyle(r.accent, 1);
      g.fillCircle(cx, 68, 5);
      break;
    case 'flame':
      g.fillStyle(r.secondary, 1);
      g.fillTriangle(cx, 18, 30, 68, 66, 68);
      g.fillStyle(r.primary, 1);
      g.fillTriangle(cx, 28, 36, 66, 60, 66);
      g.fillStyle(r.accent, 1);
      g.fillTriangle(cx, 40, 42, 64, 54, 64);
      break;
    case 'rosary':
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        g.fillStyle(i === 0 ? r.accent : r.primary, 1);
        g.fillCircle(cx + Math.cos(a) * 24, cy + Math.sin(a) * 24, i === 0 ? 7 : 5);
      }
      g.fillStyle(r.secondary, 1);
      g.fillCircle(cx, cy, 6);
      break;
    case 'book':
      g.fillStyle(r.secondary, 1);
      g.fillRoundedRect(28, 22, 40, 52, 4);
      g.fillStyle(r.primary, 1);
      g.fillRoundedRect(32, 26, 32, 44, 3);
      g.fillStyle(r.accent, 1);
      g.fillRect(36, 36, 24, 3);
      g.fillRect(36, 44, 20, 3);
      g.fillRect(36, 52, 24, 3);
      break;
    case 'mask':
      g.fillStyle(r.primary, 1);
      g.fillEllipse(cx, cy, 34, 28);
      g.fillStyle(r.secondary, 1);
      g.fillEllipse(cx - 10, cy - 2, 8, 10);
      g.fillEllipse(cx + 10, cy - 2, 8, 10);
      g.fillStyle(r.accent, 1);
      g.fillTriangle(cx - 6, cy + 10, cx + 6, cy + 10, cx, cy + 18);
      break;
    case 'spike':
      g.fillStyle(r.primary, 1);
      g.fillTriangle(cx, 16, 34, 70, 62, 70);
      g.fillStyle(r.secondary, 1);
      g.fillRoundedRect(cx - 16, 58, 32, 16, 4);
      g.fillStyle(r.accent, 1);
      g.fillCircle(cx, 40, 4);
      break;
    case 'brand':
      g.fillStyle(r.primary, 1);
      g.fillRoundedRect(30, 24, 36, 48, 6);
      g.fillStyle(r.secondary, 1);
      g.fillTriangle(cx, 32, 38, 56, 58, 56);
      g.fillStyle(r.accent, 1);
      g.fillCircle(cx, 44, 4);
      break;
    case 'watch':
      g.fillStyle(r.secondary, 1);
      g.fillCircle(cx, cy, 28);
      g.fillStyle(r.primary, 1);
      g.fillCircle(cx, cy, 22);
      g.fillStyle(r.accent, 1);
      g.fillCircle(cx, cy, 3);
      g.lineStyle(3, r.secondary, 1);
      g.lineBetween(cx, cy, cx, cy - 12);
      g.lineBetween(cx, cy, cx + 10, cy + 4);
      break;
    case 'loop':
      g.lineStyle(8, r.primary, 1);
      g.strokeCircle(cx, cy, 24);
      g.lineStyle(4, r.secondary, 1);
      g.strokeCircle(cx, cy, 16);
      g.fillStyle(r.accent, 1);
      g.fillCircle(cx, cy - 24, 5);
      break;
    case 'gem':
    default:
      g.fillStyle(r.primary, 1);
      g.fillTriangle(cx, 18, 28, 48, 68, 48);
      g.fillTriangle(28, 48, 68, 48, cx, 78);
      g.fillStyle(r.accent, 0.8);
      g.fillTriangle(cx, 26, 38, 46, cx, 46);
      break;
  }

  g.generateTexture(key, S, S);
  g.destroy();
}

function drawStar(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  r: number,
  fill: number,
  tip: number,
): void {
  g.fillStyle(fill, 1);
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const a2 = a + Math.PI / 5;
    const x1 = x + Math.cos(a) * r;
    const y1 = y + Math.sin(a) * r;
    const x2 = x + Math.cos(a2) * (r * 0.38);
    const y2 = y + Math.sin(a2) * (r * 0.38);
    const a3 = a - Math.PI / 5;
    const x3 = x + Math.cos(a3) * (r * 0.38);
    const y3 = y + Math.sin(a3) * (r * 0.38);
    g.fillTriangle(x1, y1, x2, y2, x3, y3);
  }
  g.fillStyle(tip, 1);
  g.fillCircle(x, y, Math.max(2, r * 0.22));
}
