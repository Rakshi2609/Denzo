import express from "express";
import { triggerDailySummaries } from "../utils/triggerDailySummaries.js";
import { generateRecurringTasksCore } from "../controllers/recurringTask.controller.js";

const router = express.Router();

router.post("/run", async (req, res) => {
  if (req.headers["x-cron-secret"] !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const now = new Date();

    const recurring = await generateRecurringTasksCore(now);
    const summaries = await triggerDailySummaries();

    res.json({
      ok: true,
      recurring,
      summaries
    });
  } catch (err) {
    console.error("CRON ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
