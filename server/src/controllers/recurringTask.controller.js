import RecurringTask from '../models/RecurringTask.js';
import Task from '../models/Task.js';

/**
 * Core recurring-task generator
 * Used by both Agenda + manual trigger
 */
export const generateRecurringTasksCore = async (now) => {
  // ⛔ Do not generate before 9 PM
  if (now.getHours() < 21) {
    return { generated: 0, skipped: 0 };
  }

  const recurringTasks = await RecurringTask.find({
    isActive: true,
    startDate: { $lte: now },
    $or: [
      { endDate: { $exists: false } },
      { endDate: null },
      { endDate: { $gte: now } }
    ]
  }).populate('assignedTo createdBy');

  let generated = 0;
  let skipped = 0;

  for (const recurringTask of recurringTasks) {
    // Base date = today @ 00:00
    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);

    // Always generate for NEXT day
    let dueDate = new Date(baseDate);
    dueDate.setDate(dueDate.getDate() + 1);

    // Frequency handling
    if (recurringTask.frequency === 'Weekly') {
      dueDate.setDate(dueDate.getDate() + 6);
    }

    if (recurringTask.frequency === 'Monthly') {
      dueDate.setMonth(dueDate.getMonth() + 1);
    }

    // Skip Sundays
    while (dueDate.getDay() === 0) {
      dueDate.setDate(dueDate.getDate() + 1);
    }

    // Normalize time
    dueDate.setHours(12, 0, 0, 0);

    // Respect startDate
    if (recurringTask.startDate && dueDate < recurringTask.startDate) {
      skipped++;
      continue;
    }

    // Prevent duplicates
    const existingTask = await Task.findOne({
      recurringTaskId: recurringTask._id,
      dueDate: {
        $gte: dueDate,
        $lt: new Date(dueDate.getTime() + 86400000),
      },
    });

    if (existingTask) {
      skipped++;
      continue;
    }

    // Create task
    await Task.create({
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
      status: 'Pending',
    });

    recurringTask.lastGeneratedAt = new Date();
    recurringTask.nextRunAt = dueDate;
    await recurringTask.save();

    generated++;
  }

  return { generated, skipped };
};

/* ============================
   CONTROLLERS
============================ */

export const getAllRecurringTasks = async (req, res) => {
  try {
    const tasks = await RecurringTask.find({
      assignedTo: req.user._id
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
    const {
      title,
      description,
      frequency,
      startDate,
      endDate,
      assignedTo,
      priority,
      startTime,
      endTime
    } = req.body;

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
      }
    });

    const populated = await RecurringTask.findById(recurringTask._id)
      .populate('assignedTo', 'displayName email')
      .populate('createdBy', 'displayName email');

    res.status(201).json(populated);
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

    const {
      title,
      description,
      frequency,
      startDate,
      endDate,
      assignedTo,
      priority,
      startTime,
      endTime
    } = req.body;

    recurringTask.title = title ?? recurringTask.title;
    recurringTask.description = description ?? recurringTask.description;
    recurringTask.frequency = frequency ?? recurringTask.frequency;
    recurringTask.startDate = startDate ?? recurringTask.startDate;
    recurringTask.endDate = endDate ?? recurringTask.endDate;
    recurringTask.assignedTo = assignedTo ?? recurringTask.assignedTo;

    recurringTask.taskTemplate.priority =
      priority ?? recurringTask.taskTemplate.priority;

    recurringTask.taskTemplate.startTime =
      startTime !== undefined ? startTime : recurringTask.taskTemplate.startTime;

    recurringTask.taskTemplate.endTime =
      endTime !== undefined ? endTime : recurringTask.taskTemplate.endTime;

    await recurringTask.save();

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

// Manual trigger (same logic as Agenda)
export const triggerRecurringTasks = async (req, res) => {
  try {
    const result = await generateRecurringTasksCore(new Date());
    res.json({
      message: 'Recurring task generation completed',
      ...result,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
