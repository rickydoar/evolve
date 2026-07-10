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

    // Hero & enemies
    this.load.image('hero-druid', '/assets/hero/hero-druid.png');
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
}
