import Phaser from 'phaser';
import { createRun } from '../data/run';
import { GAME_H, GAME_W, setupHiDpiCamera } from '../display';
import { GameRegistry } from '../GameRegistry';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    setupHiDpiCamera(this);
    const width = GAME_W;
    const height = GAME_H;

    if (this.textures.exists('bg-forest')) {
      this.add
        .image(width / 2, height / 2, 'bg-forest')
        .setDisplaySize(width, height)
        .setAlpha(0.45);
    } else {
      const g = this.add.graphics();
      g.fillGradientStyle(0x0b1210, 0x0b1210, 0x1a3a2a, 0x0f2418, 1);
      g.fillRect(0, 0, width, height);
    }

    this.add
      .text(width / 2, 140, 'EVOLVE', {
        fontFamily: 'Georgia, "Palatino Linotype", serif',
        fontSize: '84px',
        color: '#e8f5e9',
        stroke: '#1b4332',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 220, 'A Druid Roguelite', {
        fontFamily: 'Georgia, serif',
        fontSize: '24px',
        color: '#a8e6cf',
      })
      .setOrigin(0.5);

    if (this.textures.exists('hero-druid')) {
      this.add
        .image(width / 2, 380, 'hero-druid')
        .setDisplaySize(220, 220)
        .setAlpha(0.95);
    }

    this.add
      .text(width / 2, 520, 'Choose your path through the corrupted grove.\nBear · Cat · Boomkin · Tree', {
        fontFamily: 'Georgia, serif',
        fontSize: '16px',
        color: '#9aa5b1',
        align: 'center',
        lineSpacing: 6,
      })
      .setOrigin(0.5);

    const btn = this.add
      .text(width / 2, 600, '▶  Begin as Druid', {
        fontFamily: 'Georgia, serif',
        fontSize: '28px',
        color: '#0b1210',
        backgroundColor: '#4ade80',
        padding: { x: 28, y: 14 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#86efac' }));
    btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#4ade80' }));
    btn.on('pointerdown', () => {
      GameRegistry.run = createRun();
      GameRegistry.combat = null;
      GameRegistry.pendingNodeId = null;
      this.scene.start('Map');
    });
  }
}
