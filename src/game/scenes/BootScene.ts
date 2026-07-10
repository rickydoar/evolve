import Phaser from 'phaser';
import { GAME_H, GAME_W, setupHiDpiCamera } from '../display';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    setupHiDpiCamera(this);
    const width = GAME_W;
    const height = GAME_H;
    const barBg = this.add.rectangle(width / 2, height / 2, 320, 24, 0x1a2e24);
    const bar = this.add.rectangle(width / 2 - 158, height / 2, 4, 16, 0x4ade80).setOrigin(0, 0.5);
    this.add
      .text(width / 2, height / 2 - 40, 'Awakening the Grove...', {
        fontFamily: 'Georgia, serif',
        fontSize: '22px',
        color: '#a8e6cf',
      })
      .setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      bar.width = 4 + 312 * value;
    });
    this.load.on('complete', () => {
      barBg.destroy();
      bar.destroy();
    });

    // Cards
    this.load.image('card-barkskin', '/assets/cards/barkskin.png');
    this.load.image('card-swipe', '/assets/cards/swipe.png');
    this.load.image('card-claw', '/assets/cards/claw.png');
    this.load.image('card-rip', '/assets/cards/rip.png');
    this.load.image('card-starfire', '/assets/cards/starfire.png');
    this.load.image('card-hurricane', '/assets/cards/hurricane.png');
    this.load.image('card-starsurge', '/assets/cards/starsurge.png');
    this.load.image('card-decurse', '/assets/cards/decurse.png');
    this.load.image('card-rejuvenation', '/assets/cards/rejuvenation.png');
    this.load.image('card-healing-touch', '/assets/cards/healing-touch.png');
    this.load.image('card-thrash', '/assets/cards/thrash.png');
    this.load.image('card-mangle', '/assets/cards/mangle.png');
    this.load.image('card-ironfur', '/assets/cards/ironfur.png');
    this.load.image('card-survival-instincts', '/assets/cards/survival-instincts.png');
    this.load.image('card-rake', '/assets/cards/rake.png');
    this.load.image('card-ferocious-bite', '/assets/cards/ferocious-bite.png');
    this.load.image('card-tigers-fury', '/assets/cards/tigers-fury.png');
    this.load.image('card-predatory-strike', '/assets/cards/predatory-strike.png');
    this.load.image('card-sunfire', '/assets/cards/sunfire.png');
    this.load.image('card-starfall', '/assets/cards/starfall.png');
    this.load.image('card-celestial-alignment', '/assets/cards/celestial-alignment.png');
    this.load.image('card-incarnation', '/assets/cards/incarnation.png');
    this.load.image('card-swiftmend', '/assets/cards/swiftmend.png');
    this.load.image('card-lifebloom', '/assets/cards/lifebloom.png');
    this.load.image('card-ironbark', '/assets/cards/ironbark.png');
    this.load.image('card-tranquility', '/assets/cards/tranquility.png');
    this.load.image('card-innervate', '/assets/cards/innervate.png');

    // Priest cards
    this.load.image('card-smite', '/assets/cards/smite.png');
    this.load.image('card-penance', '/assets/cards/penance.png');
    this.load.image('card-power-word-shield', '/assets/cards/power-word-shield.png');
    this.load.image('card-power-word-radiance', '/assets/cards/power-word-radiance.png');
    this.load.image('card-pain-suppression', '/assets/cards/pain-suppression.png');
    this.load.image('card-power-infusion', '/assets/cards/power-infusion.png');
    this.load.image('card-archangel', '/assets/cards/archangel.png');
    this.load.image('card-mind-blast', '/assets/cards/mind-blast.png');
    this.load.image('card-shadow-word-pain', '/assets/cards/shadow-word-pain.png');
    this.load.image('card-mind-flay', '/assets/cards/mind-flay.png');
    this.load.image('card-vampiric-touch', '/assets/cards/vampiric-touch.png');
    this.load.image('card-shadow-word-death', '/assets/cards/shadow-word-death.png');
    this.load.image('card-psychic-scream', '/assets/cards/psychic-scream.png');
    this.load.image('card-void-eruption', '/assets/cards/void-eruption.png');
    this.load.image('card-shadowfiend', '/assets/cards/shadowfiend.png');
    this.load.image('card-dispersion', '/assets/cards/dispersion.png');
    this.load.image('card-flash-heal', '/assets/cards/flash-heal.png');
    this.load.image('card-renew', '/assets/cards/renew.png');
    this.load.image('card-holy-fire', '/assets/cards/holy-fire.png');
    this.load.image('card-holy-nova', '/assets/cards/holy-nova.png');
    this.load.image('card-prayer-of-healing', '/assets/cards/prayer-of-healing.png');
    this.load.image('card-holy-word-serenity', '/assets/cards/holy-word-serenity.png');
    this.load.image('card-guardian-spirit', '/assets/cards/guardian-spirit.png');
    this.load.image('card-divine-hymn', '/assets/cards/divine-hymn.png');
    this.load.image('card-purify', '/assets/cards/purify.png');

    // Hero & enemies
    this.load.image('hero-druid', '/assets/hero/hero-druid.png');
    this.load.image('hero-priest', '/assets/hero/hero-priest.png');
    this.load.image('enemy-wolf', '/assets/enemies/enemy-wolf.png');
    this.load.image('enemy-spider', '/assets/enemies/enemy-spider.png');
    this.load.image('enemy-treant', '/assets/enemies/enemy-treant.png');
    this.load.image('enemy-harpy', '/assets/enemies/enemy-harpy.png');
    this.load.image('enemy-bog', '/assets/enemies/enemy-bog.png');
    this.load.image('enemy-boss', '/assets/enemies/enemy-boss.png');

    // UI
    this.load.image('bg-forest', '/assets/ui/bg-forest.png');
    this.load.image('map-combat', '/assets/ui/map-combat.png');
    this.load.image('map-elite', '/assets/ui/map-elite.png');
    this.load.image('map-rest', '/assets/ui/map-rest.png');
    this.load.image('map-treasure', '/assets/ui/map-treasure.png');
    this.load.image('map-boss', '/assets/ui/map-boss.png');
  }

  create(): void {
    this.createShopIcon();
    this.createProceduralEnemyArt();
    this.scene.start('Title');
  }

  /** Procedural shop pouch icon (no dedicated asset yet). */
  private createShopIcon(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xfbbf24, 1);
    g.fillRoundedRect(8, 14, 48, 40, 8);
    g.fillStyle(0xd97706, 1);
    g.fillRect(20, 8, 24, 10);
    g.lineStyle(3, 0x92400e, 1);
    g.strokeRoundedRect(8, 14, 48, 40, 8);
    g.fillStyle(0xfef3c7, 1);
    g.fillCircle(32, 34, 8);
    g.generateTexture('map-shop', 64, 64);
    g.destroy();
  }

  /** Distinct silhouettes for late-game enemies that lack painted assets. */
  private createProceduralEnemyArt(): void {
    // Grove Wisp — pale teal orb with a soft glow ring
    {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x0f766e, 0.35);
      g.fillCircle(64, 64, 58);
      g.fillStyle(0x5eead4, 1);
      g.fillCircle(64, 64, 36);
      g.fillStyle(0xccfbf1, 1);
      g.fillCircle(52, 52, 12);
      g.lineStyle(3, 0x99f6e4, 0.9);
      g.strokeCircle(64, 64, 44);
      g.generateTexture('enemy-wisp', 128, 128);
      g.destroy();
    }
    // Blight Stag — antlered silhouette in sickly green
    {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x365314, 1);
      g.fillEllipse(64, 78, 70, 50);
      g.fillStyle(0x4d7c0f, 1);
      g.fillCircle(64, 48, 28);
      g.lineStyle(5, 0xa3e635, 1);
      g.lineBetween(48, 28, 28, 8);
      g.lineBetween(28, 8, 20, 18);
      g.lineBetween(80, 28, 100, 8);
      g.lineBetween(100, 8, 108, 18);
      g.fillStyle(0x14532d, 1);
      g.fillTriangle(40, 100, 55, 100, 40, 120);
      g.fillTriangle(88, 100, 73, 100, 88, 120);
      g.fillStyle(0x86efac, 1);
      g.fillCircle(54, 44, 4);
      g.fillCircle(74, 44, 4);
      g.generateTexture('enemy-stag', 128, 128);
      g.destroy();
    }
    // Mycelium Queen — layered mushroom cap
    {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x7c2d12, 1);
      g.fillEllipse(64, 88, 36, 50);
      g.fillStyle(0xb45309, 1);
      g.fillEllipse(64, 52, 90, 48);
      g.fillStyle(0xfde68a, 1);
      g.fillCircle(40, 48, 6);
      g.fillCircle(64, 40, 5);
      g.fillCircle(88, 50, 7);
      g.fillStyle(0x78350f, 1);
      g.fillEllipse(64, 72, 40, 14);
      g.generateTexture('enemy-mycelium', 128, 128);
      g.destroy();
    }
    // Thorn Colossus — bulky spiked form
    {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x3f6212, 1);
      g.fillRoundedRect(28, 40, 72, 70, 12);
      g.fillStyle(0x65a30d, 1);
      g.fillTriangle(40, 40, 64, 4, 88, 40);
      g.fillTriangle(20, 60, 28, 40, 36, 70);
      g.fillTriangle(108, 60, 100, 40, 92, 70);
      g.fillStyle(0xa3e635, 1);
      g.fillTriangle(50, 55, 58, 30, 66, 55);
      g.fillTriangle(70, 70, 78, 42, 86, 70);
      g.fillStyle(0x14532d, 1);
      g.fillCircle(50, 72, 5);
      g.fillCircle(78, 72, 5);
      g.generateTexture('enemy-colossus', 128, 128);
      g.destroy();
    }
  }
}
