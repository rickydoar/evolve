import Phaser from 'phaser';
import {
  CARD_REMOVE_COST,
  CARDS,
  FORM_COLORS,
  FORM_LABELS,
  RARITY_COLORS,
  cardBuyCost,
  shopRerollCost,
} from '../data/cards';
import { getCardDescription } from '../data/talents';
import { randomRewards, removeCardAt } from '../data/run';
import { GAME_H, GAME_W, setupHiDpiCamera } from '../display';
import { GameRegistry } from '../GameRegistry';
import { fitCardText } from '../ui/fitCardText';

export class ShopScene extends Phaser.Scene {
  private stock: string[] = [];
  private purchased = new Set<number>();
  private goldText!: Phaser.GameObjects.Text;
  private contentRoot!: Phaser.GameObjects.Container;

  constructor() {
    super('Shop');
  }

  create(): void {
    const run = GameRegistry.run;
    if (!run) {
      this.scene.start('Title');
      return;
    }

    // Phaser reuses the scene instance — clear purchase state each visit
    this.stock = [];
    this.purchased = new Set();

    setupHiDpiCamera(this);
    const width = GAME_W;
    const height = GAME_H;

    const g = this.add.graphics();
    g.fillGradientStyle(0x0b1210, 0x0b1210, 0x1a2818, 0x102014, 1);
    g.fillRect(0, 0, width, height);

    this.add
      .text(width / 2, 48, 'Merchant of the Grove', {
        fontFamily: 'Georgia, serif',
        fontSize: '36px',
        color: '#e8f5e9',
      })
      .setOrigin(0.5);

    this.goldText = this.add
      .text(width / 2, 92, '', {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: '#fbbf24',
      })
      .setOrigin(0.5);

    this.stock = randomRewards(5);
    this.contentRoot = this.add.container(0, 0);

    this.refreshGold();
    this.renderBrowse();

    const leave = this.add
      .text(width / 2, height - 40, 'Leave Shop', {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: '#94a3b8',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    leave.on('pointerdown', () => this.finish());
  }

  private refreshGold(): void {
    const run = GameRegistry.run!;
    this.goldText.setText(`Gold ${run.gold}`);
  }

  private clearContent(): void {
    this.contentRoot.removeAll(true);
  }

  private rerollStock(): void {
    const run = GameRegistry.run!;
    const cost = shopRerollCost(run.shopRerollCount);
    if (run.gold < cost) return;
    run.gold -= cost;
    run.shopRerollCount += 1;
    this.stock = randomRewards(5);
    this.purchased = new Set();
    this.refreshGold();
    this.renderBrowse();
  }

  private renderBrowse(): void {
    this.clearContent();
    const run = GameRegistry.run!;
    const width = GAME_W;
    const rerollCost = shopRerollCost(run.shopRerollCount);
    const canReroll = run.gold >= rerollCost;

    const hint = this.add
      .text(
        width / 2,
        128,
        'Buy as many cards as you can afford. Reroll cost rises until your next fight.',
        {
          fontFamily: 'Georgia, serif',
          fontSize: '15px',
          color: '#9aa5b1',
        },
      )
      .setOrigin(0.5);
    this.contentRoot.add(hint);

    const CARD_W = 150;
    const CARD_H = 220;
    const spacing = 168;
    const startX = width / 2 - ((this.stock.length - 1) * spacing) / 2;

    this.stock.forEach((id, i) => {
      const card = CARDS[id]!;
      const cost = cardBuyCost(id);
      const sold = this.purchased.has(i);
      const canAfford = run.gold >= cost;
      const x = startX + i * spacing;
      const y = 300;
      const formColor = FORM_COLORS[card.form];
      const description = getCardDescription(card, run.talents);

      const container = this.add.container(x, y);
      this.contentRoot.add(container);

      const frame = this.add.rectangle(0, 0, CARD_W, CARD_H, 0x0f1a14, sold ? 0.45 : 0.95);
      frame.setStrokeStyle(2, sold ? 0x475569 : formColor);
      container.add(frame);

      if (this.textures.exists(card.art)) {
        container.add(
          this.add.image(0, -48, card.art).setDisplaySize(120, 96).setAlpha(sold ? 0.4 : 1),
        );
      }

      container.add(
        fitCardText(this, 0, 18, card.name, CARD_W - 16, 24, {
          color: sold ? '#64748b' : '#e8f5e9',
          fontSize: 15,
          minFontSize: 11,
          fontStyle: 'bold',
          lineSpacing: 0,
        }),
      );

      container.add(
        this.add
          .text(0, 44, `${FORM_LABELS[card.form]} · ${card.rarity}`, {
            fontFamily: 'Georgia, serif',
            fontSize: '10px',
            color: sold
              ? '#64748b'
              : RARITY_COLORS[card.rarity],
          })
          .setOrigin(0.5),
      );

      container.add(
        fitCardText(this, 0, 60, description, CARD_W - 16, 70, {
          color: sold ? '#64748b' : '#cbd5e1',
          fontSize: 11,
          minFontSize: 9,
          lineSpacing: 1,
        }),
      );

      const priceLabel = sold
        ? 'Sold'
        : canAfford
          ? `${cost}g`
          : `${cost}g (need more)`;
      const price = this.add
        .text(0, CARD_H / 2 - 18, priceLabel, {
          fontFamily: 'Georgia, serif',
          fontSize: '14px',
          color: sold ? '#64748b' : canAfford ? '#fbbf24' : '#f87171',
        })
        .setOrigin(0.5);
      container.add(price);

      if (!sold && canAfford) {
        frame.setInteractive({ useHandCursor: true });
        frame.on('pointerover', () => frame.setStrokeStyle(3, 0xfbbf24));
        frame.on('pointerout', () => frame.setStrokeStyle(2, formColor));
        frame.on('pointerdown', () => {
          if (run.gold < cost || this.purchased.has(i)) return;
          run.gold -= cost;
          run.deck.push(id);
          this.purchased.add(i);
          this.refreshGold();
          this.renderBrowse();
        });
      }
    });

    const rerollBtn = this.add
      .text(width / 2 - 140, 460, `Reroll — ${rerollCost}g`, {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: canReroll ? '#0b1210' : '#64748b',
        backgroundColor: canReroll ? '#86efac' : '#1e293b',
        padding: { x: 16, y: 10 },
      })
      .setOrigin(0.5);

    if (canReroll) {
      rerollBtn.setInteractive({ useHandCursor: true });
      rerollBtn.on('pointerdown', () => this.rerollStock());
    }
    this.contentRoot.add(rerollBtn);

    const removeBtn = this.add
      .text(width / 2 + 140, 460, `Remove a Card — ${CARD_REMOVE_COST}g`, {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: run.gold >= CARD_REMOVE_COST && run.deck.length > 1 ? '#0b1210' : '#64748b',
        backgroundColor:
          run.gold >= CARD_REMOVE_COST && run.deck.length > 1 ? '#fbbf24' : '#1e293b',
        padding: { x: 16, y: 10 },
      })
      .setOrigin(0.5);

    if (run.gold >= CARD_REMOVE_COST && run.deck.length > 1) {
      removeBtn.setInteractive({ useHandCursor: true });
      removeBtn.on('pointerdown', () => this.renderRemove());
    }
    this.contentRoot.add(removeBtn);
  }

  private renderRemove(): void {
    this.clearContent();
    const run = GameRegistry.run!;
    const width = GAME_W;
    const height = GAME_H;

    const title = this.add
      .text(width / 2, 128, `Choose a card to remove (${CARD_REMOVE_COST}g)`, {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: '#e8f5e9',
      })
      .setOrigin(0.5);
    this.contentRoot.add(title);

    const back = this.add
      .text(width / 2, 158, '← Back to shop', {
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        color: '#94a3b8',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.renderBrowse());
    this.contentRoot.add(back);

    const cols = 6;
    const CARD_W = 120;
    const CARD_H = 160;
    const gapX = 16;
    const gapY = 14;
    const totalW = cols * CARD_W + (cols - 1) * gapX;
    const startX = width / 2 - totalW / 2 + CARD_W / 2;
    const startY = 250;

    run.deck.forEach((id, index) => {
      const card = CARDS[id];
      if (!card) return;
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * (CARD_W + gapX);
      const y = startY + row * (CARD_H + gapY);
      if (y > height - 100) return;

      const formColor = FORM_COLORS[card.form];
      const container = this.add.container(x, y);
      this.contentRoot.add(container);

      const frame = this.add.rectangle(0, 0, CARD_W, CARD_H, 0x0f1a14, 0.95);
      frame.setStrokeStyle(2, formColor);
      frame.setInteractive({ useHandCursor: true });
      container.add(frame);

      container.add(
        fitCardText(this, 0, -50, card.name, CARD_W - 12, 36, {
          color: '#e8f5e9',
          fontSize: 13,
          minFontSize: 10,
          fontStyle: 'bold',
          lineSpacing: 0,
        }),
      );

      container.add(
        fitCardText(
          this,
          0,
          -8,
          getCardDescription(card, run.talents),
          CARD_W - 12,
          70,
          {
            color: '#cbd5e1',
            fontSize: 10,
            minFontSize: 8,
            lineSpacing: 1,
          },
        ),
      );

      frame.on('pointerover', () => frame.setStrokeStyle(3, 0xf87171));
      frame.on('pointerout', () => frame.setStrokeStyle(2, formColor));
      frame.on('pointerdown', () => {
        if (run.gold < CARD_REMOVE_COST || run.deck.length <= 1) return;
        run.gold -= CARD_REMOVE_COST;
        removeCardAt(run, index);
        this.refreshGold();
        this.renderBrowse();
      });
    });
  }

  private finish(): void {
    const run = GameRegistry.run!;
    const node = run.map.find((n) => n.id === GameRegistry.pendingNodeId);
    if (node) node.cleared = true;
    this.scene.start('Map');
  }
}
