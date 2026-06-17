# Toronto Court Finder

An NBA 2K-style interactive map of every basketball court across Toronto. Players see a live, neon-styled map of courts and report how many people are currently there and how many more are needed to get a game going.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/court-finder run dev` — run the web app (map + list views)
- `pnpm --filter @workspace/scripts run seed:courts` — (re)seed the courts table from `scripts/data/toronto-courts.json`
- `pnpm --filter @workspace/court-finder run typecheck` — typecheck the web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Web: React + Vite, react-leaflet v4 + leaflet + leaflet.markercluster, Tailwind, CartoDB dark tiles

## Where things live

- `artifacts/court-finder` — web app. Map: `src/components/court-map.tsx`; update panel: `src/components/court-panel.tsx`; list view: `src/pages/courts.tsx`; map page: `src/pages/home.tsx`; status/color helpers: `src/lib/utils.ts`.
- `artifacts/api-server` — Express API for courts + summary.
- `lib/db/src/schema/courts.ts` — source of truth for the courts table.
- `scripts/data/toronto-courts.json` — source of truth for the court dataset (219 real courts).
- `scripts/src/seed-courts.ts` — reproducible seed (DELETE + bulk insert from the JSON).

## Architecture decisions

- **Dataset (219 courts):** 119 park/community-centre courts from City of Toronto Open Data (Parks & Recreation Facilities, AMENITIES contains "Basketball Court") + 100 TDSB/TCDSB high-school courts.
- **School courts are inferred, not verified.** The schools dataset has no basketball-court flag and no usable grade-level field, so high schools are identified by name pattern and restricted to the two big public boards (TDSB + TCDSB) to avoid storefront private "academies". `courtType: "school"` marks them; treat as likely, not confirmed.
- **District** (the `neighborhood` column) is assigned by nearest-school `MUNICIPALITY` label, not a district polygon.
- **Map clustering** is integrated manually via a `useMap()` child component (`ClusterLayer`) rather than `react-leaflet-cluster`, to avoid react-leaflet version-compat issues. The cluster group is rebuilt and torn down inside a `useEffect` keyed on `courts`.
- **Status logic** (`getCourtStatus`): Full = `currentPlayers >= maxPlayers`; Filling Up = `currentPlayers >= playersNeeded/2 && > 0`; else Open. `playersNeeded` is user-editable and independent of `currentPlayers`.

## Product

- Map view (`/`): clustered neon markers over the whole city, color-coded by status (green Open / orange Filling Up / red Full). Tap a court to open the panel and broadcast current/needed players.
- List view (`/courts`): all courts with status filter and district filter.
- Summary HUD: total players, active courts, courts needing players.

## User preferences

- Coverage must include the entire city (Scarborough, North York, East York, Etobicoke, York, old Toronto) and school courts, not just downtown parks.

## Gotchas

- **Court data is reproducible from `scripts/data/toronto-courts.json`.** To change the courts, edit that file and run the seed script — do NOT hand-mutate the DB, or a fresh env/deploy will lose the change. Player counts are seeded as demo weighted-random (most courts empty), so they differ each reseed.
- Generated mutation hooks take `{ id, data }` (e.g. `useUpdateCourtPlayers().mutate({ id, data })`), not `{ params: { id }, data }`.
- react-leaflet v4 logs a benign React 19 peer-dependency warning on install; the app runs fine.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

