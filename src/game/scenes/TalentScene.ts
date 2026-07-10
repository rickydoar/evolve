import Phaser from 'phaser';
import {
  allocateTalent,
  canAllocateTalent,
  getTalentNodeState,
  getTalentRank,
  POINTS_PER_TIER,
  TALENT_TREE_BLURBS,
  TALENT_TREE_COLORS,
  TALENT_TREE_LABELS,
  TALENTS,
  TALENTS_BY_TREE,
  talentTreesForRun,
  talentUnlockHint,
  treePointsSpent,
} from '../data/talents';
import type { TalentDef, TalentTree } from '../data/types';
import { GAME_H, GAME_W, setupHiDpiCamera } from '../display';
import { GameRegistry } from '../GameRegistry';

const NODE_SIZE = 56;
const TIER_GAP_Y = 92;
const COL_GAP_X = 78;
const TREE_PANEL_W = 280;

export class TalentScene extends Phaser.Scene {
  private returnTo: string = 'Map';
  private tooltip?: Phaser.GameObjects.Container;

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
    this.tooltip = undefined;

    this.drawBackground(width, height);

    this.add
      .text(width / 2, 28, 'Talent Trees', {
        fontFamily: 'Georgia, serif',
        fontSize: '32px',
        color: '#f0e6d2',
      })
      .setOrigin(0.5);

    const pointsLabel =
      run.talentPoints === 0
        ? 'No talent points available'
        : `${run.talentPoints} talent point${run.talentPoints === 1 ? '' : 's'} to spend`;

