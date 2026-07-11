import type Phaser from 'phaser';
import { getItem } from '../data/items';
import { itemArtKey } from './itemArt';

const RARITY_STROKE: Record<string, number> = {
  common: 0x94a3b8,
  rare: 0x38bdf8,
  epic: 0xc084fc,
};

export interface OwnedItemsBarOptions {
  x: number;
  y: number;
  /** Max icons before wrapping / truncating label. */
  iconSize?: number;
  gap?: number;
  /** Anchor: left of first icon. */
  originX?: number;
  showEmptyLabel?: boolean;
  depth?: number;
}

/**
 * Draw owned item icons in a horizontal strip with hover tooltips.
 * Returns the container (caller may destroy on refresh).
 */
export function drawOwnedItemsBar(
  scene: Phaser.Scene,
  itemIds: string[],
  opts: OwnedItemsBarOptions,
): Phaser.GameObjects.Container {
  const iconSize = opts.iconSize ?? 44;
  const gap = opts.gap ?? 8;
  const depth = opts.depth ?? 50;
  const root = scene.add.container(opts.x, opts.y).setDepth(depth);

  if (!itemIds.length) {
    if (opts.showEmptyLabel !== false) {
      root.add(
        scene.add
          .text(0, 0, 'No items', {
            fontFamily: 'Georgia, serif',
            fontSize: '13px',
            color: '#64748b',
          })
          .setOrigin(opts.originX ?? 0, 0.5),
      );
    }
    return root;
  }

  const tooltip = scene.add
    .text(0, -iconSize / 2 - 10, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      color: '#e8f5e9',
      backgroundColor: '#0b1210',
      padding: { x: 10, y: 6 },
      wordWrap: { width: 280 },
      align: 'center',
    })
    .setOrigin(0.5, 1)
    .setDepth(depth + 2)
    .setVisible(false);
  root.add(tooltip);

  itemIds.forEach((id, i) => {
    const def = getItem(id);
    if (!def) return;
    const x = i * (iconSize + gap);
    const key = itemArtKey(id);
    const stroke = RARITY_STROKE[def.rarity] ?? 0x94a3b8;

    const frame = scene.add.rectangle(x, 0, iconSize + 4, iconSize + 4, 0x0b1210, 0.85);
    frame.setStrokeStyle(2, stroke);
    root.add(frame);

    if (scene.textures.exists(key)) {
      root.add(scene.add.image(x, 0, key).setDisplaySize(iconSize, iconSize));
    } else {
      root.add(scene.add.circle(x, 0, iconSize / 2 - 2, stroke, 0.8));
    }

    const hit = scene.add
      .rectangle(x, 0, iconSize + 4, iconSize + 4, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    root.add(hit);

    hit.on('pointerover', () => {
      frame.setStrokeStyle(3, 0x4ade80);
      tooltip.setText(`${def.name}\n${def.description}`);
      tooltip.setPosition(x, -iconSize / 2 - 8);
      tooltip.setVisible(true);
    });
    hit.on('pointerout', () => {
      frame.setStrokeStyle(2, stroke);
      tooltip.setVisible(false);
    });
  });

  return root;
}
