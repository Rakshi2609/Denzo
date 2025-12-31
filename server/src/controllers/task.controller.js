import Task from '../models/Task.js';
import TaskUpdate from '../models/TaskUpdate.js';

export const getAllTasks = async (req, res) => {
  try {
    // Only show tasks assigned to or created by current user (privacy)
    const tasks = await Task.find({
      $or: [
        { assignedTo: req.user._id },
        { createdBy: req.user._id }
      ]
    })
      .populate('assignedTo', 'displayName email')
      .populate('createdBy', 'displayName email')
      .sort({ dueDate: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyTasks = async (req, res) => {
  try {
    console.log(`📋 Fetching tasks for user: ${req.user._id}`);
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate('assignedTo', 'displayName email')
      .populate('createdBy', 'displayName email')
      .sort({ dueDate: 1 });
    
    const recurringCount = tasks.filter(t => t.recurringTaskId).length;
    const regularCount = tasks.length - recurringCount;
    
    console.log(`📋 Found ${tasks.length} tasks assigned to user (${regularCount} regular, ${recurringCount} recurring)`);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getFollowUps = async (req, res) => {
  try {
    const tasks = await Task.find({ createdBy: req.user._id })
      .populate('assignedTo', 'displayName email')
      .populate('createdBy', 'displayName email')
      .sort({ dueDate: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'displayName email')
      .populate('createdBy', 'displayName email');
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Privacy check: only show task if user is assignee or creator
    const isAssignedToUser = task.assignedTo?._id.toString() === req.user._id.toString();
    const isCreatedByUser = task.createdBy?._id.toString() === req.user._id.toString();
    
    if (!isAssignedToUser && !isCreatedByUser) {
      return res.status(403).json({ error: 'Access denied: You do not have permission to view this task' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, description, dueDate, startTime, endTime, priority, assignedTo } = req.body;

    const task = await Task.create({
      title,
      description,
      dueDate,
      startTime,
      endTime,
      priority,
      assignedTo,
      createdBy: req.user._id
    });

    await TaskUpdate.create({
      taskId: task._id,
      userId: req.user._id,
      type: 'Update',
      content: 'Task created'
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'displayName email')
      .populate('createdBy', 'displayName email');

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { title, description, dueDate, startTime, endTime, priority, assignedTo } = req.body;

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, dueDate, startTime, endTime, priority, assignedTo },
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'displayName email')
      .populate('createdBy', 'displayName email');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await TaskUpdate.create({
      taskId: task._id,
      userId: req.user._id,
      type: 'Update',
      content: 'Task updated'
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = req.task;

    const oldStatus = task.status;
    task.status = status;

    if (status === 'Completed') {
      task.completedAt = new Date();
    }

    await task.save();

    await TaskUpdate.create({
      taskId: task._id,
      userId: req.user._id,
      type: 'StatusChange',
      oldValue: oldStatus,
      newValue: status
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Delete associated updates
    await TaskUpdate.deleteMany({ taskId: task._id });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTaskUpdates = async (req, res) => {
  try {
    const updates = await TaskUpdate.find({ taskId: req.params.taskId })
      .populate('userId', 'displayName email')
      .sort({ createdAt: -1 });

    res.json(updates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const { content } = req.body;

    const update = await TaskUpdate.create({
      taskId: req.params.taskId,
      userId: req.user._id,
      type: 'Comment',
      content
    });

    const populatedUpdate = await TaskUpdate.findById(update._id)
      .populate('userId', 'displayName email');

    res.status(201).json(populatedUpdate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const completeTask = async (req, res) => {
  try {
    const { taskId, actualStartTime, actualEndTime } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user is assigned to this task
    if (task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only complete tasks assigned to you' });
    }

    const oldStatus = task.status;
    task.status = 'Completed';
    task.completedAt = new Date();
    
    if (actualStartTime) {
      task.actualStartTime = new Date(actualStartTime);
    }
    
    if (actualEndTime) {
      task.actualEndTime = new Date(actualEndTime);
    } else {
      // If no end time provided, set to now
      task.actualEndTime = new Date();
    }

    await task.save();

    await TaskUpdate.create({
      taskId: task._id,
      userId: req.user._id,
      type: 'StatusChange',
      oldValue: oldStatus,
      newValue: 'Completed'
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'displayName email')
      .populate('createdBy', 'displayName email');

    res.json(populatedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTaskByBody = async (req, res) => {
  try {
    const { taskId } = req.body;
    
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check permissions: only creator or assignee can delete
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isAssignee = task.assignedTo.toString() === req.user._id.toString();

    if (!isCreator && !isAssignee) {
      return res.status(403).json({ error: 'You do not have permission to delete this task' });
    }

    await Task.findByIdAndDelete(taskId);

    // Delete associated updates
    await TaskUpdate.deleteMany({ taskId });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
