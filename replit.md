# Toronto Court Finder

An NBA 2K-style interactive, read-only map of every basketball court across Toronto. Visitors browse a neon-styled 3D map and list of 726 courts, color-coded by type (green = park, orange = school, red = community centre). No accounts, no user updates, no AI — pure directory.

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
- Web: React + Vite, MapLibre GL v5 (3D vector map), framer-motion, Tailwind, Carto dark-matter vector style

## Where things live

- `artifacts/court-finder` — web app. 3D map: `src/components/court-map.tsx` (MapLibre GL); intro splash animation: `src/components/intro-splash.tsx`; corner wordmark + court-type legend: `src/components/map-overlay.tsx`; count-up HUD: `src/components/summary-hud.tsx`; read-only detail panel: `src/components/court-panel.tsx`; list view: `src/pages/courts.tsx`; map page: `src/pages/home.tsx`; type/color helpers: `src/lib/utils.ts`.
- `artifacts/api-server` — Express API, read-only: `GET /api/courts`, `GET /api/courts/summary` (counts by type), `GET /api/courts/:id` (`src/routes/courts.ts`).
- `lib/db/src/schema/courts.ts` — source of truth for the courts table.
- `scripts/data/toronto-courts.json` — source of truth for the court dataset (726 real courts).
- `scripts/src/seed-courts.ts` — reproducible seed (DELETE + bulk insert from the JSON).

## Architecture decisions

- **Dataset (726 courts):** 115 park (`courtType: "park"`) + 4 community-centre (`courtType: "community"`) courts derived directly from the user-uploaded City Open Data file `attached_assets/Parks_and_Recreation_Facilities_-_4326_1784976837143.geojson` (features whose AMENITIES contain "Basketball Court"; addresses/coords straight from the file, names title-cased from the source's uppercase; districts preserved from prior data or nearest-school fallback) + 607 TDSB/TCDSB **elementary/middle** school courts.
- **School courts are ELEMENTARY/MIDDLE and are inferred, not verified.** The schools dataset has no basketball-court flag and no usable grade-level field (`SCHOOL_LEVEL` is null for every row; `SCHOOL_TYPE` is only governance EP/ES/PR/U/C/FP/FS). High schools / post-secondary are therefore **excluded by name pattern** (`secondary|secondaire|collegiate|institute|college|technical|vocational|school of the arts|academy|high school`) — but only when the name lacks an elementary/middle marker (`jr|junior|sr|senior|middle|mdl|elementary|élémentaire|public school|early learning|montessori`), so middle/junior "Academy" schools are kept. Closed locations and admin/board buildings are also dropped. `courtType: "school"` marks them; treat as likely, not confirmed.
- **District** (the `neighborhood` column) is assigned by nearest-school `MUNICIPALITY` label, not a district polygon.
- **Map clustering** uses MapLibre GL's native GeoJSON clustering (`cluster: true` on the source) with neon circle layers, plus a 3D `fill-extrusion` building layer over the Carto vector source. Court data updates via `source.setData` keyed on a `courts` effect; selection/data callbacks read latest values through refs captured at init time.

## Product

- Intro: an Apple-style splash (`intro-splash.tsx`) shows the spinning-basketball logo + wordmark, then zoom-blur-fades away (via framer-motion `AnimatePresence`) to reveal the map while the HUD/overlay fade in. It covers initial data load and a ~2.4s minimum; the map mounts and begins its cinematic pitch-up behind it.
- Map view (`/`): 3D pitched MapLibre map with native-clustered neon markers over the whole city, color-coded by court type (green Park / orange School / red Community Centre), a gentle idle bearing-spin, and an animated pulse ring on the selected court. Tap a court to see its read-only details (type, district, address).
- List view (`/courts`): all courts with court-type filter (Park / School / Community Centre) and district filter.
- Summary HUD: total courts + counts by type (framer-motion count-up). Corner wordmark has a continuously spinning basketball icon + breathing glow.

## User preferences

- Coverage must include the entire city (Scarborough, North York, East York, Etobicoke, York, old Toronto) and school courts, not just downtown parks.

## Gotchas

- **Court data is reproducible from `scripts/data/toronto-courts.json`.** To change the courts, edit that file and run the seed script — do NOT hand-mutate the DB, or a fresh env/deploy will lose the change. The site is read-only: the DB holds only static reference data (name, address, district, lat/lng, courtType).
- **The map needs WebGL.** The headless screenshot/preview browser has no WebGL, so the MapLibre map cannot be screenshot-verified here — it renders fine in a real browser. `court-map.tsx` has a graceful fallback (try/catch on construct + a 12s style-load timeout) that shows a "Map unavailable" message pointing to the List View.
- MapLibre GL v5 quirk: WebGL options go in `canvasContextAttributes: { antialias, failIfMajorPerformanceCaveat }`, not at the top level of the map constructor.
- Old leaflet/react-leaflet deps may still be in `package.json` but are unused after the MapLibre rebuild.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

