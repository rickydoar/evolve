# Build Dynamics Report

Headless sims: **40 smart + 40 on-spec** natural runs per opening, plus **40 on-spec seeded runs** per item path. Metrics come from *actual card plays in combat* (entropy, top-3 concentration, unique cards/turn, combo variety), not just deck picks.

Reproduce:

```bash
SMART_RUNS=40 ONSPEC_RUNS=40 RANDOM_RUNS=15 SEED_RUNS=40 npx tsx scripts/playthrough.ts
```

---

## Headline answers

| Question | Winner | Why |
|----------|--------|-----|
| **Most dynamic** | **Tree** (esp. Verdant / Barkbreaker) | ~4.2 unique cards/turn, highest play entropy, widest combo graph — heal, echo, splash, and cleanse all fire in the same turns |
| **Most repetitive** | **Discipline** (esp. Radiance) | PW:Shield alone is ~⅓ of all plays; top-3 cards = **66–71%** of the run; Shield→Shield→Atonement→Smite every fight |
| **Strongest** | **Holy** & **Discipline** | 98–100% seeded win rates across every path |
| **Simplest** | **Discipline**, then **Holy** | One solved turn loop; high main-card consensus |

---

## Spec rankings (smart + on-spec combined)

| Spec | Dynamism | Repetition | Power (smart / onspec) | Feel |
|------|----------|------------|------------------------|------|
| **Tree** | ★★★★★ | Low | 98% / 75% | Most varied turns; Rejuv / Wild Growth / Decurse / Swipe / Swiftmend rotate |
| **Feral** | ★★★★ | Low–Med | 85% / 70% | Cat burst + Bear armor; lowest “same #1 card” consensus (~50%) |
| **Holy** | ★★ | High | 100% / 100% | Holy Fire / Nova / Renew fortress — strong and samey |
| **Boomkin** | ★★★ | Med | 28% / 33% | Moonfire→Starsurge spine; fragile early, fewer long runs |
| **Shadow** | ★★★ | Med–High | 63% / 43% | Almost always opens SW:P (95% main-card consensus) then Flay/VT |
| **Discipline** | ★ | Highest | 93% / 90% | Shield spam engine; least card variety of any spec |

### Spec play fingerprints

- **Tree** — top plays: Rejuvenation, Wild Growth, Decurse, Swipe, Swiftmend. Combos bounce between heals and splash; ~3.8 unique cards/turn.
- **Feral** — Barkskin → Maul/Swipe, Claw → Shred. Form-switching keeps the hand feeling mixed.
- **Holy** — Holy Fire chains, Renew → Purify, Fire → Nova. Reliable but narrow.
- **Boomkin** — Moonfire → Starsurge is the spine (~50% of top combos).
- **Shadow** — SW:P → Mind Flay / SW:P → SW:P / Shield → SW:P. Setup is mandatory.
- **Discipline** — Shield → Shield (3348 times in 80 runs), Atonement ↔ Shield, Shield → Smite. The loop barely changes by path.

---

## Path categories

### By power (seeded on-spec win rate)

| Tier | Builds |
|------|--------|
| **S — near-auto** | Holy (all 4 paths 100%), Disc Spike / Smite Echo / Radiance (100%), Disc Penance (98%), Tree Barkbreaker (98%), Shadow Leech (98%), Tree Verdant (90%) |
| **A — strong** | Feral Bleed (83%), Feral Tempo (75%), Shadow Scream (70%), Tree Swiftroot (68%), Boomkin Celestial (65%), Feral Bear Wall (65%) |
| **B — viable but sharp** | Shadow Pain (60%), Shadow Recoil (55%), Tree Fortress (53%), Boomkin Twin Star (50%), Boomkin Thorns (48%) |
| **C — weak / unreliable** | Boomkin AoE (30% — below viable threshold) |

### By simplicity (how “solved” the turn is)

| Tier | Builds | Turn loop |
|------|--------|-----------|
| **Trivial** | Disc Radiance, Smite Echo, Penance, Spike | Shield → Atonement → Smite/Penance. Items change payoff, not decisions. |
| **Easy** | Holy Radiant / Flame / Serenity / Hymn | Fire/Nova damage + Renew sustain. Path items amp the same cards. |
| **Medium** | Shadow (all), Boomkin Celestial / Twin Star | DoT or Moonfire setup, then dump. Order matters; hand still narrow. |
| **Rich** | Feral Bleed / Tempo / Bear Wall | Bleed finisher vs Bear wall vs tempo shred — different cards, same opening. |
| **Richest** | Tree Verdant / Barkbreaker / Swiftroot / Fortress | Echo engines + heal→damage items force juggling many cards per turn. |

### By dynamism vs repetition (seeded paths)

**Most dynamic (play different cards / combos):**
1. Tree Verdant
2. Tree Barkbreaker
3. Tree Swiftroot
4. Tree Fortress
5. Feral Bleed / Tempo / Bear Wall

**Most repetitive (same cards over and over):**
1. Disc Radiance
2. Disc Smite Echo
3. Disc Penance
4. Disc Spike
5. Holy Hymn / Serenity / Flame

---

## Quadrant map

```
                    HIGH POWER
                         │
         Holy ●          │          ● Tree (Barkbreaker/Verdant)
         Disc ●          │          ● Feral
                         │
    SIMPLE ──────────────┼────────────── DYNAMIC
                         │
         Shadow ●        │          ● Boomkin (fragile)
         (Leech strong)  │
                         │
                    LOW POWER
```

- **Want power + brain-off:** Discipline or Holy.
- **Want power + interesting turns:** Tree Barkbreaker / Verdant (or Feral Bleed).
- **Want variety but accept risk:** Feral hybrid, Boomkin Celestial, Shadow Scream/Recoil.
- **Avoid if you hate repetition:** Discipline (especially Radiance) — it wins by playing Shield constantly.

---

## Notes

- Random play is still ~0% — skill matters; “simple” ≠ “no decisions,” it means the *winning* decisions converge.
- Tree’s on-spec (75%) vs smart (98%) gap means splash damage picks matter; pure heal is weaker but the *play pattern* stays dynamic either way.
- Boomkin’s natural win rate is low because early elites punish slow starts; Celestial seed is the honest power line (~65%).
- Shadow Leech is an S-tier *path* (98%) even though the opening as a whole sits mid-pack — item choice matters more here than on Holy/Disc.
