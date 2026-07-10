import Phaser from 'phaser';
import { applyItemPickup, getItem, randomItemOffers } from '../data/items';
import { GAME_H, GAME_W, setupHiDpiCamera } from '../display';
import { GameRegistry } from '../GameRegistry';

/**
 * Elite victory: pick 1 of 3 items (general pool + current specialization).
 * Continues into the normal card Reward scene.
 */
export class ItemRewardScene extends Phaser.Scene {
  private offers: string[] = [];
  private chosen = false;

  constructor() {
    super('ItemReward');
  }

  create(): void {
    const run = GameRegistry.run;
    if (!run) {
      this.scene.start('Title');
      return;
    }

    this.offers = [];
    this.chosen = false;
    setupHiDpiCamera(this);
    const width = GAME_W;
    const height = GAME_H;

    const g = this.add.graphics();
    g.fillGradientStyle(0x0b1210, 0x0b1210, 0x1a2433, 0x101820, 1);
    g.fillRect(0, 0, width, height);

    this.add
      .text(width / 2, 64, 'Elite Spoils — Choose an Item', {
        fontFamily: 'Georgia, serif',
        fontSize: '34px',
        color: '#fde68a',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 108, 'Keep one relic. Spec-only items appear for your opening path.', {
        fontFamily: 'Georgia, serif',
        fontSize: '16px',
        color: '#9aa5b1',
      })
      .setOrigin(0.5);

    this.offers = randomItemOffers(run.openingSpec, run.items, 3);
    if (!this.offers.length) {
      this.add
        .text(width / 2, height / 2, 'No items remain — continuing…', {
          fontFamily: 'Georgia, serif',
          fontSize: '20px',
          color: '#e2e8f0',
        })
        .setOrigin(0.5);
      this.time.delayedCall(700, () => this.scene.start('Reward'));
      return;
    }

    const cardW = 280;
    const gap = 36;
    const totalW = this.offers.length * cardW + (this.offers.length - 1) * gap;
    const startX = width / 2 - totalW / 2 + cardW / 2;
    const y = height / 2 + 10;

    this.offers.forEach((id, i) => {
      const def = getItem(id);
      if (!def) return;
      const x = startX + i * (cardW + gap);
      const container = this.add.container(x, y);

      const bg = this.add.graphics();
      const border =
        def.spec === null ? 0x64748b : def.rarity === 'epic' ? 0xc084fc : 0xfbbf24;
      bg.fillStyle(0x152018, 0.95);
      bg.fillRoundedRect(-cardW / 2, -160, cardW, 320, 12);
      bg.lineStyle(3, border, 1);
      bg.strokeRoundedRect(-cardW / 2, -160, cardW, 320, 12);
      container.add(bg);

      const tag =
        def.spec === null
          ? 'GENERAL'
          : def.spec.toUpperCase();
      container.add(
        this.add
          .text(0, -138, tag, {
            fontFamily: 'Georgia, serif',
            fontSize: '13px',
            color: def.spec === null ? '#94a3b8' : '#fde68a',
          })
          .setOrigin(0.5),
      );

      container.add(
        this.add
          .text(0, -100, def.name, {
            fontFamily: 'Georgia, serif',
            fontSize: '22px',
            color: '#e8f5e9',
            align: 'center',
            wordWrap: { width: cardW - 28 },
          })
          .setOrigin(0.5, 0),
      );

      container.add(
        this.add
          .text(0, -20, def.description, {
            fontFamily: 'Georgia, serif',
            fontSize: '15px',
            color: '#cbd5e1',
            align: 'center',
            wordWrap: { width: cardW - 36 },
          })
          .setOrigin(0.5, 0),
      );

      const hit = this.add
        .rectangle(0, 0, cardW, 320, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      container.add(hit);

      hit.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(0x1c2e24, 0.98);
        bg.fillRoundedRect(-cardW / 2, -160, cardW, 320, 12);
        bg.lineStyle(3, 0x4ade80, 1);
        bg.strokeRoundedRect(-cardW / 2, -160, cardW, 320, 12);
      });
      hit.on('pointerout', () => {
        bg.clear();
        bg.fillStyle(0x152018, 0.95);
        bg.fillRoundedRect(-cardW / 2, -160, cardW, 320, 12);
        bg.lineStyle(3, border, 1);
        bg.strokeRoundedRect(-cardW / 2, -160, cardW, 320, 12);
      });
      hit.on('pointerdown', () => this.pick(id));
    });
  }

  private pick(itemId: string): void {
    if (this.chosen) return;
    const run = GameRegistry.run;
    if (!run) return;
    this.chosen = true;
    applyItemPickup(run, itemId);
    this.scene.start('Reward');
  }
}
