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

async function main() {
  const file = join(here, "..", "data", "toronto-courts.json");
  const courts: SeedCourt[] = JSON.parse(readFileSync(file, "utf-8"));

  const rows = courts.map((c) => ({
    name: c.name,
    address: c.address,
    neighborhood: c.district,
    lat: c.lat,
    lng: c.lng,
    courtType: c.courtType,
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
