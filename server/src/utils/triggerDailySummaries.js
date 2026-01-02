import User from "../models/User.js";
import { checkAndSendDailySummary } from "./emailSummary.js";

export const triggerDailySummaries = async () => {
  console.log("📧 Daily summary cron started");

  const users = await User.find({});
  let success = 0;
  let failed = 0;

  for (const user of users) {
    try {
      if (!user.email) continue;

      await checkAndSendDailySummary(user.email);
      success++;
    } catch (err) {
      failed++;
      console.error(`❌ Failed for ${user.email}:`, err.message);
    }
  }

  console.log(`✅ Daily summary finished → ${success} success, ${failed} failed`);

  return { success, failed };
};
