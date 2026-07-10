# Evolve

A turn-based card roguelite. Milestone 1: **Druid** — Bear, Cat, Boomkin, and Tree forms.

## Play

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## How to play

1. **Begin as Druid** on the title screen.
2. Pick a path node on the map (fights, elites, rest, treasure, boss).
3. In combat: click a card, then click an enemy if it needs a target. **End Turn** when ready.
4. After victory, pick a reward card and spend a **talent point** in Feral, Restoration, or Balance.
5. Reach and defeat the **Nightmare of the Grove**.

### Forms

| Form | Style | Signature cards |
|------|--------|-----------------|
| Bear | Tank / AoE | Barkskin, Swipe, Maul |
| Cat | Single-target DPS | Claw, Rip, Shred |
| Boomkin | Big spells | Wrath, Starfire, Starsurge |
| Tree | Healing | Decurse, Rejuvenation, Healing Touch |

### Talent trees

| Tree | Affects | Examples |
|------|---------|----------|
| **Feral** | Cat & Bear cards | Predatory Strikes, Brutal Maul, Improved Swipe |
| **Restoration** | Healing & Decurse | Improved Healing Touch, Natural Ward, Living Spirit |
| **Balance** | Boomkin spells | Wrath of Elune, Lunar Guidance, Gale Force |

Open **Talents** from the map (or after a fight) to allocate points. Card text updates to show talent bonuses.

## Stack

- Vite + TypeScript
- Phaser 4
- AI-generated WoW-inspired fantasy art
