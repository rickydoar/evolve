import Phaser from 'phaser';
import { GAME_H, GAME_W, setupHiDpiCamera } from '../display';
import { generateAllItemArt } from '../ui/itemArt';

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

    // Shaman cards
    this.load.image('card-lightning-bolt', '/assets/cards/lightning-bolt.png');
    this.load.image('card-earth-shock', '/assets/cards/earth-shock.png');
    this.load.image('card-flame-shock', '/assets/cards/flame-shock.png');
    this.load.image('card-lava-burst', '/assets/cards/lava-burst.png');
    this.load.image('card-chain-lightning', '/assets/cards/chain-lightning.png');
    this.load.image('card-thunderstorm', '/assets/cards/thunderstorm.png');
    this.load.image('card-searing-totem', '/assets/cards/searing-totem.png');
    this.load.image('card-totem-of-wrath', '/assets/cards/totem-of-wrath.png');
    this.load.image('card-elemental-blast', '/assets/cards/elemental-blast.png');
    this.load.image('card-stormstrike', '/assets/cards/stormstrike.png');
    this.load.image('card-lava-lash', '/assets/cards/lava-lash.png');
    this.load.image('card-frost-shock', '/assets/cards/frost-shock.png');
    this.load.image('card-windfury', '/assets/cards/windfury.png');
    this.load.image('card-crash-lightning', '/assets/cards/crash-lightning.png');
    this.load.image('card-feral-spirit', '/assets/cards/feral-spirit.png');
    this.load.image('card-strength-of-earth-totem', '/assets/cards/strength-of-earth-totem.png');
    this.load.image('card-windfury-totem', '/assets/cards/windfury-totem.png');
    this.load.image('card-ascendance', '/assets/cards/ascendance.png');
    this.load.image('card-healing-wave', '/assets/cards/healing-wave.png');
    this.load.image('card-riptide', '/assets/cards/riptide.png');
    this.load.image('card-healing-surge', '/assets/cards/healing-surge.png');
    this.load.image('card-chain-heal', '/assets/cards/chain-heal.png');
    this.load.image('card-spirit-link', '/assets/cards/spirit-link.png');
    this.load.image('card-purge', '/assets/cards/purge.png');
    this.load.image('card-healing-stream-totem', '/assets/cards/healing-stream-totem.png');
    this.load.image('card-stoneskin-totem', '/assets/cards/stoneskin-totem.png');
    this.load.image('card-grounding-totem', '/assets/cards/grounding-totem.png');
    this.load.image('card-mana-tide-totem', '/assets/cards/mana-tide-totem.png');

    // Hero & enemies
    this.load.image('hero-druid', '/assets/hero/hero-druid.png');
    this.load.image('hero-priest', '/assets/hero/hero-priest.png');
    this.load.image('hero-shaman', '/assets/hero/hero-shaman.png');
    this.load.image('enemy-wolf', '/assets/enemies/enemy-wolf.png');
    this.load.image('enemy-spider', '/assets/enemies/enemy-spider.png');
    this.load.image('enemy-treant', '/assets/enemies/enemy-treant.png');
    this.load.image('enemy-harpy', '/assets/enemies/enemy-harpy.png');
    this.load.image('enemy-bog', '/assets/enemies/enemy-bog.png');
    this.load.image('enemy-stag', '/assets/enemies/enemy-stag.png');
    this.load.image('enemy-colossus', '/assets/enemies/enemy-colossus.png');
    this.load.image('enemy-boss', '/assets/enemies/enemy-boss.png');

    // Barrens enemies
    this.load.image('enemy-razormane', '/assets/enemies/enemy-razormane.png');
    this.load.image('enemy-thunder-lizard', '/assets/enemies/enemy-thunder-lizard.png');
    this.load.image('enemy-raptor', '/assets/enemies/enemy-raptor.png');
    this.load.image('enemy-savannah', '/assets/enemies/enemy-savannah.png');
    this.load.image('enemy-kolkar', '/assets/enemies/enemy-kolkar.png');
    this.load.image('enemy-witchwing', '/assets/enemies/enemy-witchwing.png');
    this.load.image('enemy-scorpion', '/assets/enemies/enemy-scorpion.png');
    this.load.image('enemy-python', '/assets/enemies/enemy-python.png');
    this.load.image('enemy-kodo', '/assets/enemies/enemy-kodo.png');
    this.load.image('enemy-anacondra', '/assets/enemies/enemy-anacondra.png');
    this.load.image('enemy-cobrahn', '/assets/enemies/enemy-cobrahn.png');
    this.load.image('enemy-pythas', '/assets/enemies/enemy-pythas.png');
    this.load.image('enemy-kresh', '/assets/enemies/enemy-kresh.png');
    this.load.image('enemy-skum', '/assets/enemies/enemy-skum.png');
    this.load.image('enemy-verdan', '/assets/enemies/enemy-verdan.png');
    this.load.image('enemy-mutanus', '/assets/enemies/enemy-mutanus.png');

    // UI
    this.load.image('bg-forest', '/assets/ui/bg-forest.png');
    this.load.image('bg-barrens', '/assets/ui/bg-barrens.png');
    this.load.image('map-combat', '/assets/ui/map-combat.png');
    this.load.image('map-elite', '/assets/ui/map-elite.png');
    this.load.image('map-rest', '/assets/ui/map-rest.png');
    this.load.image('map-treasure', '/assets/ui/map-treasure.png');
    this.load.image('map-boss', '/assets/ui/map-boss.png');
  }

  create(): void {
    this.createShopIcon();
    this.createProceduralEnemyArt();
    generateAllItemArt(this);
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
  }
}
