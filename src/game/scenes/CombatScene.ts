import Phaser from 'phaser';
import { CARDS, FORM_COLORS, FORM_LABELS } from '../data/cards';
import { getClass } from '../data/classes';
import { getCardDescription } from '../data/talents';
import { GAME_H, GAME_W, setupHiDpiCamera } from '../display';
import { GameRegistry } from '../GameRegistry';
import {
  applyEnemyTurnStep,
  beginPlayerTurn,
  cancelTarget,
  canPlayCard,
  endPlayerTurn,
  playCardOnEnemy,
  selectCard,
  type CombatState,
  type EnemyTurnStep,
} from '../systems/CombatSystem';
import { fitCardText } from '../ui/fitCardText';

const CARD_W = 130;
const CARD_H = 200;
/** Bottom padding inside the card frame for description text. */
const CARD_PAD = 8;
const PLAYER_X = 160;
const PLAYER_Y = 280;

export class CombatScene extends Phaser.Scene {
  private handContainers: Phaser.GameObjects.Container[] = [];
  private enemyContainers: Map<string, Phaser.GameObjects.Container> = new Map();
  private hudText!: Phaser.GameObjects.Text;
  private logText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private playerHpBar!: Phaser.GameObjects.Graphics;
  private playerHpLabel!: Phaser.GameObjects.Text;
  private playerPortrait!: Phaser.GameObjects.Image | Phaser.GameObjects.Arc;
  private endTurnBtn!: Phaser.GameObjects.Text;
  private selectedHandIndex: number | null = null;
  private animatingEnemyTurn = false;
  private enemyTurnSteps: EnemyTurnStep[] = [];
  private enemyTurnIndex = 0;

  constructor() {
    super('Combat');
  }

  create(): void {
    const combat = GameRegistry.combat;
    const run = GameRegistry.run;
    if (!combat || !run) {
      this.scene.start('Title');
      return;
    }

    this.animatingEnemyTurn = false;
    this.enemyTurnSteps = [];
    this.enemyTurnIndex = 0;

    setupHiDpiCamera(this);
    const width = GAME_W;
    const height = GAME_H;
    this.drawBg(width, height);

    this.hudText = this.add.text(24, 16, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
      color: '#e8f5e9',
    });

    this.hintText = this.add
      .text(width / 2, 56, '', {
        fontFamily: 'Georgia, serif',
        fontSize: '16px',
        color: '#fde68a',
      })
      .setOrigin(0.5);

