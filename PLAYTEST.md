# Balance notes

## Sim ↔ live parity fix (difficulty discrepancy)

Live play felt much easier than the headless balance sim because:

1. **Shop upgrades** — the sim bought **one upgrade per shop visit**, but the live shop allowed dumping gold into unlimited upgrades (+30% magnitude each). That alone made human runs far stronger than the harness.
2. **Unscaled summons** — mid-combat adds (Wisps, Pythons, etc.) spawned at base HP/damage even on late floors, so boss/elite summon fights were softer than the sim’s floor-scaled main enemies implied.

### Fixes

- Live shop: **one upgrade purchase per visit** (matches the sim).
- Summons inherit the fight’s `enemyScale`.
- Intent labels rewrite scaled numbers so UI matches damage.
- Curse draw damage text matches code (5, not 10).
- Sim combat scoring uses upgrade-scaled effect values.

## Current harness snapshot

`SMART_RUNS=20 ONSPEC_RUNS=15 RANDOM_RUNS=5 SEED_RUNS=15`:

| Policy | Full-run win |
|--------|-------------|
| Smart | ~41% |
| On-spec | ~49% |
| Random | ~0% |

Random remains near zero — skill still required. Seeded path viability varies by spec (Tree/Holy/Shadow strong; Boomkin softest).

## Spec item themes (discovery, not labelled kits)

| Spec | Items enable |
|------|----------------|
| Feral | Bleed ticks, block→damage wall, 0-cost tempo, Cat Vulnerable, Bear block-on-play |
| Boomkin | Spell Power, Thorns+block, twin random hits, AoE bleeds, expensive-spell energy |
| Tree | Heal→damage, HoT→block, Tree energy, block threshold AoE, Tree cost reduce |
| Holy | Heal→damage, expensive heal draw, Holy Fire/Nova amp, overheal→block, Holy block |
| Shadow | DoT leech, longer/stronger DoTs, Weak→Vulnerable, half recoil, recoil→energy |
| Discipline | Block→damage, Penance Vulnerable, block carryover, attack→heal, block-card draw |

## Elemental Shaman nerf

Human Elemental runs felt unbeatable (spell-power snowball + free bolts + Flame Shock → Lava Burst + echoes). The harness understated that because it scores cards without live SP / sequencing.

Key changes:
- Flame Shock DoT 90 → 60; Lava Burst 40 → 32 and refunds only after a successful consume
- Lightning Bolt free only with **≥4** all-elemental cards in hand; damage 38 → 32
- No duplicate Flame Shock in starter; Wrath +5 SP / 4 turns; Master +3 SP; Blast 2 echoes; Searing 10×4
- Elemental spell power is **1.25×** (other casters keep 1.5×); Echo energy needs ≥3 hits
- Stormcaller Eye fixed to random damage only; Focus Stone attacks-only; Rod/Core tuned down

Harness after nerf (Elemental specifically): smart ~8–16%, on-spec ~13–25% — intentionally below other specs because humans sequence this kit much better than the sim.
