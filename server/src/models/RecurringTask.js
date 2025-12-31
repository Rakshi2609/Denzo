import mongoose from 'mongoose';

const recurringTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  frequency: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  taskTemplate: {
    priority: {
      type: String,
      default: 'Medium'
    },
    startTime: String,
    endTime: String,
    tags: [String]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastGeneratedAt: Date,
  nextRunAt: Date
}, {
  timestamps: true
});

recurringTaskSchema.index({ isActive: 1, nextRunAt: 1 });
recurringTaskSchema.index({ createdBy: 1 });

export default mongoose.model('RecurringTask', recurringTaskSchema);
