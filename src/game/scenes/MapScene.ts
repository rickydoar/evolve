import Phaser from 'phaser';
import { FORM_LABELS } from '../data/cards';
import { availableNodes, usePotion } from '../data/run';
import type { MapNode, NodeType } from '../data/types';
import { GAME_H, GAME_W, setupHiDpiCamera } from '../display';
import { GameRegistry } from '../GameRegistry';
import { startCombat } from '../systems/CombatSystem';

const NODE_ICONS: Record<NodeType, string> = {
  combat: 'map-combat',
  elite: 'map-elite',
  rest: 'map-rest',
  treasure: 'map-treasure',
  shop: 'map-shop',
  boss: 'map-boss',
};

const NODE_LABELS: Record<NodeType, string> = {
  combat: 'Fight',
  elite: 'Elite',
  rest: 'Rest',
  treasure: 'Treasure',
  shop: 'Shop',
  boss: 'Boss',
};

const NODE_SIZE: Record<NodeType, number> = {
  combat: 32,
  elite: 34,
  rest: 32,
  treasure: 32,
  shop: 32,
  boss: 44,
};

export class MapScene extends Phaser.Scene {
  constructor() {
    super('Map');
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
    this.drawBackground(width, height);

    this.add
      .text(40, 28, 'The Corrupted Grove', {
        fontFamily: 'Georgia, serif',
        fontSize: '32px',
        color: '#e8f5e9',
      });

    const specLabel = FORM_LABELS[run.openingSpec] ?? run.openingSpec;
    const potionBit = run.potions > 0 ? `   ·   Potions ${run.potions}` : '';
    this.add
      .text(
        40,
        70,
        `HP ${run.hp}/${run.maxHp}   ·   Gold ${run.gold}   ·   Deck ${run.deck.length}   ·   ${specLabel}   ·   Wins ${run.victories}   ·   Talents ${run.talentPoints}${potionBit}`,
        {
          fontFamily: 'Georgia, serif',
          fontSize: '16px',
          color: '#a8e6cf',
        },
      );

    const talentBtn = this.add
      .text(width - 40, 48, run.talentPoints > 0 ? `Talents (${run.talentPoints})` : 'Talents', {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: run.talentPoints > 0 ? '#0b1210' : '#a8e6cf',
        backgroundColor: run.talentPoints > 0 ? '#fbbf24' : '#1a2e24',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });

    talentBtn.on('pointerdown', () => {
      this.scene.start('Talent', { returnTo: 'Map' });
    });

    if (run.potions > 0) {
      const canDrink = run.hp < run.maxHp;
      const potionBtn = this.add
        .text(width - 40, 92, canDrink ? `Drink Potion (${run.potions})` : `Potions ${run.potions}`, {
          fontFamily: 'Georgia, serif',
          fontSize: '15px',
          color: canDrink ? '#0b1210' : '#94a3b8',
          backgroundColor: canDrink ? '#c084fc' : '#1a2e24',
          padding: { x: 12, y: 6 },
        })
        .setOrigin(1, 0.5);

      if (canDrink) {
        potionBtn.setInteractive({ useHandCursor: true });
        potionBtn.on('pointerdown', () => {
          if (usePotion(run) > 0) {
            this.scene.restart();
          }
        });
      }
    }

    const available = new Set(availableNodes(run).map((n) => n.id));
    const positions = new Map<string, { x: number; y: number }>();

    const maxFloor = Math.max(...run.map.map((n) => n.floor));
    const topMargin = 100;
    const bottomMargin = 80;
    const usableHeight = height - topMargin - bottomMargin;
    for (const node of run.map) {
      const floorNodes = run.map.filter((n) => n.floor === node.floor);
      const spacing = 120;
      const totalW = (floorNodes.length - 1) * spacing;
      const startX = width / 2 - totalW / 2;
      const x = startX + node.index * spacing;
      const y = height - bottomMargin - (node.floor / maxFloor) * usableHeight;
      positions.set(node.id, { x, y });
    }

    // Connections
    const g = this.add.graphics();
    for (const node of run.map) {
      const from = positions.get(node.id)!;
      for (const toId of node.connections) {
        const to = positions.get(toId)!;
        const active =
          available.has(toId) && (node.cleared || node.id === run.currentNodeId || (!run.currentNodeId && node.floor === 0));
        g.lineStyle(2, active ? 0x4ade80 : 0x334155, active ? 0.9 : 0.35);
        g.lineBetween(from.x, from.y, to.x, to.y);
      }
    }

    for (const node of run.map) {
      const pos = positions.get(node.id)!;
      const isAvail = available.has(node.id);
      const isCurrent = run.currentNodeId === node.id;
      this.drawNode(node, pos.x, pos.y, isAvail, isCurrent);
    }

    this.add
      .text(width / 2, height - 28, 'Choose your next path', {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: '#9aa5b1',
        stroke: '#0b1210',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setResolution(2);
  }

  private drawBackground(width: number, height: number): void {
    if (this.textures.exists('bg-forest')) {
      this.add.image(width / 2, height / 2, 'bg-forest').setDisplaySize(width, height).setAlpha(0.35);
    } else {
      const g = this.add.graphics();
      g.fillGradientStyle(0x0b1210, 0x0b1210, 0x14261c, 0x0f1c16, 1);
      g.fillRect(0, 0, width, height);
    }
  }

  private drawNode(
    node: MapNode,
    x: number,
    y: number,
    available: boolean,
    current: boolean,
  ): void {
    const size = NODE_SIZE[node.type];
    const iconKey = NODE_ICONS[node.type];
    const alpha = node.cleared ? 0.35 : available ? 1 : 0.45;

    if (current) {
      this.add.circle(x, y, size / 2 + 8, 0xffffff, 0).setStrokeStyle(2, 0x4ade80);
    }

    const icon = this.add
      .image(x, y, iconKey)
      .setDisplaySize(size, size)
      .setAlpha(alpha);

    // Keep labels clear of the icon: half icon height + gap
    const labelY = y + size / 2 + 6;
    this.add
      .text(x, labelY, NODE_LABELS[node.type], {
        fontFamily: 'Georgia, serif',
        fontSize: '12px',
        color: available ? '#f8fafc' : '#94a3b8',
        stroke: '#0b1210',
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0)
      .setResolution(2);

    if (available && !node.cleared) {
      const baseScaleX = icon.scaleX;
      const baseScaleY = icon.scaleY;
      icon.setInteractive({ useHandCursor: true });
      icon.on('pointerover', () => icon.setScale(baseScaleX * 1.12, baseScaleY * 1.12));
      icon.on('pointerout', () => icon.setScale(baseScaleX, baseScaleY));
      icon.on('pointerdown', () => this.enterNode(node));
    }
  }

  private enterNode(node: MapNode): void {
    const run = GameRegistry.run!;
    run.currentNodeId = node.id;
    run.floor = node.floor;
    GameRegistry.pendingNodeId = node.id;

    if (node.type === 'rest') {
      this.scene.start('Rest');
      return;
    }
    if (node.type === 'treasure') {
      this.scene.start('Reward', { treasure: true });
      return;
    }
    if (node.type === 'shop') {
      this.scene.start('Shop');
      return;
    }

    GameRegistry.combat = startCombat(run, node.enemyIds);
    this.scene.start('Combat');
  }
}
