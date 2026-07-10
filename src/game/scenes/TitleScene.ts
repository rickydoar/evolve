import Phaser from 'phaser';
import { CLASS_ORDER, getClass } from '../data/classes';
import type { ClassId } from '../data/types';
import { GAME_H, GAME_W, setupHiDpiCamera } from '../display';

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
      .text(width / 2, 72, 'EVOLVE', {
        fontFamily: 'Georgia, "Palatino Linotype", serif',
        fontSize: '72px',
        color: '#e8f5e9',
        stroke: '#1b4332',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 140, 'A Class Roguelite', {
        fontFamily: 'Georgia, serif',
        fontSize: '22px',
        color: '#a8e6cf',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 178, 'Choose your champion', {
        fontFamily: 'Georgia, serif',
        fontSize: '16px',
        color: '#9aa5b1',
      })
      .setOrigin(0.5);

    const cardW = 340;
    const gap = 48;
    const totalW = CLASS_ORDER.length * cardW + (CLASS_ORDER.length - 1) * gap;
    const startX = (width - totalW) / 2;

    CLASS_ORDER.forEach((classId, i) => {
      this.drawClassCard(classId, startX + i * (cardW + gap), 210, cardW);
    });
  }

  private drawClassCard(classId: ClassId, x: number, y: number, w: number): void {
    const cls = getClass(classId);
    const h = 420;
    const accent = classId === 'priest' ? 0xf0c75e : 0x4ade80;
    const accentHex = `#${accent.toString(16).padStart(6, '0')}`;

    const g = this.add.graphics();
    g.fillStyle(0x0e1612, 0.92);
    g.fillRoundedRect(x, y, w, h, 12);
    g.lineStyle(2, accent, 0.7);
    g.strokeRoundedRect(x, y, w, h, 12);

    g.fillStyle(accent, 0.12);
    g.fillRect(x + 2, y + 2, w - 4, 48);

    this.add
      .text(x + w / 2, y + 26, cls.name, {
        fontFamily: 'Georgia, serif',
        fontSize: '26px',
        color: accentHex,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    if (this.textures.exists(cls.heroArt)) {
      this.add
        .image(x + w / 2, y + 170, cls.heroArt)
        .setDisplaySize(180, 180)
        .setAlpha(0.95);
    } else {
      this.add.circle(x + w / 2, y + 170, 70, accent, 0.35);
    }

    this.add
      .text(x + w / 2, y + 280, cls.subtitle, {
        fontFamily: 'Georgia, serif',
        fontSize: '15px',
        color: '#c8d6cc',
      })
      .setOrigin(0.5);

    this.add
      .text(x + w / 2, y + 308, cls.blurb, {
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        color: '#7a8a80',
      })
      .setOrigin(0.5);

    const btnColor = classId === 'priest' ? '#f0c75e' : '#4ade80';
    const btnHover = classId === 'priest' ? '#f5d98a' : '#86efac';
    const btn = this.add
      .text(x + w / 2, y + 370, classId === 'priest' ? 'Choose school →' : 'Choose form →', {
        fontFamily: 'Georgia, serif',
        fontSize: '20px',
        color: '#0b1210',
        backgroundColor: btnColor,
        padding: { x: 18, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ backgroundColor: btnHover }));
    btn.on('pointerout', () => btn.setStyle({ backgroundColor: btnColor }));
    btn.on('pointerdown', () => {
      this.scene.start('Spec', { classId });
    });
  }
}
