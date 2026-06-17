---
name: Toronto Court Finder data provenance & seeding
description: Where the 726 courts come from, how school courts are filtered to elementary/middle, district assignment, and reproducible seeding
---

# Court dataset (726 courts)

- 115 park + 4 community-centre courts from City of Toronto Open Data (Parks & Recreation Facilities, AMENITIES contains "Basketball Court").
- 607 TDSB/TCDSB **elementary/middle** school courts.

## School courts are ELEMENTARY/MIDDLE and INFERRED, not verified
The schools dataset has no basketball-court flag and **no usable grade-level field**: `SCHOOL_LEVEL` is null for every one of the ~1173 rows. The only governance signal is `SCHOOL_TYPE` (EP=English Public/TDSB, ES=English Separate/TCDSB, PR=Private, U=University, C=College, FP/FS=French). So grade level can only be inferred from the **school name**.

Rule (high precision against including high schools): **drop a school iff its name matches a high-school/post-secondary pattern AND lacks an elementary/middle marker.**
- HS pattern: `secondary|secondaire|high school|collegiate|c.i|c.v.i|vocational|technical|institute|college|school of the arts|academy|ss`
- elem/middle marker (overrides HS pattern): `jr|junior|sr|senior|middle|mdl|elementary|élémentaire/elementaire|public school|early learning|montessori|primary|community school`
- Also drop: any "Monsignor Fraser" campus (Catholic HS), admin/board buildings (`program and special|special services|education centre|board office|administration`), and closed locations (`(closed...)`).

**Why the marker override matters:** "Academy" is ambiguous — Bishop Allen / R H King / Cardinal Carter Academy are high schools, but Donview **Middle** …Academy, Elmbank **Jr Mdl** Academy, Fraser Mustard **Early Learning** Academy, and the TCDSB "X Catholic Academy" new-builds (Epiphany of Our Lord, St Joan of Arc, St Mother Teresa) are elementary/middle. Bare "Public … Academy" (e.g. Shoreham) is also elementary — note the marker is "public school" OR standalone "public".
**How to apply:** present school courts (`courtType: "school"`) as likely/inferred, never confirmed. The heuristic can still mis-handle a few oddly-named schools; that is an accepted tradeoff biased toward *excluding* high schools.

## District assignment
The `neighborhood`/district = the school's own `MUNICIPALITY` code mapped ET/TO/NY/SC/EY/YK → Etobicoke/Toronto/North York/Scarborough/East York/York. No district polygon. Current counts: Scarborough 212, North York ~183, Toronto 144, Etobicoke 110, York 47, East York 27.

## Reproducibility rule
The authoritative court list lives in `scripts/data/toronto-courts.json`. To change courts, edit that file and run `pnpm --filter @workspace/scripts run seed:courts` (DELETE + bulk insert).
**Why:** the DB starts empty on a fresh env/deploy and must reseed from the JSON.
**How to apply:** never hand-mutate the courts table for data changes. Player counts are demo weighted-random (most courts empty) so exact active counts differ each reseed — expected; the court list itself is deterministic.
