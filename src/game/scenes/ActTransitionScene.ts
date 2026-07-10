import Phaser from 'phaser';
import { advanceToBarrens } from '../data/run';
import { GAME_H, GAME_W, setupHiDpiCamera } from '../display';
import { GameRegistry } from '../GameRegistry';

/** Shown after defeating the Grove boss — bridges into Act 2. */
export class ActTransitionScene extends Phaser.Scene {
  constructor() {
    super('ActTransition');
  }

  create(): void {
    const run = GameRegistry.run;
    if (!run) {
      this.scene.start('Title');
      return;
    }

    setupHiDpiCamera(this);
    const width = GAME_W;
    const height = GAME_H;

    const g = this.add.graphics();
    g.fillGradientStyle(0x1a1208, 0x1a1208, 0x3d2a14, 0x2a1c0c, 1);
    g.fillRect(0, 0, width, height);

    if (this.textures.exists('bg-barrens')) {
      this.add
        .image(width / 2, height / 2, 'bg-barrens')
        .setDisplaySize(width, height)
        .setAlpha(0.4);
    }

    this.add
      .text(width / 2, 160, 'The Grove is Cleansed', {
        fontFamily: 'Georgia, serif',
        fontSize: '40px',
        color: '#4ade80',
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        240,
        'Beyond the forest lies a sun-scorched waste.\nThe Wailing Caverns stir — and something hungers.',
        {
          fontFamily: 'Georgia, serif',
          fontSize: '20px',
          color: '#fde68a',
          align: 'center',
          lineSpacing: 8,
        },
      )
      .setOrigin(0.5);

    this.add
      .text(width / 2, 340, 'Act 2 — The Barrens', {
        fontFamily: 'Georgia, serif',
        fontSize: '28px',
        color: '#fbbf24',
      })
      .setOrigin(0.5);

    const btn = this.add
      .text(width / 2, 440, 'Enter the Barrens', {
        fontFamily: 'Georgia, serif',
        fontSize: '24px',
        color: '#1a1208',
        backgroundColor: '#fbbf24',
        padding: { x: 24, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      advanceToBarrens(run);
      GameRegistry.pendingNodeId = null;
      GameRegistry.combat = null;
      this.scene.start('Map');
    });
  }
}
