import Phaser from 'phaser';
import { GAME_H, GAME_W, setupHiDpiCamera } from '../display';
import { GameRegistry } from '../GameRegistry';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  create(data: { victory?: boolean }): void {
    const run = GameRegistry.run;
    setupHiDpiCamera(this);
    const width = GAME_W;
    const height = GAME_H;

    const g = this.add.graphics();
    g.fillGradientStyle(0x0b1210, 0x0b1210, data.victory ? 0x1a3a2a : 0x2a1218, 0x0f1014, 1);
    g.fillRect(0, 0, width, height);

    this.add
      .text(
        width / 2,
        200,
        data.victory ? 'The Barrens Fall Silent' : 'Fallen in the Wilds',
        {
          fontFamily: 'Georgia, serif',
          fontSize: '42px',
          color: data.victory ? '#4ade80' : '#f87171',
        },
      )
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        280,
        data.victory
          ? 'You slew Mutanus the Devourer and ended the nightmare.'
          : `Victories: ${run?.victories ?? 0}`,
        {
          fontFamily: 'Georgia, serif',
          fontSize: '18px',
          color: '#9aa5b1',
        },
      )
      .setOrigin(0.5);

    const btn = this.add
      .text(width / 2, 400, 'Return to Title', {
        fontFamily: 'Georgia, serif',
        fontSize: '24px',
        color: '#0b1210',
        backgroundColor: '#a8e6cf',
        padding: { x: 24, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      GameRegistry.run = null;
      GameRegistry.combat = null;
      this.scene.start('Title');
    });
  }
}
