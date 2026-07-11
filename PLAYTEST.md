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

## Reproduce

```bash
SMART_RUNS=20 ONSPEC_RUNS=20 RANDOM_RUNS=10 SEED_RUNS=30 npx tsx scripts/playthrough.ts
```