    this.logText = this.add.text(24, height - 210, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      color: '#9aa5b1',
      wordWrap: { width: 280 },
      lineSpacing: 4,
    });

    // Player portrait
    const cls = getClass(run.classId);
    const heroArt = combat.player.art ?? cls.heroArt;
    if (this.textures.exists(heroArt)) {
      this.playerPortrait = this.add.image(PLAYER_X, PLAYER_Y, heroArt).setDisplaySize(160, 160);
    } else {
      this.playerPortrait = this.add.circle(PLAYER_X, PLAYER_Y, 70, 0x3d9b6a);
    }
    this.add
      .text(PLAYER_X, PLAYER_Y + 100, combat.player.name, {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: '#e8f5e9',
      })
      .setOrigin(0.5);

    this.playerHpBar = this.add.graphics();
    this.playerHpLabel = this.add
      .text(PLAYER_X, PLAYER_Y + 124, '', {
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        color: '#86efac',
      })
      .setOrigin(0.5);

    this.endTurnBtn = this.add
      .text(width - 40, height - 240, 'End Turn', {
        fontFamily: 'Georgia, serif',
        fontSize: '20px',
        color: '#0b1210',
        backgroundColor: '#fbbf24',
        padding: { x: 18, y: 10 },
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });

    this.endTurnBtn.on('pointerdown', () => {
      if (combat.phase !== 'player' || this.animatingEnemyTurn) return;
      this.selectedHandIndex = null;
      const steps = endPlayerTurn(combat);
      this.refresh();
      this.playEnemyTurnSequence(steps);
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.animatingEnemyTurn) return;
      cancelTarget(combat);
      this.selectedHandIndex = null;
      this.refresh();
    });

    this.refresh();
  }

  private drawBg(width: number, height: number): void {
    if (this.textures.exists('bg-forest')) {
      this.add.image(width / 2, height / 2, 'bg-forest').setDisplaySize(width, height).setAlpha(0.5);
    } else {
      const g = this.add.graphics();
      g.fillGradientStyle(0x0b1210, 0x0b1210, 0x1a3328, 0x102018, 1);
      g.fillRect(0, 0, width, height);
    }
  }

  private refresh(): void {
    const combat = GameRegistry.combat!;
    this.hudText.setText(
      `Energy ${combat.energy}/${combat.energyMax}   ·   Turn ${combat.turn}   ·   Draw ${combat.drawPile.length} / Discard ${combat.discardPile.length}`,
    );

    if (this.animatingEnemyTurn || combat.phase === 'enemy') {
      this.hintText.setText('Enemy turn...');
    } else if (combat.awaitingTarget) {
      this.hintText.setText('Select a target enemy  (Esc to cancel)');
    } else {
      this.hintText.setText('');
    }

    const recent = combat.log.slice(-8).map((l) => l.text).join('\n');
    this.logText.setText(recent);

    this.drawPlayerHp(combat);
    this.drawEnemies(combat);
    this.drawHand(combat);

    const canAct = combat.phase === 'player' && !this.animatingEnemyTurn;
    this.endTurnBtn.setAlpha(canAct ? 1 : 0.4);
  }

  private drawPlayerHp(combat: CombatState): void {
    const p = combat.player;
    const px = PLAYER_X;
    const py = PLAYER_Y;
    this.playerHpBar.clear();
    this.playerHpBar.fillStyle(0x1e293b, 1);
    this.playerHpBar.fillRoundedRect(px - 70, py + 140, 140, 14, 4);
    const pct = p.hp / p.maxHp;
    this.playerHpBar.fillStyle(0x22c55e, 1);
    this.playerHpBar.fillRoundedRect(px - 70, py + 140, 140 * pct, 14, 4);
    if (p.block > 0) {
      this.playerHpBar.lineStyle(2, 0x7dd3fc, 1);
      this.playerHpBar.strokeRoundedRect(px - 70, py + 140, 140, 14, 4);
    }
    const statuses = p.statuses.map((s) => `${s.name}(${s.duration})`).join(' · ');
    this.playerHpLabel.setText(
      `HP ${p.hp}/${p.maxHp}${p.block ? `  🛡${p.block}` : ''}${statuses ? `\n${statuses}` : ''}`,
    );
  }

  private drawEnemies(combat: CombatState): void {
    for (const c of this.enemyContainers.values()) c.destroy();
    this.enemyContainers.clear();

    const living = combat.enemies;
    const startX = GAME_W / 2 + 40;
    const spacing = living.length >= 4 ? 150 : 180;
    const totalW = (living.length - 1) * spacing;
    const baseX = startX - totalW / 2;
    const y = 260;

    living.forEach((enemy, i) => {
      const x = baseX + i * spacing;
      const container = this.add.container(x, y);
      const dead = enemy.hp <= 0;

      const artKey = enemy.art ?? 'enemy-wolf';
      if (this.textures.exists(artKey)) {
        const img = this.add.image(0, 0, artKey).setDisplaySize(120, 120);
        if (dead) img.setAlpha(0.25).setTint(0x555555);
        container.add(img);
      } else {
        container.add(this.add.circle(0, 0, 55, dead ? 0x334155 : 0x7f1d1d));
      }

      container.add(
        this.add
          .text(0, 75, enemy.name, {
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            color: dead ? '#64748b' : '#e2e8f0',
          })
          .setOrigin(0.5),
      );

      const hpPct = enemy.hp / enemy.maxHp;
      const bar = this.add.graphics();
      bar.fillStyle(0x1e293b, 1);
      bar.fillRoundedRect(-55, 90, 110, 12, 3);
      bar.fillStyle(0xef4444, 1);
      bar.fillRoundedRect(-55, 90, 110 * hpPct, 12, 3);
      container.add(bar);

      container.add(
        this.add
          .text(0, 96, `${enemy.hp}/${enemy.maxHp}${enemy.block ? ` 🛡${enemy.block}` : ''}`, {
            fontFamily: 'Georgia, serif',
            fontSize: '11px',
            color: '#fff',
          })
          .setOrigin(0.5),
      );

      if (!dead && enemy.intent) {
        const intentIcon =
          enemy.intent.type === 'summon'
            ? '✧'
            : enemy.intent.type === 'heal'
              ? '✚'
              : enemy.intent.type === 'buff'
                ? '▲'
                : enemy.intent.type === 'defend'
                  ? '🛡'
                  : enemy.intent.type === 'debuff'
                    ? '☠'
                    : '⚔';
        container.add(
          this.add
            .text(0, -85, `${intentIcon} ${enemy.intent.label}`, {
              fontFamily: 'Georgia, serif',
              fontSize: '13px',
              color: enemy.enraged ? '#fb923c' : '#fca5a5',
              backgroundColor: '#1e1010',
              padding: { x: 8, y: 4 },
            })
            .setOrigin(0.5),
        );
      }

      const statusLines = enemy.statuses.map((s) =>
        s.kind === 'earthAndMoon'
          ? `${s.name} +${s.value}%`
          : `${s.name}: ${s.value}/turn (${s.duration})`,
      );
      if (enemy.enraged) statusLines.unshift('ENRAGED');
      if (statusLines.length) {
        container.add(
          this.add
            .text(0, 115, statusLines.join('\n'), {
              fontFamily: 'Georgia, serif',
              fontSize: '10px',
              color: enemy.enraged ? '#fb923c' : '#f87171',
              align: 'center',
              lineSpacing: 2,
            })
            .setOrigin(0.5, 0),
        );
      }

      if (!dead) {
        const hit = this.add.circle(0, 0, 70, 0xffffff, 0).setInteractive({ useHandCursor: true });
        hit.on('pointerover', () => {
          if (combat.awaitingTarget) container.setScale(1.08);
        });
        hit.on('pointerout', () => container.setScale(1));
        hit.on('pointerdown', () => this.onEnemyClick(enemy.id));
        container.add(hit);
      }

      this.enemyContainers.set(enemy.id, container);
    });
  }

  private drawHand(combat: CombatState): void {
    for (const c of this.handContainers) c.destroy();
    this.handContainers = [];

    const width = GAME_W;
    const height = GAME_H;
    const n = combat.hand.length;
    if (n === 0) return;

    const spacing = Math.min(CARD_W + 16, (width - 80) / n);
    const totalW = (n - 1) * spacing;
    const startX = width / 2 - totalW / 2;
    const y = height - 120;

    combat.hand.forEach((cardId, index) => {
      const card = CARDS[cardId];
      if (!card) return;
      const x = startX + index * spacing;
      const container = this.add.container(x, y);
      const playable = canPlayCard(combat, index);
      const selected = this.selectedHandIndex === index;

      // Card frame
      const formColor = FORM_COLORS[card.form] ?? 0x334155;
      const bg = this.add.rectangle(0, 0, CARD_W, CARD_H, 0x0f1a14, 0.95);
      bg.setStrokeStyle(selected ? 3 : 2, selected ? 0xfbbf24 : formColor);
      container.add(bg);

      if (this.textures.exists(card.art)) {
        const art = this.add.image(0, -36, card.art).setDisplaySize(108, 86);
        if (!playable) art.setTint(0x666666);
        container.add(art);
      }

      // Cost gem
      container.add(this.add.circle(-CARD_W / 2 + 16, -CARD_H / 2 + 16, 14, 0x1d4ed8));
      container.add(
        this.add
          .text(-CARD_W / 2 + 16, -CARD_H / 2 + 16, String(card.cost), {
            fontFamily: 'Georgia, serif',
            fontSize: '16px',
            color: '#fff',
            fontStyle: 'bold',
          })
          .setOrigin(0.5),
      );

      const nameText = fitCardText(
        this,
        0,
        24,
        card.name,
        CARD_W - 16,
        22,
        {
          color: playable ? '#e8f5e9' : '#64748b',
          fontSize: 14,
          minFontSize: 11,
          fontStyle: 'bold',
          lineSpacing: 0,
        },
      );
      container.add(nameText);

      const formLabel = this.add
        .text(0, 48, FORM_LABELS[card.form] ?? '', {
          fontFamily: 'Georgia, serif',
          fontSize: '11px',
          color: `#${formColor.toString(16).padStart(6, '0')}`,
        })
        .setOrigin(0.5);
      container.add(formLabel);

      // Description fills the remaining bottom band and is clipped to the card
      const descTop = 58;
      const descMaxH = CARD_H / 2 - descTop - CARD_PAD;
      const description = getCardDescription(card, combat.talents);
      container.add(
        fitCardText(this, 0, descTop, description, CARD_W - 16, descMaxH, {
          color: '#cbd5e1',
          fontSize: 11,
          minFontSize: 9,
          lineSpacing: 2,
        }),
      );

      if (playable && combat.phase === 'player') {
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerover', () => {
          // Lift only — fractional scale blurs bitmap text
          container.y = y - 24;
        });
        bg.on('pointerout', () => {
          if (this.selectedHandIndex !== index) {
            container.y = y;
          }
        });
        bg.on('pointerdown', () => this.onCardClick(index));
      } else {
        container.setAlpha(0.55);
      }

      if (selected) {
        container.y = y - 30;
      }

      this.handContainers.push(container);
    });
  }

  private onCardClick(handIndex: number): void {
    const combat = GameRegistry.combat!;
    if (combat.phase !== 'player' || this.animatingEnemyTurn) return;

    const result = selectCard(combat, handIndex);
    if (result === 'target') {
      this.selectedHandIndex = handIndex;
    } else if (result === 'played') {
      this.selectedHandIndex = null;
    }
    this.refresh();
    this.handlePhaseChange();
  }

  private onEnemyClick(enemyId: string): void {
    const combat = GameRegistry.combat!;
    if (this.animatingEnemyTurn) return;
    if (!combat.awaitingTarget || this.selectedHandIndex === null) return;

    const ok = playCardOnEnemy(combat, this.selectedHandIndex, enemyId);
    if (ok) {
      this.selectedHandIndex = null;
      this.refresh();
      this.handlePhaseChange();
    }
  }

  private playEnemyTurnSequence(steps: EnemyTurnStep[]): void {
    this.animatingEnemyTurn = true;
    this.enemyTurnSteps = steps;
    this.enemyTurnIndex = 0;
    this.refresh();

    if (steps.length === 0) {
      this.finishEnemyTurn();
      return;
    }

    this.time.delayedCall(350, () => this.playNextEnemyStep());
  }

  private playNextEnemyStep(): void {
    const combat = GameRegistry.combat!;
    if (
      combat.phase === 'victory' ||
      combat.phase === 'defeat' ||
      this.enemyTurnIndex >= this.enemyTurnSteps.length
    ) {
      this.finishEnemyTurn();
      return;
    }

    const step = this.enemyTurnSteps[this.enemyTurnIndex]!;
    this.enemyTurnIndex += 1;

    const enemy = combat.enemies.find((e) => e.id === step.enemyId);
    if (!enemy || enemy.hp <= 0) {
      this.playNextEnemyStep();
      return;
    }

    const container = this.enemyContainers.get(step.enemyId);
    if (!container) {
      applyEnemyTurnStep(combat, step);
      this.refresh();
      this.time.delayedCall(280, () => this.playNextEnemyStep());
      return;
    }

    this.animateEnemyStep(step, container, () => {
      applyEnemyTurnStep(combat, step);
      this.refresh();

      if (combat.phase === 'victory' || combat.phase === 'defeat') {
        this.finishEnemyTurn();
        return;
      }

      const pause = step.kind === 'intent' ? 520 : 380;
      this.time.delayedCall(pause, () => this.playNextEnemyStep());
    });
  }

  private animateEnemyStep(
    step: EnemyTurnStep,
    container: Phaser.GameObjects.Container,
    onComplete: () => void,
  ): void {
    const originX = container.x;
    const originY = container.y;

    if (step.kind === 'statusTick') {
      this.tweens.add({
        targets: container,
        alpha: 0.55,
        duration: 140,
        yoyo: true,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          container.setAlpha(1);
          onComplete();
        },
      });
      return;
    }

    switch (step.intent.type) {
      case 'attack': {
        const lungeX = originX + (PLAYER_X - originX) * 0.28;
        const lungeY = originY + (PLAYER_Y - originY) * 0.18;
        this.tweens.add({
          targets: container,
          x: lungeX,
          y: lungeY,
          duration: 220,
          ease: 'Cubic.easeIn',
          yoyo: true,
          hold: 60,
          onYoyo: () => {
            this.shakePlayer();
            this.flashFloatingText(PLAYER_X, PLAYER_Y - 50, `-${step.intent.value}`, '#fca5a5');
          },
          onComplete: () => {
            container.setPosition(originX, originY);
            onComplete();
          },
        });
        break;
      }
      case 'defend': {
        this.tweens.add({
          targets: container,
          scaleX: 1.12,
          scaleY: 1.12,
          duration: 180,
          yoyo: true,
          ease: 'Back.easeOut',
          onYoyo: () => {
            this.flashFloatingText(originX, originY - 100, `+${step.intent.value} Block`, '#7dd3fc');
          },
          onComplete: () => {
            container.setScale(1);
            onComplete();
          },
        });
        break;
      }
      case 'buff': {
        this.tweens.add({
          targets: container,
          y: originY - 18,
          duration: 200,
          yoyo: true,
          ease: 'Sine.easeOut',
          onYoyo: () => {
            this.flashFloatingText(originX, originY - 100, `+${step.intent.value} Str`, '#fbbf24');
          },
          onComplete: () => {
            container.y = originY;
            onComplete();
          },
        });
        break;
      }
      case 'debuff': {
        this.tweens.add({
          targets: container,
          angle: -6,
          duration: 100,
          yoyo: true,
          repeat: 2,
          ease: 'Sine.easeInOut',
          onStart: () => {
            this.flashFloatingText(PLAYER_X, PLAYER_Y - 50, step.intent.label, '#a3e635');
          },
          onComplete: () => {
            container.setAngle(0);
            onComplete();
          },
        });
        break;
      }
      case 'heal': {
        this.tweens.add({
          targets: container,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 200,
          yoyo: true,
          ease: 'Sine.easeOut',
          onYoyo: () => {
            this.flashFloatingText(originX, originY - 100, `+${step.intent.value} HP`, '#86efac');
          },
          onComplete: () => {
            container.setScale(1);
            onComplete();
          },
        });
        break;
      }
      case 'summon': {
        this.tweens.add({
          targets: container,
          scaleX: 1.15,
          scaleY: 1.15,
          duration: 220,
          yoyo: true,
          ease: 'Back.easeOut',
          onYoyo: () => {
            this.flashFloatingText(originX, originY - 100, step.intent.label, '#c4b5fd');
          },
          onComplete: () => {
            container.setScale(1);
            onComplete();
          },
        });
        break;
      }
      default:
        onComplete();
    }
  }

  private shakePlayer(): void {
    const portrait = this.playerPortrait;
    const ox = PLAYER_X;
    this.tweens.add({
      targets: portrait,
      x: ox + 10,
      duration: 45,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        portrait.x = ox;
      },
    });
  }

  private flashFloatingText(x: number, y: number, text: string, color: string): void {
    const label = this.add
      .text(x, y, text, {
        fontFamily: 'Georgia, serif',
        fontSize: '22px',
        color,
        fontStyle: 'bold',
        stroke: '#0b1210',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(100);

    this.tweens.add({
      targets: label,
      y: y - 40,
      alpha: 0,
      duration: 700,
      ease: 'Cubic.easeOut',
      onComplete: () => label.destroy(),
    });
  }

  private finishEnemyTurn(): void {
    const combat = GameRegistry.combat!;
    this.animatingEnemyTurn = false;
    this.enemyTurnSteps = [];
    this.enemyTurnIndex = 0;

    if (combat.phase === 'victory' || combat.phase === 'defeat') {
      this.refresh();
      this.handlePhaseChange();
      return;
    }

    beginPlayerTurn(combat);
    this.refresh();
    this.handlePhaseChange();
  }

  private handlePhaseChange(): void {
    const combat = GameRegistry.combat!;
    if (combat.phase === 'victory') {
      this.time.delayedCall(800, () => {
        const run = GameRegistry.run!;
        run.hp = combat.player.hp;
        run.victories += 1;
        run.talentPoints += 1;
        run.shopRerollCount = 0;
        const node = run.map.find((n) => n.id === GameRegistry.pendingNodeId);
        if (node) node.cleared = true;
        if (node?.type === 'boss') {
          this.scene.start('GameOver', { victory: true });
        } else {
          this.scene.start('Reward');
        }
      });
    } else if (combat.phase === 'defeat') {
      this.time.delayedCall(800, () => {
        this.scene.start('GameOver', { victory: false });
      });
    }
  }
}
