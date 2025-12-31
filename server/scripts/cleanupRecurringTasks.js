import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const RecurringTaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  frequency: { type: String, enum: ['Daily', 'Weekly', 'Monthly'], required: true },
  startDate: { type: Date, required: true },
  endDate: Date,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
  taskTemplate: {
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
    startTime: String,
    endTime: String,
    tags: [String]
  },
  lastGeneratedAt: Date,
  nextRunAt: Date
}, { timestamps: true });

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'], default: 'Pending' },
  dueDate: Date,
  startTime: String,
  endTime: String,
  tags: [String],
  recurringTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'RecurringTask' }
}, { timestamps: true });

const RecurringTask = mongoose.model('RecurringTask', RecurringTaskSchema);
const Task = mongoose.model('Task', TaskSchema);
const User = mongoose.model('User', new mongoose.Schema({
  displayName: String,
  email: String
}));

async function cleanupRecurringTasks() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const user = await User.findOne();
    if (!user) {
      console.error('❌ No users found');
      process.exit(1);
    }
    console.log(`👤 User: ${user.displayName || user.email}\n`);

    // Get all recurring tasks
    const allRecurring = await RecurringTask.find();
    console.log(`📋 Found ${allRecurring.length} recurring tasks\n`);

    // Group by frequency and title
    const grouped = {};
    for (const task of allRecurring) {
      const key = `${task.frequency}-${task.title.toLowerCase().trim()}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(task);
    }

    console.log('🗑️  Removing duplicates...\n');
    
    let deletedRecurring = 0;
    const idsToKeep = [];

    for (const [key, tasks] of Object.entries(grouped)) {
      if (tasks.length > 1) {
        console.log(`   Found ${tasks.length} duplicates for: ${tasks[0].title} (${tasks[0].frequency})`);
        // Keep the first one, delete the rest
        idsToKeep.push(tasks[0]._id);
        for (let i = 1; i < tasks.length; i++) {
          await RecurringTask.findByIdAndDelete(tasks[i]._id);
          deletedRecurring++;
          console.log(`      ❌ Deleted duplicate ID: ${tasks[i]._id}`);
        }
      } else {
        idsToKeep.push(tasks[0]._id);
      }
    }

    console.log(`\n✅ Deleted ${deletedRecurring} duplicate recurring tasks\n`);

    // Delete all generated tasks from recurring templates
    console.log('🗑️  Deleting all generated tasks from recurring templates...');
    const deletedTasks = await Task.deleteMany({ recurringTaskId: { $exists: true, $ne: null } });
    console.log(`✅ Deleted ${deletedTasks.deletedCount} generated tasks\n`);

    // Update the remaining recurring tasks with proper date ranges
    console.log('📅 Setting up clean recurring tasks with date ranges...\n');

    const startDate = new Date('2026-01-01'); // Jan 1, 2026
    startDate.setHours(0, 0, 0, 0);

    const keepTasks = await RecurringTask.find({ _id: { $in: idsToKeep } });

    for (const task of keepTasks) {
      let endDate = new Date(startDate);
      
      if (task.frequency === 'Daily') {
        // Daily: Jan 1 to Jan 30
        endDate = new Date('2026-01-30');
      } else if (task.frequency === 'Weekly') {
        // Weekly: Jan 1 to Jan 31 (5 weeks)
        endDate = new Date('2026-01-31');
      } else if (task.frequency === 'Monthly') {
        // Monthly: Jan 1 to Jun 30 (6 months)
        endDate = new Date('2026-06-30');
      }
      
      endDate.setHours(23, 59, 59, 999);

      task.startDate = startDate;
      task.endDate = endDate;
      task.isActive = true;
      task.lastGeneratedAt = null;
      task.nextRunAt = null;
      await task.save();

      console.log(`✅ Updated: ${task.title} (${task.frequency})`);
      console.log(`   Start: ${task.startDate.toDateString()}`);
      console.log(`   End: ${task.endDate.toDateString()}\n`);
    }

    // Summary
    console.log('📊 Final Status:');
    const finalRecurring = await RecurringTask.find({ isActive: true });
    console.log(`   Active recurring tasks: ${finalRecurring.length}`);
    
    const dailyCount = finalRecurring.filter(t => t.frequency === 'Daily').length;
    const weeklyCount = finalRecurring.filter(t => t.frequency === 'Weekly').length;
    const monthlyCount = finalRecurring.filter(t => t.frequency === 'Monthly').length;
    
    console.log(`   - Daily: ${dailyCount}`);
    console.log(`   - Weekly: ${weeklyCount}`);
    console.log(`   - Monthly: ${monthlyCount}`);
    
    const remainingTasks = await Task.find({ recurringTaskId: { $exists: true } });
    console.log(`   Generated tasks: ${remainingTasks.length}\n`);

    console.log('✅ Cleanup complete! Now click "Generate Tasks Now" to create fresh tasks.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupRecurringTasks();
