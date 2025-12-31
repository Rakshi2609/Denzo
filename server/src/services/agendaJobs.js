import Task from '../models/Task.js';
import RecurringTask from '../models/RecurringTask.js';

// Helper: Calculate next run date, skipping Sundays
const calculateNextRun = (frequency, startDate = new Date()) => {
  let nextDate = new Date(startDate);

  switch (frequency) {
    case 'Daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'Weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'Monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
  }

  // Skip Sundays (0 = Sunday)
  while (nextDate.getDay() === 0) {
    nextDate.setDate(nextDate.getDate() + 1);
  }

  return nextDate;
};

export const defineAgendaJobs = (agenda) => {
  agenda.define('generate-recurring-tasks', async (job) => {
    console.log('🔄 Running recurring task generation job...');

    try {
      const now = new Date();
      
      // Find all active recurring tasks that should run
      const recurringTasks = await RecurringTask.find({
        isActive: true,
        startDate: { $lte: now },
        $or: [
          { endDate: { $exists: false } },
          { endDate: null },
          { endDate: { $gte: now } }
        ]
      }).populate('assignedTo createdBy');

      console.log(`✅ Found ${recurringTasks.length} active recurring tasks to process`);

      let generatedCount = 0;
      let skippedCount = 0;

      for (const recurringTask of recurringTasks) {
        try {
          console.log(`\n📋 Processing: "${recurringTask.title}" (${recurringTask.frequency})`);
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          console.log(`   Today: ${today.toDateString()}, Tomorrow: ${tomorrow.toDateString()}`);

          // Determine due date based on frequency
          let dueDate = new Date(tomorrow);
          
          if (recurringTask.frequency === 'Daily') {
            // Daily: Create for tomorrow
            // Already set to tomorrow
          } else if (recurringTask.frequency === 'Weekly') {
            // Weekly: Create for same day next week (7 days from tomorrow)
            dueDate.setDate(dueDate.getDate() + 6); // +6 because tomorrow is already +1
          } else if (recurringTask.frequency === 'Monthly') {
            // Monthly: Create for same date next month
            dueDate.setMonth(dueDate.getMonth() + 1);
          }

          // Skip if due date falls on Sunday
          if (dueDate.getDay() === 0) {
            dueDate.setDate(dueDate.getDate() + 1);
            console.log(`   ⚠️  Due date was Sunday, moved to Monday: ${dueDate.toDateString()}`);
          }

          console.log(`   📅 Target due date: ${dueDate.toDateString()}`);

          // Check if task already exists for this due date
          const existingTask = await Task.findOne({
            recurringTaskId: recurringTask._id,
            dueDate: {
              $gte: dueDate,
              $lt: new Date(dueDate.getTime() + 24 * 60 * 60 * 1000)
            }
          });

          if (existingTask) {
            console.log(`   ⏭️  Task already exists for ${dueDate.toDateString()}, skipping`);
            skippedCount++;
            continue;
          }

          // Create new task instance
          const newTask = await Task.create({
            title: recurringTask.title,
            description: recurringTask.description,
            assignedTo: recurringTask.assignedTo._id || recurringTask.assignedTo,
            createdBy: recurringTask.assignedTo._id || recurringTask.assignedTo, // System generates, so creator = assignee
            recurringTaskId: recurringTask._id,
            priority: recurringTask.taskTemplate.priority,
            startTime: recurringTask.taskTemplate.startTime || null,
            endTime: recurringTask.taskTemplate.endTime || null,
            tags: recurringTask.taskTemplate.tags || [],
            dueDate,
            status: 'Pending'
          });

          // Update recurring task metadata
          recurringTask.lastGeneratedAt = new Date();
          recurringTask.nextRunAt = dueDate;
          await recurringTask.save();

          generatedCount++;
          console.log(`   ✅ Generated task ID: ${newTask._id} for ${dueDate.toDateString()}`);
        } catch (error) {
          console.error(`   ❌ Error generating task for "${recurringTask.title}":`, error.message);
        }
      }

      console.log(`\n🎉 Job complete: ${generatedCount} tasks generated, ${skippedCount} skipped`);
    } catch (error) {
      console.error('❌ Error in recurring task generation job:', error);
    }
  });

  // Schedule the job to run daily at 9 PM (21:00)
  agenda.every('0 21 * * *', 'generate-recurring-tasks');
  
  console.log('Agenda jobs defined and scheduled');
};
