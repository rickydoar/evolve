# Evolve Playtest Assessment — Druid & Priest Specs

Headless full-run simulations (Act 1 Grove → Act 2 Barrens / Mutanus) across all six opening specializations.

**Method:** `scripts/playthrough.ts` drives the real `CombatSystem` + map/reward/shop/talent loop.

| Policy | Meaning | Runs / spec |
|--------|---------|-------------|
| **On-spec** | Prefer own form/school cards + matching talent tree | 50 |
| **Smart** | Synergy AI; may splash off-spec engines | 50 |
| **Random** | Random pathing, rewards, and card plays | 50 |

**Total:** 900 simulated runs.

---

## Spec tier list

Ranked primarily by **on-spec** clear rate (how the opening package actually plays), with smart splash as a ceiling check.

| Tier | Spec | On-spec win | Smart win | Notes |
|------|------|-------------|-----------|-------|
| **S** | **Holy** | 100% | 92% | Self-contained. Renew echo + Holy Nova/Fire clear packs; Purify/Serenity stabilize. |
| **S** | **Discipline** | 90% | 92% | PW:Shield + Atonement is the strongest engine in the game. Penance scales with armor. |
| **A** | **Feral** | 64% | 72% | Reliable Cat/Bear toolkit. Dies most often on Act 1 boss / late elites if setup is slow. |
| **A** | **Tree** | 62% | 94% | Opening is heal-heavy and slow; **Wild Growth** + damage splash turns it into a monster. |
| **B** | **Shadow** | 46% | 68% | DoT ramp + recoil (Mind Blast / SW:Death) loses races to early elites. Needs Dispersion/shields. |
| **B** | **Boomkin** | 46% | 54% | High ceiling (Celestial Alignment / Moonfire echo) but fragile early; Thorns/Starfire often brick. |

### Spec notes

- **Holy / Discipline** are the current power band. Both win on-spec without needing lucky splash.
- **Tree** is the biggest “identity vs power” gap: pure resto stalls; `Wild Growth` (block → damage echo) + Moonfire/Starsurge/Thrash is the real win condition.
- **Feral** is the most honest mid-skill Druid path — Swipe/Shred/Rip/Maul always do something useful.
- **Shadow / Boomkin** punish greedy lines. Both spike hard with setup (Psychic Scream + DoTs, or Celestial + Moonfire) but lose more runs before that comes online.

---

## Card tier list

Across both classes. Tiers weigh combat impact, engine potential, win-deck association, and how often the card bricks.

### S — Build-around engines

| Card | Why |
|------|-----|
| **Atonement** | Attack → heal echo. Turns every Smite/DoT tick into sustain. Highest pick gravity in Priest sims. |
| **Wild Growth** | Block → damage echo. The card that makes Tree (and splash resto) real. |
| **Barkskin** | Block → heal echo. Universal defensive engine for Druid. |
| **Moonfire** | Damage + DoT + attack → block echo. Best Boomkin common; Tree’s favorite splash. |
| **Power Word: Shield** | Block + block → heal echo. Discipline’s spine; strong splash for Shadow. |
| **Renew** | HoT + heal → block echo. Holy’s engine; Discipline loves it too. |
| **Tiger's Fury** | Strength + double buffs. Turns Cat turns into delete buttons. |
| **Celestial Alignment** | Spell Power + double buffs. Boomkin’s win-more that actually wins. |
| **Guardian Spirit** | Block + heal + double buffs. Absurd stabilizer for Holy/Disc. |
| **Power Infusion** | Discard → draw 2 + energy. Fixes clunky hands; Disc staple. |

### A — High-impact staples

| Card | Why |
|------|-----|
| **Mangle** | Damage + Vuln + Weak. Feral’s best rare setup. |
| **Psychic Scream** | AoE + Weak + Vuln. Shadow’s best “make the fight fair” card. |
| **Penance** | Scales with half Block — absurd with PW:S / Radiance stacks. |
| **Ironfur / Pain Suppression** | Discard-for-block. Huge armor turns. |
| **Void Eruption** | Clean AoE finisher for Shadow. |
| **Innervate** | +2 energy. Enables double-spell turns for Tree/Boomkin. |
| **Ironbark** | Block + heal + double. Tree’s Guardian Spirit. |
| **Shadowfiend / Predatory Strike / Incarnation / Archangel** | Legendary tempo with a Nightmare tax — still worth it when ahead. |
| **Holy Word: Serenity / Swiftmend** | Heal + instantly replay a heal from discard. Combo pieces. |
| **Dispersion** | Shadow’s missing defensive button. |
| **Ferocious Bite** | Huge with bleed; mediocre without (talent Blood Frenzy helps). |
| **Starsurge** | Damage + Earth and Moon + typed draw. |

