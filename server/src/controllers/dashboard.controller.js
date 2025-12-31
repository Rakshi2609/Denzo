import Task from '../models/Task.js';

export const getStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Filter for tasks assigned to or created by current user
    const userFilter = {
      $or: [
        { assignedTo: req.user._id },
        { createdBy: req.user._id }
      ]
    };

    const [total, completed, pending, overdue, dueToday] = await Promise.all([
      Task.countDocuments(userFilter),
      Task.countDocuments({ ...userFilter, status: 'Completed' }),
      Task.countDocuments({ ...userFilter, status: 'Pending' }),
      Task.countDocuments({ 
        ...userFilter,
        status: { $ne: 'Completed' }, 
        dueDate: { $lt: today } 
      }),
      Task.countDocuments({ 
        ...userFilter,
        dueDate: { $gte: today, $lt: tomorrow } 
      })
    ]);

    res.json({
      total,
      completed,
      pending,
      overdue,
      dueToday
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCalendar = async (req, res) => {
  try {
    const { start, end } = req.query;

    const tasks = await Task.find({
      $or: [
        { assignedTo: req.user._id },
        { createdBy: req.user._id }
      ],
      dueDate: {
        $gte: new Date(start),
        $lte: new Date(end)
      }
    })
      .populate('assignedTo', 'displayName email')
      .select('title dueDate status assignedTo');

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getOverdue = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasks = await Task.find({
      $or: [
        { assignedTo: req.user._id },
        { createdBy: req.user._id }
      ],
      status: { $ne: 'Completed' },
      dueDate: { $lt: today }
    })
      .populate('assignedTo', 'displayName email')
      .populate('createdBy', 'displayName email')
      .sort({ dueDate: 1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
