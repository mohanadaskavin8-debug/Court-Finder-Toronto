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
- AI assistant env: `AI_INTEGRATIONS_OPENAI_BASE_URL` + `AI_INTEGRATIONS_OPENAI_API_KEY` (auto-provisioned by Replit AI Integrations). Optional `OPENAI_API_KEY` is used only as a fallback.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Web: React + Vite, MapLibre GL v5 (3D vector map), framer-motion, Tailwind, Carto dark-matter vector style
- AI: OpenAI (`gpt-4o-mini`, JSON mode) via the Replit AI Integrations proxy — no personal key required, billed to Replit credits

## Where things live

- `artifacts/court-finder` — web app. 3D map: `src/components/court-map.tsx` (MapLibre GL); intro splash animation: `src/components/intro-splash.tsx`; corner wordmark + legend: `src/components/map-overlay.tsx`; count-up HUD: `src/components/summary-hud.tsx`; update panel: `src/components/court-panel.tsx`; AI command bar: `src/components/ai-prompt-bar.tsx`; list view: `src/pages/courts.tsx`; map page: `src/pages/home.tsx`; status/color helpers: `src/lib/utils.ts`.
- `artifacts/api-server` — Express API for courts + summary + AI update (`src/routes/courts.ts`). OpenAI client factory: `src/lib/openai.ts`; fuzzy court matcher: `src/lib/court-match.ts`.
- `lib/db/src/schema/courts.ts` — source of truth for the courts table.
- `scripts/data/toronto-courts.json` — source of truth for the court dataset (726 real courts).
- `scripts/src/seed-courts.ts` — reproducible seed (DELETE + bulk insert from the JSON).

## Architecture decisions

- **Dataset (726 courts):** 115 park + 4 community-centre courts from City of Toronto Open Data (Parks & Recreation Facilities, AMENITIES contains "Basketball Court") + 607 TDSB/TCDSB **elementary/middle** school courts.
- **School courts are ELEMENTARY/MIDDLE and are inferred, not verified.** The schools dataset has no basketball-court flag and no usable grade-level field (`SCHOOL_LEVEL` is null for every row; `SCHOOL_TYPE` is only governance EP/ES/PR/U/C/FP/FS). High schools / post-secondary are therefore **excluded by name pattern** (`secondary|secondaire|collegiate|institute|college|technical|vocational|school of the arts|academy|high school`) — but only when the name lacks an elementary/middle marker (`jr|junior|sr|senior|middle|mdl|elementary|élémentaire|public school|early learning|montessori`), so middle/junior "Academy" schools are kept. Closed locations and admin/board buildings are also dropped. `courtType: "school"` marks them; treat as likely, not confirmed.
- **District** (the `neighborhood` column) is assigned by nearest-school `MUNICIPALITY` label, not a district polygon.
- **Map clustering** uses MapLibre GL's native GeoJSON clustering (`cluster: true` on the source) with neon circle layers, plus a 3D `fill-extrusion` building layer over the Carto vector source. Court data updates via `source.setData` keyed on a `courts` effect; selection/data callbacks read latest values through refs captured at init time.
- **Status logic** (`getCourtStatus`): Full = `currentPlayers >= maxPlayers`; Filling Up = `currentPlayers >= playersNeeded/2 && > 0`; else Open. `playersNeeded` is user-editable and independent of `currentPlayers`.

## Product

- Intro: an Apple-style splash (`intro-splash.tsx`) shows the spinning-basketball logo + wordmark, then zoom-blur-fades away (via framer-motion `AnimatePresence`) to reveal the map while the HUD/overlay fade in. It covers initial data load and a ~2.4s minimum; the map mounts and begins its cinematic pitch-up behind it.
- Map view (`/`): 3D pitched MapLibre map with native-clustered neon markers over the whole city, color-coded by status (green Open / orange Filling Up / red Full), a gentle idle bearing-spin, and an animated pulse ring on the selected court. Tap a court to open the panel and broadcast current/needed players.
- List view (`/courts`): all courts with status filter and district filter.
- Summary HUD: total players, active courts, courts needing players (framer-motion count-up). Corner wordmark has a continuously spinning basketball icon + breathing glow.
- AI command bar (`ai-prompt-bar.tsx`, bottom-center of the map): players type free text (e.g. "3 more players needed at Percy Williams Jr PS"). The LLM extracts the court name + current/needed counts, the server fuzzy-matches across all courts (`court-match.ts`) and applies the update, then the bar shows success / clarification / ambiguous-candidate chips and refreshes the map, HUD, and list.

## User preferences

- Coverage must include the entire city (Scarborough, North York, East York, Etobicoke, York, old Toronto) and school courts, not just downtown parks.

## Gotchas

- **Court data is reproducible from `scripts/data/toronto-courts.json`.** To change the courts, edit that file and run the seed script — do NOT hand-mutate the DB, or a fresh env/deploy will lose the change. Player counts are seeded as demo weighted-random (most courts empty), so they differ each reseed.
- Generated mutation hooks take `{ id, data }` (e.g. `useUpdateCourtPlayers().mutate({ id, data })`), not `{ params: { id }, data }`.
- **The map needs WebGL.** The headless screenshot/preview browser has no WebGL, so the MapLibre map cannot be screenshot-verified here — it renders fine in a real browser. `court-map.tsx` has a graceful fallback (try/catch on construct + a 12s style-load timeout) that shows a "Map unavailable" message pointing to the List View.
- MapLibre GL v5 quirk: WebGL options go in `canvasContextAttributes: { antialias, failIfMajorPerformanceCaveat }`, not at the top level of the map constructor.
- Old leaflet/react-leaflet deps may still be in `package.json` but are unused after the MapLibre rebuild.
- **AI assistant uses the Replit AI Integrations OpenAI proxy** (`src/lib/openai.ts` reads `AI_INTEGRATIONS_OPENAI_BASE_URL` + `AI_INTEGRATIONS_OPENAI_API_KEY`; falls back to a direct `OPENAI_API_KEY`). Re-provision via `setupReplitAIIntegrations({ providerSlug: "openai", ... })` if the proxy env vars go missing — do NOT ask the user for an OpenAI key.
- The fuzzy matcher is intentionally lenient (distinctive-token weighting), so a query for a court not in the dataset (e.g. "Trinity Bellwoods") may still match a same-token court (e.g. "The Holy Trinity School"). Ambiguous queries return candidate chips instead.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

