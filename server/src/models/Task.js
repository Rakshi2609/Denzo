import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    index: true
  },
  description: String,
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending',
    index: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  dueDate: {
    type: Date,
    required: true,
    index: true
  },
  startTime: {
    type: String,
    required: false
  },
  endTime: {
    type: String,
    required: false
  },
  actualStartTime: {
    type: Date,
    required: false
  },
  actualEndTime: {
    type: Date,
    required: false
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  recurringTaskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecurringTask',
    index: true
  },
  tags: [String],
  completedAt: Date
}, {
  timestamps: true
});

// Compound indexes for efficient queries
taskSchema.index({ assignedTo: 1, status: 1, dueDate: 1 });
taskSchema.index({ createdBy: 1, createdAt: -1 });
taskSchema.index({ status: 1, dueDate: 1 });

export default mongoose.model('Task', taskSchema);
