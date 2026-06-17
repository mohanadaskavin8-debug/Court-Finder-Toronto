import { Router } from "express";
import { db, courtsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  UpdateCourtPlayersParams,
  UpdateCourtPlayersBody,
  GetCourtParams,
} from "@workspace/api-zod";

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
    const courts = await db.select().from(courtsTable);
    const totalCourts = courts.length;
    const activeCourts = courts.filter((c) => c.currentPlayers > 0).length;
    const totalPlayers = courts.reduce((sum, c) => sum + c.currentPlayers, 0);
    const courtsNeedingPlayers = courts.filter(
      (c) => c.currentPlayers < c.playersNeeded
    ).length;
    res.json({ totalCourts, activeCourts, totalPlayers, courtsNeedingPlayers });
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

// PATCH /courts/:id
router.patch("/courts/:id", async (req, res) => {
  const parsedParams = UpdateCourtPlayersParams.safeParse({
    id: Number(req.params.id),
  });
  const parsedBody = UpdateCourtPlayersBody.safeParse(req.body);

  if (!parsedParams.success || !parsedBody.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  try {
    const [updated] = await db
      .update(courtsTable)
      .set({
        currentPlayers: parsedBody.data.currentPlayers,
        playersNeeded: parsedBody.data.playersNeeded,
        updatedAt: new Date(),
      })
      .where(eq(courtsTable.id, parsedParams.data.id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Court not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update court players");
    res.status(500).json({ error: "Failed to update court players" });
  }
});

export default router;
