---
name: Toronto Court Finder data provenance & seeding
description: Where the 219 courts come from, how districts are assigned, and how to reseed reproducibly
---

# Court dataset

- 119 park/community-centre courts from City of Toronto Open Data (Parks & Recreation Facilities, AMENITIES contains "Basketball Court").
- 100 TDSB/TCDSB high-school courts.

## School courts are INFERRED, not verified
The schools dataset has no basketball-court flag and no usable grade-level field (`SCHOOL_LEVEL` is empty for all rows). High schools are identified by name pattern (`collegiate|secondary|high school|C.I.|S.S.`) restricted to the two big public boards (TDSB + TCDSB) to avoid storefront private "academies" that the name pattern otherwise catches.
**Why:** there is no ground-truth list of which schools have outdoor courts; public high schools reliably do.
**How to apply:** present school courts (`courtType: "school"`) as likely/inferred, never as confirmed. Name-only heuristics misclassify private schools, so always gate on board.

## District assignment
The `neighborhood` column = nearest-school `MUNICIPALITY` label (district codes ET/TO/NY/SC/EY/YK → Etobicoke/Toronto/North York/Scarborough/East York/York). No district polygon is used. Districts present: Scarborough, North York, Toronto, York, Etobicoke, East York.

## Reproducibility rule
The authoritative court list lives in `scripts/data/toronto-courts.json`. To change courts, edit that file and run `pnpm --filter @workspace/scripts run seed:courts` (DELETE + bulk insert).
**Why:** the DB is the only place the data lived originally; a fresh env or deploy starts empty and must reseed from the JSON.
**How to apply:** never hand-mutate the courts table for data changes. Player counts are demo weighted-random (most courts empty) so exact active counts differ each reseed — that is expected, the court list itself is deterministic.
