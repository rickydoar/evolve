import Phaser from 'phaser';
import { CARDS, FORM_COLORS, FORM_LABELS, RARITY_COLORS } from '../data/cards';
import { getItem } from '../data/items';
import { cardDisplayName } from '../data/cardInstance';
import { getCardInstanceDescription } from '../data/cardText';
import { GAME_H, GAME_W, setupHiDpiCamera } from '../display';
import { GameRegistry } from '../GameRegistry';
import { fitCardText } from '../ui/fitCardText';
import { itemArtKey } from '../ui/itemArt';

/**
 * Overlay: browse deck composition and owned items.
 * Prefer launching via `openDeckView(scene)` so the caller is paused (keeps shop/combat state).
 */
export class DeckViewScene extends Phaser.Scene {
  private returnTo: string = 'Map';

  constructor() {
    super('DeckView');
  }

  init(data: { returnTo?: string }): void {
    this.returnTo = data.returnTo ?? 'Map';
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

    const g = this.add.graphics();
    g.fillStyle(0x0b1210, 0.94);
    g.fillRect(0, 0, width, height);

    this.add
      .text(width / 2, 36, 'Deck & Items', {
        fontFamily: 'Georgia, serif',
        fontSize: '32px',
        color: '#e8f5e9',
      })
      .setOrigin(0.5);

    const back = this.add
      .text(40, 40, '← Back', {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: '#86efac',
        backgroundColor: '#1a2e24',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.close());

    this.input.keyboard?.on('keydown-ESC', () => this.close());

    // ── Items ──────────────────────────────────────────────
    this.add.text(40, 84, `Items (${run.items.length})`, {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
      color: '#fde68a',
    });

    if (!run.items.length) {
      this.add.text(40, 118, 'No relics yet — defeat elites to find them.', {
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        color: '#64748b',
      });
    } else {
      const itemCols = Math.min(run.items.length, 10);
      const itemSize = 56;
      const itemGap = 10;
      run.items.forEach((id, i) => {
        const def = getItem(id);
        if (!def) return;
        const col = i % itemCols;
        const row = Math.floor(i / itemCols);
        const x = 40 + col * (itemSize + itemGap) + itemSize / 2;
        const y = 130 + row * (itemSize + 36);

        const key = itemArtKey(id);
        if (this.textures.exists(key)) {
          this.add.image(x, y, key).setDisplaySize(itemSize, itemSize);
        } else {
          this.add.circle(x, y, itemSize / 2, 0x334155);
        }

        this.add
          .text(x, y + itemSize / 2 + 4, def.name, {
            fontFamily: 'Georgia, serif',
            fontSize: '11px',
            color: '#cbd5e1',
            wordWrap: { width: itemSize + 8 },
            align: 'center',
          })
          .setOrigin(0.5, 0);

        const hit = this.add
          .rectangle(x, y, itemSize, itemSize, 0xffffff, 0.001)
          .setInteractive({ useHandCursor: true });
        const tip = this.add
          .text(x, y - itemSize / 2 - 8, `${def.name}\n${def.description}`, {
            fontFamily: 'Georgia, serif',
            fontSize: '12px',
            color: '#e8f5e9',
            backgroundColor: '#0b1210',
            padding: { x: 8, y: 5 },
            wordWrap: { width: 260 },
            align: 'center',
          })
          .setOrigin(0.5, 1)
          .setDepth(20)
          .setVisible(false);
        hit.on('pointerover', () => tip.setVisible(true));
        hit.on('pointerout', () => tip.setVisible(false));
      });
    }

    // ── Deck ───────────────────────────────────────────────
    const itemRows = Math.max(1, Math.ceil(Math.max(run.items.length, 1) / 10));
    const deckTop = run.items.length ? 130 + itemRows * 92 + 24 : 160;

    const counts = new Map<string, { defId: string; upgrade: number; count: number }>();
    for (const inst of run.deck) {
      const key = `${inst.defId}#${inst.upgrade}`;
      const prev = counts.get(key);
      if (prev) prev.count += 1;
      else counts.set(key, { defId: inst.defId, upgrade: inst.upgrade, count: 1 });
    }
    const unique = [...counts.values()].sort((a, b) => {
      const ca = CARDS[a.defId];
      const cb = CARDS[b.defId];
      if (!ca || !cb) return a.defId.localeCompare(b.defId);
      if (ca.form !== cb.form) return ca.form.localeCompare(cb.form);
      if (ca.name !== cb.name) return ca.name.localeCompare(cb.name);
      return a.upgrade - b.upgrade;
    });

    this.add.text(40, deckTop, `Deck (${run.deck.length} cards)`, {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
      color: '#7dd3fc',
    });

    const cols = 7;
    const CARD_W = 150;
    const CARD_H = 200;
    const gapX = 14;
    const gapY = 16;
    const startY = deckTop + 50;

    const rows = Math.ceil(unique.length / cols);
    const availH = height - startY - 30;
    const scale =
      rows * (CARD_H + gapY) > availH
        ? Math.max(0.55, availH / (rows * (CARD_H + gapY)))
        : 1;
    const cw = CARD_W * scale;
    const ch = CARD_H * scale;
    const gx = gapX * scale;
    const gy = gapY * scale;
    const tw = cols * cw + (cols - 1) * gx;
    const sx = width / 2 - tw / 2 + cw / 2;

    unique.forEach((entry, index) => {
      const card = CARDS[entry.defId];
      if (!card) return;
      const count = entry.count ?? 1;
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = sx + col * (cw + gx);
      const y = startY + row * (ch + gy);
      if (y > height - 40) return;

      const formColor = FORM_COLORS[card.form];
      const container = this.add.container(x, y);

      const frame = this.add.rectangle(0, 0, cw, ch, 0x0f1a14, 0.95);
      frame.setStrokeStyle(2, formColor);
      container.add(frame);

      if (this.textures.exists(card.art) && scale > 0.7) {
        container.add(
          this.add.image(0, -ch * 0.22, card.art).setDisplaySize(cw * 0.78, ch * 0.36),
        );
      }

      container.add(
        this.add.circle(-cw / 2 + 14 * scale, -ch / 2 + 14 * scale, 12 * scale, 0x1d4ed8),
      );
      container.add(
        this.add
          .text(-cw / 2 + 14 * scale, -ch / 2 + 14 * scale, String(card.cost), {
            fontFamily: 'Georgia, serif',
            fontSize: `${Math.round(14 * scale)}px`,
            color: '#fff',
            fontStyle: 'bold',
          })
          .setOrigin(0.5),
      );

      if (count > 1) {
        container.add(
          this.add
            .text(cw / 2 - 8, -ch / 2 + 8, `×${count}`, {
              fontFamily: 'Georgia, serif',
              fontSize: `${Math.round(14 * scale)}px`,
              color: '#fbbf24',
              fontStyle: 'bold',
            })
            .setOrigin(1, 0),
        );
      }

      const nameY = scale > 0.7 ? ch * 0.08 : -ch * 0.28;
      container.add(
        fitCardText(this, 0, nameY, cardDisplayName({ defId: entry.defId, upgrade: entry.upgrade }, card), cw - 12, 32 * scale, {
          color: '#e8f5e9',
          fontSize: Math.round(13 * scale),
          minFontSize: 9,
          fontStyle: 'bold',
          lineSpacing: 0,
        }),
      );

      container.add(
        this.add
          .text(0, nameY + 28 * scale, `${FORM_LABELS[card.form]} · ${card.rarity}`, {
            fontFamily: 'Georgia, serif',
            fontSize: `${Math.round(10 * scale)}px`,
            color: RARITY_COLORS[card.rarity],
          })
          .setOrigin(0.5, 0),
      );

      container.add(
        fitCardText(
          this,
          0,
          nameY + 44 * scale,
          getCardInstanceDescription({ defId: entry.defId, upgrade: entry.upgrade }),
          cw - 14,
          ch * 0.32,
          {
            color: '#cbd5e1',
            fontSize: Math.round(11 * scale),
            minFontSize: 8,
            lineSpacing: 1,
          },
        ),
      );
    });
  }

  private close(): void {
    const returnTo = this.returnTo;
    this.scene.stop();
    if (this.scene.isPaused(returnTo)) {
      this.scene.resume(returnTo);
    } else if (!this.scene.isActive(returnTo)) {
      this.scene.start(returnTo);
    }
  }
}

/** Pause the current scene and open the deck/items overlay. */
export function openDeckView(from: Phaser.Scene): void {
  const key = from.scene.key;
  from.scene.pause();
  from.scene.launch('DeckView', { returnTo: key });
}
