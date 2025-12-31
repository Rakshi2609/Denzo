import Task from '../models/Task.js';

export const canEditTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only task creator can edit' });
    }

    req.task = task;
    next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const canUpdateStatus = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only assigned user can update status' });
    }

    req.task = task;
    next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const canComment = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const userId = req.user._id.toString();
    const isCreator = task.createdBy.toString() === userId;
    const isAssigned = task.assignedTo.toString() === userId;

    if (!isCreator && !isAssigned) {
      return res.status(403).json({ error: 'Only creator and assigned user can comment' });
    }

    req.task = task;
    next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