    this.add
      .text(width / 2, 62, pointsLabel, {
        fontFamily: 'Georgia, serif',
        fontSize: '16px',
        color: run.talentPoints > 0 ? '#f0c75e' : '#8a9a8e',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 84, `Spend ${POINTS_PER_TIER} points in a tree to unlock the next tier`, {
        fontFamily: 'Georgia, serif',
        fontSize: '12px',
        color: '#6b7c72',
      })
      .setOrigin(0.5);

    const trees = talentTreesForRun(run.classId);
    const panelGap = 36;
    const totalW = trees.length * TREE_PANEL_W + (trees.length - 1) * panelGap;
    const startX = (width - totalW) / 2;

    trees.forEach((tree, i) => {
      this.drawTreePanel(tree, startX + i * (TREE_PANEL_W + panelGap), 104);
    });

    const done = this.add
      .text(width / 2, height - 36, run.talentPoints > 0 ? 'Done' : 'Return', {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: '#1a1510',
        backgroundColor: '#c4a574',
        padding: { x: 28, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    done.on('pointerover', () => done.setStyle({ backgroundColor: '#d4b584' }));
    done.on('pointerout', () => done.setStyle({ backgroundColor: '#c4a574' }));
    done.on('pointerdown', () => this.scene.start(this.returnTo));
  }

  private drawBackground(width: number, height: number): void {
    const g = this.add.graphics();
    g.fillGradientStyle(0x0c100e, 0x0c100e, 0x151c18, 0x101612, 1);
    g.fillRect(0, 0, width, height);

    // Subtle vignette corners
    g.fillStyle(0x000000, 0.25);
    g.fillRect(0, 0, width, 18);
    g.fillRect(0, height - 18, width, 18);

    // Soft horizontal rule under title
    g.lineStyle(1, 0x3d4a40, 0.5);
    g.lineBetween(width * 0.2, 96, width * 0.8, 96);
  }

  private drawTreePanel(tree: TalentTree, x: number, y: number): void {
    const run = GameRegistry.run!;
    const color = TALENT_TREE_COLORS[tree];
    const hex = `#${color.toString(16).padStart(6, '0')}`;
    const spent = treePointsSpent(run.talents, tree);
    const talents = TALENTS_BY_TREE[tree];
    const maxTier = Math.max(...talents.map((t) => t.tier));
    const panelH = 88 + (maxTier + 1) * TIER_GAP_Y + 28;

    const g = this.add.graphics();

    // Panel body
    g.fillStyle(0x0e1612, 0.92);
    g.fillRoundedRect(x, y, TREE_PANEL_W, panelH, 10);
    g.lineStyle(2, color, 0.55);
    g.strokeRoundedRect(x, y, TREE_PANEL_W, panelH, 10);

    // Header bar
    g.fillStyle(color, 0.18);
    g.fillRect(x + 2, y + 2, TREE_PANEL_W - 4, 58);

    this.add
      .text(x + TREE_PANEL_W / 2, y + 16, TALENT_TREE_LABELS[tree], {
        fontFamily: 'Georgia, serif',
        fontSize: '20px',
        color: hex,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(x + TREE_PANEL_W / 2, y + 38, TALENT_TREE_BLURBS[tree], {
        fontFamily: 'Georgia, serif',
        fontSize: '11px',
        color: '#8a9a8e',
      })
      .setOrigin(0.5);

    this.add
      .text(x + TREE_PANEL_W / 2, y + 54, `${spent} / ${this.treeMaxRanks(tree)} points`, {
        fontFamily: 'Georgia, serif',
        fontSize: '11px',
        color: spent > 0 ? '#f0c75e' : '#5a6a60',
      })
      .setOrigin(0.5);

    // Tier unlock markers + connector lines, then nodes
    const treeOriginX = x + TREE_PANEL_W / 2;
    const treeOriginY = y + 88;

    // Draw connectors first (behind nodes)
    this.drawConnectors(tree, treeOriginX, treeOriginY, color);

    // Tier labels on the left edge of the panel
    for (let tier = 0; tier <= maxTier; tier++) {
      const ty = treeOriginY + tier * TIER_GAP_Y;
      const unlocked = spent >= tier * POINTS_PER_TIER;
      const need = tier * POINTS_PER_TIER;

      // Dim horizontal guide
      g.lineStyle(1, unlocked ? color : 0x2a3530, unlocked ? 0.2 : 0.12);
      g.lineBetween(x + 28, ty, x + TREE_PANEL_W - 16, ty);

      this.add
        .text(x + 10, ty, tier === 0 ? 'I' : need.toString(), {
          fontFamily: 'Georgia, serif',
          fontSize: '10px',
          color: unlocked ? hex : '#3d4a40',
        })
        .setOrigin(0.5);
    }

    talents.forEach((talent) => {
      const pos = this.nodePosition(talent, treeOriginX, treeOriginY);
      this.drawTalentNode(talent, pos.x, pos.y, color);
    });
  }

  private treeMaxRanks(tree: TalentTree): number {
    return TALENTS_BY_TREE[tree].reduce((sum, t) => sum + t.maxRanks, 0);
  }

  private nodePosition(
    talent: TalentDef,
    originX: number,
    originY: number,
  ): { x: number; y: number } {
    const colOffset = (talent.column - 1) * COL_GAP_X;
    return {
      x: originX + colOffset,
      y: originY + talent.tier * TIER_GAP_Y,
    };
  }

  private drawConnectors(
    tree: TalentTree,
    originX: number,
    originY: number,
    treeColor: number,
  ): void {
    const run = GameRegistry.run!;
    const g = this.add.graphics();
    const talents = TALENTS_BY_TREE[tree];

    for (const talent of talents) {
      if (!talent.requires) continue;
      const parent = TALENTS[talent.requires];
      if (!parent || parent.tree !== tree) continue;

      const from = this.nodePosition(parent, originX, originY);
      const to = this.nodePosition(talent, originX, originY);
      const parentRank = getTalentRank(run.talents, parent.id);
      const childRank = getTalentRank(run.talents, talent.id);
      const lit = parentRank > 0;
      const fullyLit = lit && childRank > 0;

      const lineColor = fullyLit ? 0xf0c75e : lit ? treeColor : 0x2a3530;
      const alpha = fullyLit ? 0.9 : lit ? 0.55 : 0.25;
      const thickness = fullyLit ? 3 : lit ? 2 : 1.5;

      g.lineStyle(thickness, lineColor, alpha);

      // Elbow connector: down from parent, then horizontal, then into child
      const midY = (from.y + to.y) / 2;
      g.beginPath();
      g.moveTo(from.x, from.y + NODE_SIZE / 2 - 4);
      g.lineTo(from.x, midY);
      g.lineTo(to.x, midY);
      g.lineTo(to.x, to.y - NODE_SIZE / 2 + 4);
      g.strokePath();
    }
  }

  private drawTalentNode(
    talent: TalentDef,
    x: number,
    y: number,
    treeColor: number,
  ): void {
    const run = GameRegistry.run!;
    const rank = getTalentRank(run.talents, talent.id);
    const state = getTalentNodeState(run.talents, run.talentPoints, talent.id);
    const canSpend = canAllocateTalent(run.talents, run.talentPoints, talent.id);
    const isCapstone = talent.tier === 3;

    const g = this.add.graphics();
    const half = NODE_SIZE / 2;

    // Outer glow for available / invested
    if (state === 'available' || state === 'partial' || state === 'maxed') {
      g.fillStyle(state === 'maxed' ? 0xf0c75e : treeColor, state === 'available' ? 0.22 : 0.15);
      if (isCapstone) {
        g.fillCircle(x, y, half + 6);
      } else {
        g.fillRoundedRect(x - half - 4, y - half - 4, NODE_SIZE + 8, NODE_SIZE + 8, 8);
      }
    }

    // Node body
    let fill = 0x1a221c;
    let stroke = 0x3d4a40;
    let strokeW = 2;
    let glyphColor = '#5a6a60';

    if (state === 'maxed') {
      fill = 0x2a2410;
      stroke = 0xf0c75e;
      strokeW = 3;
      glyphColor = '#f0c75e';
    } else if (state === 'partial') {
      fill = 0x1c2818;
      stroke = treeColor;
      strokeW = 2;
      glyphColor = '#e8f0e8';
    } else if (state === 'available') {
      fill = 0x18241c;
      stroke = treeColor;
      strokeW = 2;
      glyphColor = '#d4e0d4';
    } else {
      fill = 0x121816;
      stroke = 0x2a3530;
      strokeW = 1;
      glyphColor = '#3d4a40';
    }

    g.fillStyle(fill, 1);
    g.lineStyle(strokeW, stroke, 1);
    if (isCapstone) {
      g.fillCircle(x, y, half);
      g.strokeCircle(x, y, half);
    } else {
      g.fillRoundedRect(x - half, y - half, NODE_SIZE, NODE_SIZE, 6);
      g.strokeRoundedRect(x - half, y - half, NODE_SIZE, NODE_SIZE, 6);
    }

    // Hit target
    const hit = this.add
      .rectangle(x, y, NODE_SIZE + 8, NODE_SIZE + 8, 0x000000, 0.001)
      .setInteractive({ useHandCursor: canSpend });

    this.add
      .text(x, y - 2, talent.glyph, {
        fontFamily: 'Georgia, serif',
        fontSize: isCapstone ? '16px' : '15px',
        color: glyphColor,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Rank pip under node
    this.add
      .text(x, y + half + 10, `${rank}/${talent.maxRanks}`, {
        fontFamily: 'Georgia, serif',
        fontSize: '11px',
        color: rank > 0 ? '#f0c75e' : state === 'available' ? '#8a9a8e' : '#3d4a40',
      })
      .setOrigin(0.5);

    hit.on('pointerover', () => {
      this.showTooltip(talent, x, y - half - 8);
      if (canSpend) {
        g.clear();
        g.fillStyle(treeColor, 0.3);
        if (isCapstone) g.fillCircle(x, y, half + 6);
        else g.fillRoundedRect(x - half - 4, y - half - 4, NODE_SIZE + 8, NODE_SIZE + 8, 8);
        g.fillStyle(fill, 1);
        g.lineStyle(3, 0xf0c75e, 1);
        if (isCapstone) {
          g.fillCircle(x, y, half);
          g.strokeCircle(x, y, half);
        } else {
          g.fillRoundedRect(x - half, y - half, NODE_SIZE, NODE_SIZE, 6);
          g.strokeRoundedRect(x - half, y - half, NODE_SIZE, NODE_SIZE, 6);
        }
      }
    });

    hit.on('pointerout', () => {
      this.hideTooltip();
      // Re-render is heavy; just redraw this node's graphics to base state
      g.clear();
      if (state === 'available' || state === 'partial' || state === 'maxed') {
        g.fillStyle(state === 'maxed' ? 0xf0c75e : treeColor, state === 'available' ? 0.22 : 0.15);
        if (isCapstone) g.fillCircle(x, y, half + 6);
        else g.fillRoundedRect(x - half - 4, y - half - 4, NODE_SIZE + 8, NODE_SIZE + 8, 8);
      }
      g.fillStyle(fill, 1);
      g.lineStyle(strokeW, stroke, 1);
      if (isCapstone) {
        g.fillCircle(x, y, half);
        g.strokeCircle(x, y, half);
      } else {
        g.fillRoundedRect(x - half, y - half, NODE_SIZE, NODE_SIZE, 6);
        g.strokeRoundedRect(x - half, y - half, NODE_SIZE, NODE_SIZE, 6);
      }
    });

    if (canSpend) {
      hit.on('pointerdown', () => this.spendPoint(talent.id));
    }
  }

  private showTooltip(talent: TalentDef, anchorX: number, anchorY: number): void {
    this.hideTooltip();
    const run = GameRegistry.run!;
    const rank = getTalentRank(run.talents, talent.id);
    const state = getTalentNodeState(run.talents, run.talentPoints, talent.id);
    const color = TALENT_TREE_COLORS[talent.tree];
    const hex = `#${color.toString(16).padStart(6, '0')}`;

    const tipW = 240;
    let body = talent.description;
    if (state === 'locked') {
      body += `\n\n${talentUnlockHint(run.talents, talent)}`;
    } else if (rank > 0 && rank < talent.maxRanks) {
      body += `\n\nNext rank: same bonus again`;
    }

    const container = this.add.container(0, 0);
    const title = this.add
      .text(0, 0, talent.name, {
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        color: hex,
        fontStyle: 'bold',
        wordWrap: { width: tipW - 20 },
      })
      .setOrigin(0, 0);

    const rankText = this.add
      .text(0, 20, `Rank ${rank}/${talent.maxRanks}`, {
        fontFamily: 'Georgia, serif',
        fontSize: '11px',
        color: '#f0c75e',
      })
      .setOrigin(0, 0);

    const desc = this.add
      .text(0, 38, body, {
        fontFamily: 'Georgia, serif',
        fontSize: '12px',
        color: '#c8d4c8',
        wordWrap: { width: tipW - 20, useAdvancedWrap: true },
        lineSpacing: 3,
      })
      .setOrigin(0, 0);

    const tipH = Math.max(70, 48 + desc.height);
    const bg = this.add.graphics();
    bg.fillStyle(0x0a100c, 0.96);
    bg.fillRoundedRect(-10, -10, tipW, tipH, 6);
    bg.lineStyle(1, color, 0.7);
    bg.strokeRoundedRect(-10, -10, tipW, tipH, 6);

    container.add([bg, title, rankText, desc]);

    // Position above node, clamp to screen
    let tipX = anchorX - tipW / 2 + 10;
    let tipY = anchorY - tipH - 12;
    tipX = Phaser.Math.Clamp(tipX, 12, GAME_W - tipW - 12);
    tipY = Math.max(8, tipY);
    container.setPosition(tipX, tipY);
    container.setDepth(1000);

    this.tooltip = container;
  }

  private hideTooltip(): void {
    this.tooltip?.destroy();
    this.tooltip = undefined;
  }

  private spendPoint(talentId: string): void {
    const run = GameRegistry.run!;
    if (!canAllocateTalent(run.talents, run.talentPoints, talentId)) return;
    run.talents = allocateTalent(run.talents, talentId);
    run.talentPoints -= 1;
    this.render();
  }
}
