import Phaser from 'phaser';
import {
  allocateTalent,
  canAllocateTalent,
  getTalentRank,
  TALENT_TREE_BLURBS,
  TALENT_TREE_COLORS,
  TALENT_TREE_LABELS,
  TALENT_TREES,
  TALENTS_BY_TREE,
} from '../data/talents';
import type { TalentDef, TalentTree } from '../data/types';
import { GAME_H, GAME_W, setupHiDpiCamera } from '../display';
import { GameRegistry } from '../GameRegistry';

export class TalentScene extends Phaser.Scene {
  private returnTo: string = 'Map';

  constructor() {
    super('Talent');
  }

  create(data: { returnTo?: string }): void {
    const run = GameRegistry.run;
    if (!run) {
      this.scene.start('Title');
      return;
    }

    this.returnTo = data.returnTo ?? 'Map';
    setupHiDpiCamera(this);
    this.render();
  }

  private render(): void {
    const run = GameRegistry.run!;
    const width = GAME_W;
    const height = GAME_H;

    this.children.removeAll();

    const g = this.add.graphics();
    g.fillGradientStyle(0x0b1210, 0x0b1210, 0x14201c, 0x0f1814, 1);
    g.fillRect(0, 0, width, height);

    this.add
      .text(width / 2, 36, 'Talent Tree', {
        fontFamily: 'Georgia, serif',
        fontSize: '36px',
        color: '#e8f5e9',
      })
      .setOrigin(0.5);

    const pointsLabel =
      run.talentPoints === 0
        ? 'No talent points available'
        : `${run.talentPoints} talent point${run.talentPoints === 1 ? '' : 's'} to spend`;

    this.add
      .text(width / 2, 78, pointsLabel, {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: run.talentPoints > 0 ? '#fbbf24' : '#94a3b8',
      })
      .setOrigin(0.5);

    const colWidth = 380;
    const startX = width / 2 - colWidth;
    const colTop = 120;

    TALENT_TREES.forEach((tree, col) => {
      this.drawTreeColumn(tree, startX + col * colWidth, colTop, colWidth - 24);
    });

    const done = this.add
      .text(width / 2, height - 40, run.talentPoints > 0 ? 'Done' : 'Return', {
        fontFamily: 'Georgia, serif',
        fontSize: '20px',
        color: '#0b1210',
        backgroundColor: '#a8e6cf',
        padding: { x: 28, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    done.on('pointerdown', () => this.scene.start(this.returnTo));
  }

  private drawTreeColumn(
    tree: TalentTree,
    x: number,
    y: number,
    width: number,
  ): void {
    const run = GameRegistry.run!;
    const color = TALENT_TREE_COLORS[tree];
    const hex = `#${color.toString(16).padStart(6, '0')}`;

    this.add
      .text(x + width / 2, y, TALENT_TREE_LABELS[tree], {
        fontFamily: 'Georgia, serif',
        fontSize: '22px',
        color: hex,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(x + width / 2, y + 28, TALENT_TREE_BLURBS[tree], {
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    const talents = TALENTS_BY_TREE[tree];
    talents.forEach((talent, i) => {
      this.drawTalentNode(talent, x, y + 52 + i * 88, width, color);
    });

    // Spent ranks in this tree
    const spent = talents.reduce(
      (sum, t) => sum + getTalentRank(run.talents, t.id),
      0,
    );
    this.add
      .text(x + width / 2, y + 52 + talents.length * 88 + 4, `${spent} ranks`, {
        fontFamily: 'Georgia, serif',
        fontSize: '12px',
        color: '#64748b',
      })
      .setOrigin(0.5);
  }

  private drawTalentNode(
    talent: TalentDef,
    x: number,
    y: number,
    width: number,
    treeColor: number,
  ): void {
    const run = GameRegistry.run!;
    const rank = getTalentRank(run.talents, talent.id);
    const canSpend = canAllocateTalent(run.talents, run.talentPoints, talent.id);
    const maxed = rank >= talent.maxRanks;

    const frame = this.add.rectangle(x + width / 2, y + 32, width, 78, 0x0f1a14, 0.92);
    const strokeColor = maxed ? 0xfbbf24 : canSpend ? treeColor : 0x334155;
    frame.setStrokeStyle(canSpend ? 2 : 1, strokeColor);

    if (canSpend) {
      frame.setInteractive({ useHandCursor: true });
      frame.on('pointerover', () => frame.setStrokeStyle(3, 0xfbbf24));
      frame.on('pointerout', () => frame.setStrokeStyle(2, treeColor));
      frame.on('pointerdown', () => this.spendPoint(talent.id));
    }

    this.add
      .text(x + 14, y + 8, talent.name, {
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        color: maxed ? '#fbbf24' : canSpend ? '#e8f5e9' : '#94a3b8',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0);

    this.add
      .text(x + width - 14, y + 8, `${rank}/${talent.maxRanks}`, {
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        color: rank > 0 ? '#fbbf24' : '#64748b',
      })
      .setOrigin(1, 0);

    this.add
      .text(x + 14, y + 30, talent.description, {
        fontFamily: 'Georgia, serif',
        fontSize: '12px',
        color: '#cbd5e1',
        wordWrap: { width: width - 28, useAdvancedWrap: true },
        lineSpacing: 2,
      })
      .setOrigin(0, 0);
  }

  private spendPoint(talentId: string): void {
    const run = GameRegistry.run!;
    if (!canAllocateTalent(run.talents, run.talentPoints, talentId)) return;
    run.talents = allocateTalent(run.talents, talentId);
    run.talentPoints -= 1;
    this.render();
  }
}
