import type Phaser from 'phaser';

/**
 * Create centered card body text that is guaranteed to stay inside a box.
 * Shrinks the font if needed, then clips with fixedWidth/fixedHeight.
 */
export function fitCardText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  content: string,
  maxWidth: number,
  maxHeight: number,
  opts: {
    color: string;
    fontSize?: number;
    minFontSize?: number;
    fontStyle?: string;
    lineSpacing?: number;
  },
): Phaser.GameObjects.Text {
  let fontSize = opts.fontSize ?? 11;
  const minFontSize = opts.minFontSize ?? 9;
  const lineSpacing = opts.lineSpacing ?? 2;

  let text: Phaser.GameObjects.Text | null = null;

  while (true) {
    text?.destroy();
    text = scene.add
      .text(x, y, content, {
        fontFamily: 'Georgia, serif',
        fontSize: `${fontSize}px`,
        color: opts.color,
        fontStyle: opts.fontStyle,
        wordWrap: { width: maxWidth, useAdvancedWrap: true },
        align: 'center',
        lineSpacing,
      })
      .setOrigin(0.5, 0);

    if (text.height <= maxHeight || fontSize <= minFontSize) break;
    fontSize -= 1;
  }

  // Hard clip so nothing can paint past the card edge
  text!.setFixedSize(maxWidth, maxHeight);
  return text!;
}
