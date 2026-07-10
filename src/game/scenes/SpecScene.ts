import Phaser from 'phaser';
import { openingSpecsForClass, getClass } from '../data/classes';
import { CARDS, FORM_COLORS, FORM_LABELS, SPEC_BLURBS, buildStarterDeck } from '../data/cards';
import { createRun } from '../data/run';
import type { ClassId, OpeningSpec } from '../data/types';
import { GAME_H, GAME_W, setupHiDpiCamera } from '../display';
import { GameRegistry } from '../GameRegistry';

/** Short opening form/school pick after class selection. */
export class SpecScene extends Phaser.Scene {
  constructor() {
    super('Spec');
  }

  create(data: { classId: ClassId }): void {
    const classId = data?.classId;
    if (!classId) {
      this.scene.start('Title');
      return;
    }

    setupHiDpiCamera(this);
    const width = GAME_W;
    const height = GAME_H;
    const cls = getClass(classId);
    const specs = openingSpecsForClass(classId);
    const isPriest = classId === 'priest';

    const g = this.add.graphics();
    g.fillGradientStyle(0x0b1210, 0x0b1210, 0x1a2e24, 0x102018, 1);
    g.fillRect(0, 0, width, height);

    this.add
      .text(width / 2, 56, cls.name, {
        fontFamily: 'Georgia, serif',
        fontSize: '28px',
        color: isPriest ? '#f0c75e' : '#4ade80',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 96, isPriest ? 'Choose your opening school' : 'Choose your opening specialization', {
        fontFamily: 'Georgia, serif',
        fontSize: '32px',
        color: '#e8f5e9',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 136, 'Swaps 4–5 starter cards into your identity. Specialization starts now.', {
        fontFamily: 'Georgia, serif',
        fontSize: '15px',
        color: '#9aa5b1',
      })
      .setOrigin(0.5);

    const cardW = specs.length >= 4 ? 200 : 240;
    const gap = 20;
    const totalW = specs.length * cardW + (specs.length - 1) * gap;
    const startX = (width - totalW) / 2;
    const y = 180;

    specs.forEach((spec, i) => {
      this.drawSpecCard(classId, spec, startX + i * (cardW + gap), y, cardW);
    });

    const back = this.add
      .text(width / 2, height - 40, '← Back', {
        fontFamily: 'Georgia, serif',
        fontSize: '16px',
        color: '#94a3b8',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('Title'));
  }

  private drawSpecCard(
    classId: ClassId,
    spec: OpeningSpec,
    x: number,
    y: number,
    w: number,
  ): void {
    const h = 380;
    const accent = FORM_COLORS[spec] ?? 0x4ade80;
    const accentHex = `#${accent.toString(16).padStart(6, '0')}`;
    const deck = buildStarterDeck(classId, spec);
    const packageCards = deck.slice(-5);

    const g = this.add.graphics();
    g.fillStyle(0x0e1612, 0.92);
    g.fillRoundedRect(x, y, w, h, 12);
    g.lineStyle(2, accent, 0.75);
    g.strokeRoundedRect(x, y, w, h, 12);

    g.fillStyle(accent, 0.14);
    g.fillRect(x + 2, y + 2, w - 4, 44);

    this.add
      .text(x + w / 2, y + 24, FORM_LABELS[spec] ?? spec, {
        fontFamily: 'Georgia, serif',
        fontSize: '22px',
        color: accentHex,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(x + w / 2, y + 68, SPEC_BLURBS[spec] ?? '', {
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        color: '#c8d6cc',
        align: 'center',
        wordWrap: { width: w - 24 },
      })
      .setOrigin(0.5, 0);

    this.add
      .text(x + w / 2, y + 130, 'Opening package', {
        fontFamily: 'Georgia, serif',
        fontSize: '12px',
        color: '#7a8a80',
      })
      .setOrigin(0.5);

    packageCards.forEach((id, i) => {
      const name = CARDS[id]?.name ?? id;
      this.add
        .text(x + w / 2, y + 154 + i * 22, `· ${name}`, {
          fontFamily: 'Georgia, serif',
          fontSize: '13px',
          color: '#e8f5e9',
        })
        .setOrigin(0.5);
    });

    this.add
      .text(x + w / 2, y + 280, `${deck.length} cards`, {
        fontFamily: 'Georgia, serif',
        fontSize: '12px',
        color: '#7a8a80',
      })
      .setOrigin(0.5);

    const btn = this.add
      .text(x + w / 2, y + 330, 'Begin', {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: '#0b1210',
        backgroundColor: accentHex,
        padding: { x: 16, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setAlpha(0.85));
    btn.on('pointerout', () => btn.setAlpha(1));
    btn.on('pointerdown', () => {
      GameRegistry.run = createRun(classId, spec);
      GameRegistry.combat = null;
      GameRegistry.pendingNodeId = null;
      this.scene.start('Map');
    });
  }
}
