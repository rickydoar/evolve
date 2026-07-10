import Phaser from 'phaser';

/** Logical game size — layout coordinates stay at this resolution. */
export const GAME_W = 1280;
export const GAME_H = 720;

/** Cap DPR so we don't explode GPU memory on 3x devices. */
export const DPR = Math.min(window.devicePixelRatio || 1, 2);

/** Backing-store size used by the Phaser canvas. */
export const CANVAS_W = Math.round(GAME_W * DPR);
export const CANVAS_H = Math.round(GAME_H * DPR);

/**
 * Zoom the main camera so world/layout coords remain GAME_W × GAME_H
 * while the canvas renders at device pixel density.
 */
export function setupHiDpiCamera(scene: Phaser.Scene): void {
  if (DPR <= 1) return;
  scene.cameras.main.setZoom(DPR);
  scene.cameras.main.centerOn(GAME_W / 2, GAME_H / 2);
}
