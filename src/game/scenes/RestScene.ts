import Phaser from 'phaser';
import { GAME_H, GAME_W, setupHiDpiCamera } from '../display';
import { GameRegistry } from '../GameRegistry';

export class RestScene extends Phaser.Scene {
  constructor() {
    super('Rest');
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
    if (run.act === 2) {
      g.fillGradientStyle(0x1a1208, 0x1a1208, 0x3d2a14, 0x2a1c0c, 1);
    } else {
      g.fillGradientStyle(0x0b1210, 0x0b1210, 0x1a3328, 0x102018, 1);
    }
    g.fillRect(0, 0, width, height);

    const restTitle = run.act === 2 ? 'Oasis Camp' : 'Sacred Grove';
    const restBlurb =
      run.act === 2
        ? 'Rest in the shade of a lonely oasis.'
        : 'Rest beneath the ancient boughs.';
    this.add
      .text(width / 2, 120, restTitle, {
        fontFamily: 'Georgia, serif',
        fontSize: '40px',
        color: run.act === 2 ? '#fde68a' : '#a8e6cf',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 180, restBlurb, {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: '#9aa5b1',
      })
      .setOrigin(0.5);

    const healAmt = Math.floor(run.maxHp * 0.3);
    const healBtn = this.add
      .text(width / 2, 300, `Rest — Heal ${healAmt} HP`, {
        fontFamily: 'Georgia, serif',
        fontSize: '24px',
        color: '#0b1210',
        backgroundColor: '#4ade80',
        padding: { x: 24, y: 14 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    healBtn.on('pointerdown', () => {
      run.hp = Math.min(run.maxHp, run.hp + healAmt);
      this.finish();
    });

    if (run.talentPoints > 0 || Object.keys(run.talents).length > 0) {
      const talentLabel =
        run.talentPoints > 0
          ? `Talents (${run.talentPoints} unspent)`
          : 'View Talents';
      const talentBtn = this.add
        .text(width / 2, 390, talentLabel, {
          fontFamily: 'Georgia, serif',
          fontSize: '20px',
          color: '#0b1210',
          backgroundColor: '#fbbf24',
          padding: { x: 20, y: 12 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      talentBtn.on('pointerdown', () => {
        this.scene.start('Talent', { returnTo: 'Rest' });
      });
    }

    const leave = this.add
      .text(width / 2, 480, 'Leave without resting', {
        fontFamily: 'Georgia, serif',
        fontSize: '16px',
        color: '#94a3b8',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    leave.on('pointerdown', () => this.finish());
  }

  private finish(): void {
    const run = GameRegistry.run!;
    const node = run.map.find((n) => n.id === GameRegistry.pendingNodeId);
    if (node) node.cleared = true;
    this.scene.start('Map');
  }
}
