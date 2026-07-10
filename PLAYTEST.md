# Item System + Path Diversity

## What shipped

- **50 items:** 20 general + 5 unique per opening spec (Feral, Boomkin, Tree, Holy, Shadow, Discipline)
- **Elite reward:** defeat an elite → choose 1 of 3 random items from general + your spec pool
- Soft nerfs to monopoly engines (Atonement heal echo 3→2, Wild Growth damage echo 3→2)
- Headless sim extended with path detection + forced path-seed validation

## Spec item themes (discovery, not labelled kits)

| Spec | Items enable |
|------|----------------|
| Feral | Bleed ticks, block→damage wall, 0-cost tempo, Cat Vulnerable, Bear block-on-play |
| Boomkin | Spell Power, Thorns+block, twin random hits, AoE bleeds, expensive-spell energy |
| Tree | Heal→damage, HoT→block, Tree energy, block threshold AoE, Tree cost reduce |
| Holy | Heal→damage, expensive heal draw, Holy Fire/Nova amp, overheal→block, Holy block |
| Shadow | DoT leech, longer/stronger DoTs, Weak→Vulnerable, half recoil, recoil→energy |
| Discipline | Block→damage, Penance Vulnerable, block carryover, attack→heal, block-card draw |

## Balance validation (seeded paths)

Each path-defining item was pre-seeded; 30 on-spec runs each. Viable = ≥45% win rate.

| Spec | Viable seeded paths |
|------|---------------------|
| Feral | bleed 93%, bear_wall 93%, tempo 90% (**3**) |
| Boomkin | celestial 87%, thorns 80%, aoe 70%, twin_star 77% (**4**) |
| Tree | verdant 97%, fortress 87%, barkbreaker 100%, swiftroot 83% (**4**) |
| Holy | radiant/flame/serenity/hymn all 100% (**4**) |
| Shadow | leech 97%, pain 93%, recoil 67%, scream 57% (**4**) |
| Discipline | spike 97%, smite_echo 97%, penance 93%, radiance 100% (**4**) |

Natural (unseeded) smart+onspec wins also spread across 3–4 first-item paths per spec.

Random play remains ~0% — skill still required.

## Reproduce

```bash
SMART_RUNS=20 ONSPEC_RUNS=20 RANDOM_RUNS=10 SEED_RUNS=30 npx tsx scripts/playthrough.ts
```
