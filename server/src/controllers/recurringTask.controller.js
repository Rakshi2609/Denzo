import RecurringTask from '../models/RecurringTask.js';
import Task from '../models/Task.js';
import { agenda } from '../config/agenda.js';

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

export const getAllRecurringTasks = async (req, res) => {
  try {
    // Only show recurring tasks assigned to or created by current user (privacy)
    const tasks = await RecurringTask.find({
      $or: [
        { assignedTo: req.user._id },
        { createdBy: req.user._id }
      ]
    })
      .populate('assignedTo', 'displayName email')
      .populate('createdBy', 'displayName email')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createRecurringTask = async (req, res) => {
  try {
    const { title, description, frequency, startDate, endDate, assignedTo, priority, startTime, endTime } = req.body;

    const nextRun = calculateNextRun(frequency, new Date(startDate));

    const recurringTask = await RecurringTask.create({
      title,
      description,
      frequency,
      startDate,
      endDate,
      assignedTo,
      createdBy: req.user._id,
      taskTemplate: { 
        priority,
        startTime,
        endTime
      },
      nextRunAt: nextRun
    });

    // No need to schedule individual jobs - the main cron job at 9 PM handles all recurring tasks

    const populatedTask = await RecurringTask.findById(recurringTask._id)
      .populate('assignedTo', 'displayName email')
      .populate('createdBy', 'displayName email');

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateRecurringTask = async (req, res) => {
  try {
    const recurringTask = await RecurringTask.findById(req.params.id);

    if (!recurringTask) {
      return res.status(404).json({ error: 'Recurring task not found' });
    }

    if (recurringTask.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only creator can edit' });
    }

    const { title, description, frequency, startDate, endDate, assignedTo, priority, startTime, endTime } = req.body;

    recurringTask.title = title || recurringTask.title;
    recurringTask.description = description || recurringTask.description;
    recurringTask.frequency = frequency || recurringTask.frequency;
    recurringTask.startDate = startDate || recurringTask.startDate;
    recurringTask.endDate = endDate || recurringTask.endDate;
    recurringTask.assignedTo = assignedTo || recurringTask.assignedTo;
    recurringTask.taskTemplate.priority = priority || recurringTask.taskTemplate.priority;
    recurringTask.taskTemplate.startTime = startTime !== undefined ? startTime : recurringTask.taskTemplate.startTime;
    recurringTask.taskTemplate.endTime = endTime !== undefined ? endTime : recurringTask.taskTemplate.endTime;

    if (frequency !== recurringTask.frequency) {
      recurringTask.nextRunAt = calculateNextRun(frequency, new Date());
    }

    await recurringTask.save();

    // No need to reschedule individual jobs - the main cron job at 9 PM handles all recurring tasks

    const populated = await RecurringTask.findById(recurringTask._id)
      .populate('assignedTo', 'displayName email')
      .populate('createdBy', 'displayName email');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteRecurringTask = async (req, res) => {
  try {
    const recurringTask = await RecurringTask.findById(req.params.id);

    if (!recurringTask) {
      return res.status(404).json({ error: 'Recurring task not found' });
    }

    if (recurringTask.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only creator can delete' });
    }

    // No need to cancel individual jobs - the main cron job handles all active recurring tasks

    await RecurringTask.findByIdAndDelete(req.params.id);

    res.json({ message: 'Recurring task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const toggleRecurringTask = async (req, res) => {
  try {
    const recurringTask = await RecurringTask.findById(req.params.id);

    if (!recurringTask) {
      return res.status(404).json({ error: 'Recurring task not found' });
    }

    recurringTask.isActive = !recurringTask.isActive;
    await recurringTask.save();

    res.json(recurringTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Manual trigger for testing - generates tasks immediately
export const triggerRecurringTasks = async (req, res) => {
  try {
    console.log('🔧 Manual trigger: Generating recurring tasks...');
    console.log('🔧 Triggered by user:', req.user._id);
    
    // Import models directly and run synchronously (bypass Agenda)
    const Task = (await import('../models/Task.js')).default;
    const RecurringTask = (await import('../models/RecurringTask.js')).default;
    
    const now = new Date();
    
    // Find all active recurring tasks
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
        dueDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
        
        if (recurringTask.frequency === 'Daily') {
          // Daily: Create for tomorrow
        } else if (recurringTask.frequency === 'Weekly') {
          // Weekly: Create for same day next week
          dueDate.setDate(dueDate.getDate() + 6);
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
          createdBy: recurringTask.assignedTo._id || recurringTask.assignedTo,
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
    
    // Check final count
    const taskCount = await Task.countDocuments({ assignedTo: req.user._id });
    
    res.json({ 
      message: `Successfully generated ${generatedCount} new tasks. You now have ${taskCount} total tasks.`,
      info: `Skipped ${skippedCount} duplicate tasks. Check "My Tasks" page to see generated tasks.`,
      taskCount,
      generated: generatedCount,
      skipped: skippedCount
    });
  } catch (error) {
    console.error('❌ Manual trigger error:', error);
    res.status(500).json({ error: error.message });
  }
};
