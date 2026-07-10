import Phaser from 'phaser';
import { ActTransitionScene } from './game/scenes/ActTransitionScene';
import { BootScene } from './game/scenes/BootScene';
import { CombatScene } from './game/scenes/CombatScene';
import { DeckViewScene } from './game/scenes/DeckViewScene';
import { GameOverScene } from './game/scenes/GameOverScene';
import { ItemRewardScene } from './game/scenes/ItemRewardScene';
import { MapScene } from './game/scenes/MapScene';
import { RestScene } from './game/scenes/RestScene';
import { RewardScene } from './game/scenes/RewardScene';
import { ShopScene } from './game/scenes/ShopScene';
import { SpecScene } from './game/scenes/SpecScene';
import { TalentScene } from './game/scenes/TalentScene';
import { TitleScene } from './game/scenes/TitleScene';
import { CANVAS_H, CANVAS_W, DPR } from './game/display';
import './style.css';

// Phaser text is a bitmap; match texture density to the HiDPI canvas + camera zoom
const originalText = Phaser.GameObjects.GameObjectFactory.prototype.text;
Phaser.GameObjects.GameObjectFactory.prototype.text = function (
  this: Phaser.GameObjects.GameObjectFactory,
  x: number,
  y: number,
  text: string | string[],
  style?: Phaser.Types.GameObjects.Text.TextStyle,
) {
  return originalText.call(this, x, y, text, { resolution: DPR, ...style });
};

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  // Higher backing-store resolution keeps bitmap text sharp under Scale.FIT
  // on retina displays. Scenes layout in GAME_W × GAME_H via camera zoom.
  width: CANVAS_W,
  height: CANVAS_H,
  backgroundColor: '#0b1210',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    roundPixels: true,
  },
  scene: [
    BootScene,
    TitleScene,
    SpecScene,
    MapScene,
    CombatScene,
    ItemRewardScene,
    RewardScene,
    RestScene,
    ShopScene,
    TalentScene,
    DeckViewScene,
    ActTransitionScene,
    GameOverScene,
  ],
};

new Phaser.Game(config);