### B — Solid / situational

| Card | Why |
|------|-----|
| Swipe, Claw, Shred, Maul, Thrash, Rake, Rip | Feral commons — good, not glamorous. |
| Smite, Holy Fire, Holy Nova, Mind Flay, SW:Pain, Vampiric Touch | School bread-and-butter. |
| Starfall, Sunfire, Hurricane | Fine AoE; rarely the reason you win. |
| Lifebloom, Flash Heal, Prayer of Healing, Healing Touch | Necessary heals; over-drafting them loses races. |
| Decurse / Purify | Cheap cleanse + draw utility. |
| Power Word: Radiance | Fine Disc glue. |

### C — Playable but often skippable

| Card | Why |
|------|-----|
| **Thorns** | High when enemies attack into it; dead vs buff/summon intents. Negative win-deck delta in sims. |
| **Starfire** | Expensive; retrieve is nice but slow. |
| **Shadow Word: Death** | Recoil + conditional bonus — high variance. |
| **Maul** (extra copies) / **Mind Blast** spam | Fine early; dilutes late decks. |
| **Rejuvenation** extras on Feral/Boomkin | Sustain splash that often just clogs. |

### D — Trap / tax cards

| Card | Why |
|------|-----|
| **Nightmare** (curse) | Unplayable; 5 damage on draw. Only accept via legendary payoffs when the upside is immediate. |
| Pure heal piles without an echo | Tree/Holy can stall forever and still die to elites. |
| Recoil stacks without Dispersion/Shield | Shadow’s most common self-kill pattern. |

---

## Fun & rewarding interactions / deck builds

### 1. Discipline Atonement fortress
**PW:Shield → Atonement → Smite/Penance loop.**  
Every hit refunds HP; Penance hits for half your Block. Add Power Infusion for energy and Pain Suppression for discard-armor turns. Feels like classic Disc: damage *is* healing.

### 2. Tree Wild Growth artillery
**Wild Growth + Barkskin + any Block generators.**  
Block becomes a damage aura. Splash Moonfire/Thrash/Starsurge so you’re not only healing. Swiftmend replaying Lifebloom/Rejuv from discard is a delightful “grove combo.”

### 3. Holy Renew fortress with teeth
**Renew echo (heal → block) + Holy Nova/Fire + Purify.**  
You layer HoTs, convert heals into armor, then AoE chip. Serenity replaying a heal from discard is the highlight play. Smart wins often splash Atonement/SW:Pain for kill speed.

### 4. Feral bleed delete
**Rake/Rip → Tiger's Fury → Ferocious Bite (Blood Frenzy = free).**  
Mangle’s Vuln/Weak sets up the burst. Shred’s discard-draw (and Rending Assault exhaust-draw) keeps the Cat hand flowing while Bear tools (Swipe/Maul/Ironfur) cover multi-enemy and defense.

### 5. Boomkin double-buff nuke
**Moonfire echo → Celestial Alignment → Starfire/Starsurge.**  
Spell Power doubles, Earth and Moon amps Wrath/Starfire, attack→block keeps you alive while you charge. Highest “one turn delete” fantasy — also the easiest to die before finding the pieces.

### 6. Shadow scream into void
**Psychic Scream (Weak+Vuln) → SW:Pain / Mind Flay / VT → Void Eruption.**  
The satisfying version of Shadow. Without Scream/Dispersion, recoil and slow DoTs lose to Act 1 elites.

---

## Overall difficulty

**Verdict: appropriately punishing — you should not win on autopilot.**

| Metric | Result |
|--------|--------|
| Random-policy win rate | **0.7%** (2/300) |
| On-spec competent win rate | **68%** overall |
| Smart synergy win rate | **79%** overall |
| Common failure points | Act 1 floor 3/7/8 elites; Act 1 Nightmare boss; Barrens late floors |

Random card plays and pathing almost never clear Act 1. Winning requires:

1. **Pathing** — rest when low, shop-remove curses/dead weight, respect elites.
2. **Drafting** — engines over raw stats; don’t greed legendaries into Nightmare taxes early.
3. **Combat sequencing** — set up echoes/DoTs/Vuln before dump turns; block lethal intents.
4. **Spec awareness** — Tree/Holy must find damage; Shadow/Boomkin must find defense or tempo.

The gap between random (~0%) and competent (~70%) is healthy. The gap between Holy/Disc (S) and Shadow/Boomkin (B) is the main balance concern — opening packages for the B-tier specs need either earlier defense or faster kill tools.

---

## Reproducing the sims

```bash
npm install
SMART_RUNS=50 ONSPEC_RUNS=50 RANDOM_RUNS=50 npx tsx scripts/playthrough.ts
```

Results JSON: `scripts/playthrough-results.json`.
