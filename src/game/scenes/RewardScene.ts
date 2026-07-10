import Phaser from 'phaser';
import { CARDS, FORM_COLORS, FORM_LABELS, cardBuyCost, shopRerollCost } from '../data/cards';
import { getCardDescription } from '../data/talents';
import { randomRewards } from '../data/run';
import { GAME_H, GAME_W, setupHiDpiCamera } from '../display';
import { GameRegistry } from '../GameRegistry';
import { fitCardText } from '../ui/fitCardText';

export class RewardScene extends Phaser.Scene {
  private freePickUsed = false;
  private taken = new Set<number>();
  private goldText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private rewards: string[] = [];
  private contentRoot!: Phaser.GameObjects.Container;

  constructor() {
    super('Reward');
  }

  create(data: { treasure?: boolean }): void {
    const run = GameRegistry.run;
    if (!run) {
      this.scene.start('Title');
      return;
    }

    // Phaser reuses the scene instance — clear purchase state each visit
    this.freePickUsed = false;
    this.taken = new Set();
    this.rewards = [];

    setupHiDpiCamera(this);
    const width = GAME_W;
    const height = GAME_H;
    const g = this.add.graphics();
    g.fillGradientStyle(0x0b1210, 0x0b1210, 0x1a2e24, 0x102018, 1);
    g.fillRect(0, 0, width, height);

    const title = data.treasure ? 'Treasure of the Grove' : 'Victory — Choose Cards';
    this.add
      .text(width / 2, 70, title, {
        fontFamily: 'Georgia, serif',
        fontSize: '36px',
        color: '#e8f5e9',
      })
      .setOrigin(0.5);

    if (data.treasure) {
      run.gold += 40;
      this.add
        .text(width / 2, 118, '+40 Gold', {
          fontFamily: 'Georgia, serif',
          fontSize: '20px',
          color: '#fbbf24',
        })
        .setOrigin(0.5);
    } else {
      run.gold += 15;
      this.add
        .text(width / 2, 118, '+15 Gold  ·  +1 Talent Point', {
          fontFamily: 'Georgia, serif',
          fontSize: '18px',
          color: '#fbbf24',
        })
        .setOrigin(0.5);
    }

    this.goldText = this.add
      .text(width / 2, 150, `Gold ${run.gold}`, {
        fontFamily: 'Georgia, serif',
        fontSize: '16px',
        color: '#fde68a',
      })
      .setOrigin(0.5);

    this.statusText = this.add
      .text(width / 2, 178, '', {
        fontFamily: 'Georgia, serif',
        fontSize: '15px',
        color: '#9aa5b1',
      })
      .setOrigin(0.5);

    this.contentRoot = this.add.container(0, 0);
    this.rewards = randomRewards(3);
    this.refreshHud();
    this.renderCards();

    const done = this.add
      .text(width / 2, height - 40, 'Continue', {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: '#94a3b8',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    done.on('pointerdown', () => this.finishNode());
  }

  private refreshHud(): void {
    const run = GameRegistry.run!;
    this.goldText.setText(`Gold ${run.gold}`);
    if (!this.freePickUsed) {
      this.statusText.setText(
        'First card is free. Extra cards cost gold. Reroll cost rises until your next fight.',
      );
    } else {
      this.statusText.setText('Buy more cards with gold, reroll, or continue.');
    }
  }

  private rerollRewards(): void {
    const run = GameRegistry.run!;
    const cost = shopRerollCost(run.shopRerollCount);
    if (run.gold < cost) return;
    run.gold -= cost;
    run.shopRerollCount += 1;
    this.rewards = randomRewards(3);
    this.taken = new Set();
    this.refreshHud();
    this.renderCards();
  }

  private renderCards(): void {
    this.contentRoot.removeAll(true);
    const run = GameRegistry.run!;
    const width = GAME_W;
    const spacing = 220;
    const startX = width / 2 - spacing;
    const REWARD_W = 180;
    const REWARD_H = 260;
    const rerollCost = shopRerollCost(run.shopRerollCount);
    const canReroll = run.gold >= rerollCost;

    this.rewards.forEach((id, i) => {
      const card = CARDS[id]!;
      const x = startX + i * spacing;
      const y = 340;
      const formColor = FORM_COLORS[card.form];
      const description = getCardDescription(card, run.talents);
      const taken = this.taken.has(i);
      const cost = cardBuyCost(id);
      const isFree = !this.freePickUsed;
      const canTake = !taken && (isFree || run.gold >= cost);

      const container = this.add.container(x, y);
      this.contentRoot.add(container);

      const frame = this.add.rectangle(0, 0, REWARD_W, REWARD_H, 0x0f1a14, taken ? 0.45 : 0.95);
      frame.setStrokeStyle(2, taken ? 0x475569 : formColor);
      container.add(frame);

      if (this.textures.exists(card.art)) {
        container.add(
          this.add.image(0, -52, card.art).setDisplaySize(140, 110).setAlpha(taken ? 0.4 : 1),
        );
      }

      // Energy cost gem
      container.add(this.add.circle(-REWARD_W / 2 + 16, -REWARD_H / 2 + 16, 14, 0x1d4ed8));
      container.add(
        this.add
          .text(-REWARD_W / 2 + 16, -REWARD_H / 2 + 16, String(card.cost), {
            fontFamily: 'Georgia, serif',
            fontSize: '16px',
            color: '#fff',
            fontStyle: 'bold',
          })
          .setOrigin(0.5),
      );

      container.add(
        fitCardText(this, 0, 22, card.name, REWARD_W - 20, 28, {
          color: taken ? '#64748b' : '#e8f5e9',
          fontSize: 18,
          minFontSize: 13,
          fontStyle: 'bold',
          lineSpacing: 0,
        }),
      );

      container.add(
        this.add
          .text(0, 54, FORM_LABELS[card.form], {
            fontFamily: 'Georgia, serif',
            fontSize: '12px',
            color: taken
              ? '#64748b'
              : `#${formColor.toString(16).padStart(6, '0')}`,
          })
          .setOrigin(0.5),
      );

      const descTop = 72;
      const descMaxH = REWARD_H / 2 - descTop - 8;
      container.add(
        fitCardText(this, 0, descTop, description, REWARD_W - 20, descMaxH, {
          color: taken ? '#64748b' : '#cbd5e1',
          fontSize: 13,
          minFontSize: 10,
          lineSpacing: 2,
        }),
      );

      let priceLabel = 'Taken';
      let priceColor = '#64748b';
      if (!taken) {
        if (isFree) {
          priceLabel = 'Free';
          priceColor = '#4ade80';
        } else if (run.gold >= cost) {
          priceLabel = `${cost}g`;
          priceColor = '#fbbf24';
        } else {
          priceLabel = `${cost}g`;
          priceColor = '#f87171';
        }
      }

      container.add(
        this.add
          .text(0, REWARD_H / 2 + 16, priceLabel, {
            fontFamily: 'Georgia, serif',
            fontSize: '15px',
            color: priceColor,
          })
          .setOrigin(0.5),
      );

      if (canTake) {
        frame.setInteractive({ useHandCursor: true });
        frame.on('pointerover', () => frame.setStrokeStyle(3, 0xfbbf24));
        frame.on('pointerout', () => frame.setStrokeStyle(2, formColor));
        frame.on('pointerdown', () => {
          if (this.taken.has(i)) return;
          if (!this.freePickUsed) {
            this.freePickUsed = true;
          } else {
            if (run.gold < cost) return;
            run.gold -= cost;
          }
          run.deck.push(id);
          this.taken.add(i);
          this.refreshHud();
          this.renderCards();
        });
      }
    });

    const rerollBtn = this.add
      .text(width / 2, 520, `Reroll — ${rerollCost}g`, {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: canReroll ? '#0b1210' : '#64748b',
        backgroundColor: canReroll ? '#86efac' : '#1e293b',
        padding: { x: 16, y: 10 },
      })
      .setOrigin(0.5);

    if (canReroll) {
      rerollBtn.setInteractive({ useHandCursor: true });
      rerollBtn.on('pointerdown', () => this.rerollRewards());
    }
    this.contentRoot.add(rerollBtn);
  }

  private finishNode(): void {
    const run = GameRegistry.run!;
    const node = run.map.find((n) => n.id === GameRegistry.pendingNodeId);
    if (node) node.cleared = true;
    GameRegistry.combat = null;
    if (run.talentPoints > 0) {
      this.scene.start('Talent', { returnTo: 'Map' });
    } else {
      this.scene.start('Map');
    }
  }
}
