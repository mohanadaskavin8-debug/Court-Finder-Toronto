import { Router } from "express";
import { db, courtsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetCourtParams } from "@workspace/api-zod";

const router = Router();

// GET /courts
router.get("/courts", async (req, res) => {
  try {
    const courts = await db.select().from(courtsTable).orderBy(courtsTable.name);
    res.json(courts);
  } catch (err) {
    req.log.error({ err }, "Failed to list courts");
    res.status(500).json({ error: "Failed to list courts" });
  }
});

// GET /courts/summary
router.get("/courts/summary", async (req, res) => {
  try {
    const courts = await db.select({ courtType: courtsTable.courtType }).from(courtsTable);
    const count = (type: string) => courts.filter((c) => c.courtType === type).length;
    res.json({
      totalCourts: courts.length,
      parkCourts: count("park"),
      schoolCourts: count("school"),
      communityCourts: count("community"),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get courts summary");
    res.status(500).json({ error: "Failed to get courts summary" });
  }
});

// GET /courts/:id
router.get("/courts/:id", async (req, res) => {
  const parsed = GetCourtParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid court id" });
    return;
  }
  try {
    const [court] = await db
      .select()
      .from(courtsTable)
      .where(eq(courtsTable.id, parsed.data.id));
    if (!court) {
      res.status(404).json({ error: "Court not found" });
      return;
    }
    res.json(court);
  } catch (err) {
    req.log.error({ err }, "Failed to get court");
    res.status(500).json({ error: "Failed to get court" });
  }
});

export default router;
