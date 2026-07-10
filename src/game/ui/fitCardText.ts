import type Phaser from 'phaser';

/**
 * Create centered card body text that is guaranteed to stay inside a box.
 * Shrinks the font if needed, then clips with fixedWidth/fixedHeight.
 * The returned text's height matches the visible content (capped at maxHeight),
 * so callers can stack labels below it without overlap.
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

  // Clip to the box, but size to content so stacked layout can use .height
  const contentHeight = Math.min(text!.height, maxHeight);
  text!.setFixedSize(maxWidth, Math.ceil(contentHeight));
  return text!;
}
