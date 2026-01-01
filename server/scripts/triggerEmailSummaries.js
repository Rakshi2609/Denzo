
import 'dotenv/config';
import { triggerDailySummaries } from '../src/utils/emailSummary.js';
import connectDB from '../src/config/database.js';

(async () => {
  try {
    await connectDB();
    await triggerDailySummaries();
    console.log('✅ Manual email summary trigger complete');
  } catch (err) {
    console.error('❌ Manual email summary trigger failed:', err);
    process.exit(1);
  }
})();
