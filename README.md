# Evolve

A turn-based card roguelite. Choose **Druid** or **Priest** at the start.

## Play

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## How to play

1. **Choose Druid or Priest** on the title screen.
2. Pick a path node on the map (fights, elites, rest, treasure, shop, boss).
3. In combat: click a card, then click an enemy if it needs a target. **End Turn** when ready.
4. After victory, pick a reward card and spend a **talent point** in your class trees.
5. Defeat the **Nightmare of the Grove**, then push into **The Barrens**.
6. Face random **Wailing Caverns** elites and defeat **Mutanus the Devourer**.

### Druid forms

| Form | Style | Signature cards |
|------|--------|-----------------|
| Bear | Tank / AoE | Barkskin, Swipe, Maul |
| Cat | Single-target DPS | Claw, Rip, Shred |
| Boomkin | Big spells | Wrath, Starfire, Starsurge |
| Tree | Healing | Decurse, Rejuvenation, Healing Touch |

### Priest schools

| School | Style | Signature cards |
|--------|--------|-----------------|
| Discipline | Shields & atonement | Smite, Penance, Power Word: Shield |
| Shadow | DoTs & void damage | Mind Blast, Shadow Word: Pain, Void Eruption |
| Holy | Direct healing | Flash Heal, Renew, Divine Hymn |

### Talent trees

Classic-style trees: spend points in a tree to unlock deeper tiers (3 points per tier). Prerequisites chain key talents. Capstones reward specialization.

**Druid:** Feral · Restoration · Balance  
**Priest:** Holy · Shadow · Discipline

**Spell Power** boosts caster schools (Boomkin / Holy / Shadow / Discipline) — never Bear or Cat attacks.

Open **Talents** from the map (or after a fight) to allocate points. Hover nodes for details; card text updates to show talent bonuses.

## Stack

- Vite + TypeScript
- Phaser 4
- AI-generated WoW-inspired fantasy art
