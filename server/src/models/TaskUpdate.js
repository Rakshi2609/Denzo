import mongoose from 'mongoose';

const taskUpdateSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['Comment', 'StatusChange', 'Assignment', 'Update'],
    required: true
  },
  content: String,
  oldValue: String,
  newValue: String,
  reactions: {
    type: Map,
    of: [String],
    default: new Map()
  }
}, {
  timestamps: true
});

taskUpdateSchema.index({ taskId: 1, createdAt: -1 });

export default mongoose.model('TaskUpdate', taskUpdateSchema);
