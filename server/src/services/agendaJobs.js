import Agenda from "agenda";
import mongoose from "mongoose";
import { generateRecurringTasksCore } from "../controllers/recurringTask.controller.js";

export const startAgenda = async () => {
  if (!mongoose.connection.db) {
    throw new Error("Mongoose connection is not ready");
  }
  const agenda = new Agenda({
    mongo: mongoose.connection.db,
    collection: "agendaJobs",
  });

  agenda.define("generate-recurring-tasks", async () => {
    try {
      console.log("🕘 Agenda running recurring task job...");
      const result = await generateRecurringTasksCore(new Date());
      console.log(
        `✅ Agenda done → generated: ${result.generated}, skipped: ${result.skipped}`
      );
    } catch (err) {
      console.error("❌ Agenda job failed:", err);
    }
  });

  await agenda.start();
  await agenda.every("0 21 * * *", "generate-recurring-tasks");
  console.log("✅ Agenda started (runs daily at 9 PM)");
};
