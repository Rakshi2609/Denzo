import axios from 'axios';
const APPSCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz9vtfw3hGAYm6PwXuVy7A-BZrf16X4UQKzX9KJYcc58N7vbRKevJY7Q6mDeo8Yw05MZg/exec';

/**
 * Send email using Google Apps Script Web App
 * @param {string} to - Recipient email
 * @param {string} subject - Subject of the email
 * @param {string} html - HTML body of the email
 */
export const sendMailViaAppScript = async (to, subject, html) => {
  if (!to || !subject || !html) {
    throw new Error('Missing required fields for sending email via AppScript');
  }
  try {
    const response = await axios.post(APPSCRIPT_URL, { to, subject, html }, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (response.data && response.data.success) {
      console.log(`✅ Email sent successfully to ${to} via AppScript.`);
      return response.data;
    } else {
      throw new Error(response.data && response.data.message ? response.data.message : 'Unknown error from AppScript');
    }
  } catch (err) {
    console.error(`❌ Error sending email to ${to} via AppScript:`, err.message);
    throw err;
  }
};

/**
 * Send email with retry mechanism using AppScript
 */
export const sendMailWithRetry = async (to, subject, html, cc = [], maxRetries = 3, retryDelay = 5000) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      attempt++;
      return await sendMailViaAppScript(to, subject, html);
    } catch (error) {
      console.error(`❌ Attempt ${attempt}/${maxRetries} failed:`, error.message);
      if (attempt >= maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};

// For compatibility: sendMail now uses AppScript
export const sendMail = async (to, subject, content, cc = []) => {
  // If content is not HTML, wrap it in <pre> for basic formatting
  const isHTML = /<[a-z][\s\S]*>/i.test(content);
  const html = isHTML ? content : `<pre>${content}</pre>`;
  return sendMailViaAppScript(to, subject, html);
};

// backend/models/SummaryStatus.js
import mongoose from 'mongoose';

const SummaryStatusSchema = new mongoose.Schema({
  email: { type: String, required: true },
  date: { type: String, required: true }, // e.g., '2025-07-09'
});

export const SummaryStatus = mongoose.model('SummaryStatus', SummaryStatusSchema);

const hasSentToday = async (email) => {
  const today = new Date().toISOString().split('T')[0];
  const status = await SummaryStatus.findOne({ email, date: today });
  return !!status;
};

const markSent = async (email) => {
  const today = new Date().toISOString().split('T')[0];
  await SummaryStatus.create({ email, date: today });
};

// backend/utils/checkAndSendDailySummary.js
import User from '../models/User.js';
import Task from '../models/Task.js';

export const checkAndSendDailySummary = async (userEmail) => {
  console.log(`📩 [checkAndSendDailySummary] Starting for ${userEmail}`);

  try {
    const alreadySent = await hasSentToday(userEmail);
    if (alreadySent) {
      console.log(`⏭️ Summary already sent today for ${userEmail}`);
      return;
    }

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      console.log(`❌ No user found for ${userEmail}`);
      return;
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const tasksToday = await Task.find({
      assignedTo: user._id,
      dueDate: { $gte: startOfDay, $lte: endOfDay }
    });

    const completed = tasksToday.filter(t => t.status === 'Completed').length;
    const pending = tasksToday.length - completed;

    const checklistToday = tasksToday.map(task => {
      const status = task.status === 'Completed' ? '✅' : '🔲';
      return `${status} ${task.title}`;
    }).join('\n');

    // ✅ Overdue tasks (before today and not completed)
    const overdueTasks = await Task.find({
      assignedTo: user._id,
      dueDate: { $lt: startOfDay },
      status: { $ne: 'Completed' }
    });

    const checklistOverdue = overdueTasks.map(task => `⚠️ ${task.title} (Due: ${new Date(task.dueDate).toLocaleDateString('en-IN')})`).join('\n');

    // 📅 Tomorrow’s tasks and frequency-based tasks
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
    const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));

    const tasksTomorrow = await Task.find({
      assignedTo: user._id,
      dueDate: { $gte: startOfTomorrow, $lte: endOfTomorrow }
    });

    const checklistTomorrow = tasksTomorrow.map(task => {
      return `📌 ${task.title}`;
    }).join('\n');

// Removed invalid plain text summary block. Only HTML template is used.
    // 📧 Build styled HTML summary message for Denzo
    const summary = `
<div style="background:linear-gradient(135deg,#f0f4ff 0%,#e0e7ff 100%);padding:32px 0;min-height:100vh;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:480px;margin:32px auto;background:#fff;border-radius:18px;box-shadow:0 4px 32px rgba(59,130,246,0.10);padding:32px 28px 28px 28px;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;background:linear-gradient(135deg,#6366f1,#818cf8);border-radius:50%;padding:16px 18px 14px 18px;margin-bottom:8px;">
        <span style="font-size:2.2rem;color:#fff;">🗓️</span>
      </div>
      <h2 style="font-size:2rem;font-weight:800;color:#312e81;margin:0 0 4px 0;letter-spacing:-1px;">Denzo Daily Summary</h2>
      <div style="color:#6366f1;font-size:1.1rem;font-weight:500;">${new Date().toLocaleDateString('en-IN')}</div>
    </div>
    <div style="margin-bottom:18px;">
      <div style="font-size:1.1rem;font-weight:600;color:#1e293b;margin-bottom:6px;">Hi ${user.username || userEmail},</div>
      <div style="font-size:1rem;color:#475569;">Here's your personalized task summary for today:</div>
    </div>
    <div style="background:#f1f5f9;border-radius:12px;padding:16px 18px 10px 18px;margin-bottom:18px;">
      <div style="font-size:1.1rem;font-weight:600;color:#0ea5e9;margin-bottom:6px;">Overview</div>
      <div style="font-size:1rem;color:#334155;">✅ <b>Completed Today:</b> ${completed}</div>
      <div style="font-size:1rem;color:#334155;">🕒 <b>Pending Today:</b> ${pending}</div>
    </div>
    <div style="margin-bottom:18px;">
      <div style="font-size:1.08rem;font-weight:600;color:#6366f1;margin-bottom:4px;">📝 Today's Checklist</div>
      <pre style="background:#f3f4f6;border-radius:8px;padding:12px 14px;font-size:1rem;color:#334155;white-space:pre-wrap;line-height:1.6;margin:0;">${checklistToday || 'No tasks scheduled for today.'}</pre>
    </div>
    <div style="margin-bottom:18px;">
      <div style="font-size:1.08rem;font-weight:600;color:#f59e42;margin-bottom:4px;">⚠️ Overdue Tasks</div>
      <pre style="background:#fef3c7;border-radius:8px;padding:12px 14px;font-size:1rem;color:#b45309;white-space:pre-wrap;line-height:1.6;margin:0;">${checklistOverdue || 'None 🎉'}</pre>
    </div>
    <div style="margin-bottom:18px;">
      <div style="font-size:1.08rem;font-weight:600;color:#10b981;margin-bottom:4px;">🔮 Tasks for Tomorrow</div>
      <pre style="background:#ecfdf5;border-radius:8px;padding:12px 14px;font-size:1rem;color:#065f46;white-space:pre-wrap;line-height:1.6;margin:0;">${checklistTomorrow || 'None planned yet.'}</pre>
    </div>
    <div style="text-align:center;margin-top:32px;">
      <div style="font-size:1.1rem;font-weight:600;color:#6366f1;">Keep up the great work!</div>
      <div style="margin-top:10px;font-size:1rem;color:#64748b;">— The Denzo Team</div>
    </div>
  </div>
</div>
`;

    await sendMail(userEmail, '🗓️ Your Daily Task Summary', summary);
    await markSent(userEmail);
    console.log(`✅ Summary sent and marked for ${userEmail}`);
  } catch (error) {
    console.error(`❌ Error in checkAndSendDailySummary for ${userEmail}:`, error.message);
    throw error;
  }
};

// backend/utils/triggerDailySummaries.js

export const triggerDailySummaries = async () => {
  const currentHour = new Date().getHours();
  console.log(`⏰ Current hour: ${currentHour}`);
  
  if (currentHour < 18) {
    console.log('⏰ Too early for summary. Skipping...');
    return;
  }

  console.log('📧 Starting daily summaries for all users...');
  const users = await User.find({}); 
  console.log(`👥 Found ${users.length} users to process`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const user of users) {
    try {
      await checkAndSendDailySummary(user.email);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to send summary to ${user.email}:`, error.message);
      failCount++;
    }
  }
  
  console.log(`✅ Summary sending complete: ${successCount} sent, ${failCount} failed`);
};
