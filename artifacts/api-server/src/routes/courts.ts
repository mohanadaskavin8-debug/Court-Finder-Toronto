import { Router } from "express";
import { db, courtsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  UpdateCourtPlayersParams,
  UpdateCourtPlayersBody,
  GetCourtParams,
  AiUpdateCourtBody,
} from "@workspace/api-zod";
import { matchCourt } from "../lib/court-match";
import { getOpenAI } from "../lib/openai";
import { rateLimit } from "../middlewares/rate-limit";

const router = Router();

// The AI endpoint calls a billable LLM, so throttle it harder than the plain
// read/update routes to limit cost/abuse on the public deployment.
const aiRateLimit = rateLimit({
  windowMs: 60_000,
  max: 10,
  message: "You're sending AI commands too quickly. Please wait a moment and try again.",
});

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

// POST /courts/ai-update
router.post("/courts/ai-update", aiRateLimit, async (req, res) => {
  const parsedBody = AiUpdateCourtBody.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const openai = getOpenAI();
  if (!openai) {
    res.status(503).json({ error: "AI assistant is not configured" });
    return;
  }

  const prompt = parsedBody.data.prompt;

  try {
    // 1. Extract intent with the LLM (structured JSON output).
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You parse commands for updating basketball court status.",
            "Extract the court name the user refers to and any player-count changes.",
            "Respond ONLY with a JSON object with these keys:",
            '- "courtQuery": string — the court name mentioned, or "" if none.',
            '- "currentPlayers": integer or null — how many people are CURRENTLY playing/at the court.',
            '- "playersNeeded": integer or null — how many MORE players are needed to get a game going.',
            "Interpret relative phrasing: 'needs 3 more' / '3 more people needed' => playersNeeded = 3.",
            "'5 people playing' / '5 there now' / '5 on the court' => currentPlayers = 5.",
            "If a value is not mentioned, use null. Never invent numbers.",
          ].join("\n"),
        },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let extracted: {
      courtQuery?: unknown;
      currentPlayers?: unknown;
      playersNeeded?: unknown;
    };
    try {
      extracted = JSON.parse(raw);
    } catch {
      res.json({
        status: "not_found",
        message: "Sorry, I couldn't understand that. Try e.g. \"3 more players needed at Percy Williams Jr PS\".",
      });
      return;
    }

    const courtQuery =
      typeof extracted.courtQuery === "string" ? extracted.courtQuery.trim() : "";
    const toIntOrNull = (v: unknown): number | null => {
      if (typeof v === "number" && Number.isFinite(v)) return Math.round(v);
      return null;
    };
    const currentPlayers = toIntOrNull(extracted.currentPlayers);
    const playersNeeded = toIntOrNull(extracted.playersNeeded);

    if (!courtQuery) {
      res.json({
        status: "not_found",
        message:
          "I couldn't tell which court you meant. Mention a court by name, e.g. \"5 people playing at Highland Creek PS\".",
      });
      return;
    }

    if (currentPlayers === null && playersNeeded === null) {
      res.json({
        status: "no_change",
        message:
          "I found the court but no player numbers to update. Try \"3 more players needed\" or \"5 people playing\".",
      });
      return;
    }

    // 2. Fuzzy-match the court name against the DB.
    const courts = await db
      .select({ id: courtsTable.id, name: courtsTable.name })
      .from(courtsTable);
    const outcome = matchCourt(courtQuery, courts);

    if (outcome.kind === "none") {
      res.json({
        status: "not_found",
        message: `I couldn't find a court matching "${courtQuery}". Check the spelling or try the List View to find the exact name.`,
      });
      return;
    }

    if (outcome.kind === "ambiguous") {
      const names = outcome.candidates.map((c) => c.name);
      res.json({
        status: "ambiguous",
        message: `Several courts match "${courtQuery}". Which one did you mean?`,
        candidates: names,
      });
      return;
    }

    // 3. Exactly one good match — apply the update.
    const [existing] = await db
      .select()
      .from(courtsTable)
      .where(eq(courtsTable.id, outcome.court.id));
    if (!existing) {
      res.json({
        status: "not_found",
        message: "That court no longer exists.",
      });
      return;
    }

    const nextCurrent =
      currentPlayers === null
        ? existing.currentPlayers
        : Math.max(0, Math.min(currentPlayers, existing.maxPlayers));
    const nextNeeded =
      playersNeeded === null ? existing.playersNeeded : Math.max(0, playersNeeded);

    const [updated] = await db
      .update(courtsTable)
      .set({
        currentPlayers: nextCurrent,
        playersNeeded: nextNeeded,
        updatedAt: new Date(),
      })
      .where(eq(courtsTable.id, existing.id))
      .returning();

    const changes: string[] = [];
    if (currentPlayers !== null) changes.push(`${nextCurrent} playing now`);
    if (playersNeeded !== null) changes.push(`${nextNeeded} more player${nextNeeded === 1 ? "" : "s"} needed`);

    res.json({
      status: "updated",
      message: `Updated ${updated.name} — ${changes.join(", ")}.`,
      court: updated,
    });
  } catch (err) {
    req.log.error({ err }, "Failed AI court update");
    const status =
      err && typeof err === "object" && "status" in err
        ? (err as { status?: number }).status
        : undefined;
    if (status === 429) {
      res.status(503).json({
        error:
          "The AI assistant is busy right now. Please wait a moment and try again.",
      });
      return;
    }
    if (status === 401) {
      res
        .status(503)
        .json({ error: "The AI assistant is temporarily unavailable. Please try again later." });
      return;
    }
    res.status(500).json({ error: "Failed to process the request" });
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
