# Item System + Path Diversity

## What shipped

- **50 items:** 20 general + 5 unique per opening spec (Feral, Boomkin, Tree, Holy, Shadow, Discipline)
- **Elite reward:** defeat an elite → choose 1 of 3 random items from general + your spec pool
- Soft nerfs to monopoly engines (Atonement heal echo 3→2, Wild Growth damage echo 3→2)
- **Echo duration:** combat-wide (`duration: 99`) → **this turn only** (`duration: 1`)
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

## Echo duration A/B (combat-wide → turn-only)

Same harness both sides: `SMART_RUNS=20 ONSPEC_RUNS=20 RANDOM_RUNS=10 SEED_RUNS=30`.

| Metric | Combat-wide | Turn-only | Delta |
|--------|-------------|-----------|-------|
| Overall smart win | 91.7% | 85.0% | −6.7pp |
| Overall onspec win | 84.2% | 80.0% | −4.2pp |
| Random win | 0% | 0% | — |
| Seeded paths still ≥45% | 23/23 | **23/23** | none lost |
| Natural viable paths / spec | 3–4 | 3–4 | preserved |

Largest soft spots under turn-only: Boomkin smart −20pp / onspec −15pp; seeded thorns 80%→53%, twin_star 77%→50% (both still viable). Holy/Discipline unchanged. Shadow recoil/scream actually improved.

**Recommendation: keep turn-only.** Soft power loss, not a path wipe. Combat-wide echoes snowballed monopoly engines for the whole fight; turn scope matches card intent and still leaves ≥2 viable seeded lines per spec.

## Balance validation (seeded paths, turn-only)

Each path-defining item was pre-seeded; 30 on-spec runs each. Viable = ≥45% win rate.

| Spec | Viable seeded paths |
|------|---------------------|
| Feral | bleed 80%, bear_wall 73%, tempo 77% (**3**) |
| Boomkin | celestial 70%, thorns 53%, aoe 67%, twin_star 50% (**4**) |
| Tree | verdant 80%, fortress 63%, barkbreaker 93%, swiftroot 80% (**4**) |
| Holy | radiant/flame/serenity/hymn all 100% (**4**) |
| Shadow | leech 93%, pain 80%, recoil 77%, scream 80% (**4**) |
| Discipline | spike 100%, smite_echo 97%, penance 100%, radiance 100% (**4**) |

Natural (unseeded) smart+onspec wins also spread across 3–4 first-item paths per spec.

Random play remains ~0% — skill still required.

## Reproduce

```bash
SMART_RUNS=20 ONSPEC_RUNS=20 RANDOM_RUNS=10 SEED_RUNS=30 npx tsx scripts/playthrough.ts
```
