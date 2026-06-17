import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { db, courtsTable } from "@workspace/db";

const here = dirname(fileURLToPath(import.meta.url));

interface SeedCourt {
  name: string;
  address: string;
  district: string;
  lat: number;
  lng: number;
  courtType: string;
}

// Demo activity distribution: most courts empty, a few filling up / full.
// Player counts are dynamic/user-driven, so they are seeded as realistic demo
// data rather than fixed values. The court list itself is fully deterministic.
function weightedCurrentPlayers(): number {
  const r = Math.random();
  if (r < 0.68) return 0;
  if (r < 0.82) return 1 + Math.floor(Math.random() * 4);
  if (r < 0.94) return 5 + Math.floor(Math.random() * 4);
  return 10;
}

async function main() {
  const file = join(here, "..", "data", "toronto-courts.json");
  const courts: SeedCourt[] = JSON.parse(readFileSync(file, "utf-8"));

  const rows = courts.map((c) => ({
    name: c.name,
    address: c.address,
    neighborhood: c.district,
    lat: c.lat,
    lng: c.lng,
    currentPlayers: weightedCurrentPlayers(),
    playersNeeded: 10,
    maxPlayers: 10,
    courtType: c.courtType,
    hasLights: false,
  }));

  console.log(`Seeding ${rows.length} Toronto courts...`);
  await db.delete(courtsTable);

  const chunkSize = 200;
  for (let i = 0; i < rows.length; i += chunkSize) {
    await db.insert(courtsTable).values(rows.slice(i, i + chunkSize));
  }

  console.log(`Seeded ${rows.length} courts across all Toronto districts.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
