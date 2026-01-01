import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import models
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

async function testRecurringTasks() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Fetch two users
    const users = await User.find().limit(2);
    if (users.length < 2) {
      console.error('❌ Need at least 2 users in database');
      process.exit(1);
    }
    const [userA, userB] = users;
    console.log(`👤 Using users: ${userA.displayName || userA.email} (${userA._id}), ${userB.displayName || userB.email} (${userB._id})\n`);

    // Clean up old test recurring tasks
    console.log('🧹 Cleaning up old test recurring tasks...');
    await RecurringTask.deleteMany({ 
      title: { $in: ['Test Daily Task', 'Test Weekly Task', 'Test Monthly Task'] }
    });
    await Task.deleteMany({ 
      title: { $in: ['Test Daily Task', 'Test Weekly Task', 'Test Monthly Task'] }
    });
    console.log('✅ Cleanup complete\n');

    // Create test recurring tasks, alternating assignment
    console.log('📝 Creating test recurring tasks...\n');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const recurringTasks = [
      {
        title: 'Test Daily Task',
        description: 'This task should be generated daily',
        frequency: 'Daily',
        startDate: today,
        assignedTo: userB._id,
        createdBy: userA._id,
        isActive: true,
        taskTemplate: {
          priority: 'High',
          startTime: '09:00',
          endTime: '10:00',
          tags: ['test', 'daily']
        }
      },
      {
        title: 'Test Weekly Task',
        description: 'This task should be generated weekly',
        frequency: 'Weekly',
        startDate: today,
        assignedTo: userA._id,
        createdBy: userB._id,
        isActive: true,
        taskTemplate: {
          priority: 'Medium',
          startTime: '14:00',
          endTime: '15:00',
          tags: ['test', 'weekly']
        }
      },
      {
        title: 'Test Monthly Task',
        description: 'This task should be generated monthly',
        frequency: 'Monthly',
        startDate: today,
        assignedTo: userB._id,
        createdBy: userA._id,
        isActive: true,
        taskTemplate: {
          priority: 'Low',
          startTime: '16:00',
          endTime: '17:00',
          tags: ['test', 'monthly']
        }
      }
    ];

    for (const taskData of recurringTasks) {
      const task = await RecurringTask.create(taskData);
      console.log(`✅ Created: ${task.title} (${task.frequency}) - ID: ${task._id}`);
    }

    console.log('\n📊 Current Status:');
    const allRecurringTasks = await RecurringTask.find({ isActive: true });
    console.log(`   Total active recurring tasks: ${allRecurringTasks.length}`);
    
    const userTasks = await Task.find({ assignedTo: { $in: [userA._id, userB._id] } });
    console.log(`   Total tasks for users: ${userTasks.length}`);
    console.log(`   Tasks with recurringTaskId: ${userTasks.filter(t => t.recurringTaskId).length}\n`);

    // Now manually trigger the generation job
    console.log('🔄 Manually triggering task generation...\n');
    
    const allActive = await RecurringTask.find({ isActive: true }).populate('assignedTo createdBy');
    
    let generatedCount = 0;
    let skippedCount = 0;

    for (const recurringTask of allActive) {
      try {
        console.log(`📋 Processing: "${recurringTask.title}" (${recurringTask.frequency})`);
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        let dueDate = new Date(tomorrow);
        
        if (recurringTask.frequency === 'Daily') {
          // Already set to tomorrow
        } else if (recurringTask.frequency === 'Weekly') {
          dueDate.setDate(dueDate.getDate() + 6);
        } else if (recurringTask.frequency === 'Monthly') {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }

        // Skip Sundays
        if (dueDate.getDay() === 0) {
          dueDate.setDate(dueDate.getDate() + 1);
          console.log(`   ⚠️  Due date was Sunday, moved to Monday`);
        }

        console.log(`   📅 Target due date: ${dueDate.toDateString()}`);

        // Check if task already exists
        const existingTask = await Task.findOne({
          recurringTaskId: recurringTask._id,
          dueDate: {
            $gte: dueDate,
            $lt: new Date(dueDate.getTime() + 24 * 60 * 60 * 1000)
          }
        });

        if (existingTask) {
          console.log(`   ⏭️  Task already exists, skipping\n`);
          skippedCount++;
          continue;
        }

        // Create task
        const newTask = await Task.create({
          title: recurringTask.title,
          description: recurringTask.description,
          assignedTo: recurringTask.assignedTo._id,
          createdBy: recurringTask.assignedTo._id,
          recurringTaskId: recurringTask._id,
          priority: recurringTask.taskTemplate.priority,
          startTime: recurringTask.taskTemplate.startTime,
          endTime: recurringTask.taskTemplate.endTime,
          tags: recurringTask.taskTemplate.tags || [],
          dueDate,
          status: 'Pending'
        });

        recurringTask.lastGeneratedAt = new Date();
        recurringTask.nextRunAt = dueDate;
        await recurringTask.save();

        generatedCount++;
        console.log(`   ✅ Generated task ID: ${newTask._id}\n`);
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`);
      }
    }

    console.log('🎉 Generation Complete!');
    console.log(`   Generated: ${generatedCount}`);
    console.log(`   Skipped: ${skippedCount}\n`);

    // Verify results
    console.log('🔍 Verification:');
    const finalUserTasks = await Task.find({ assignedTo: { $in: [userA._id, userB._id] } }).populate('recurringTaskId');
    console.log(`   Total tasks for users: ${finalUserTasks.length}`);
    
    const recurringGenerated = finalUserTasks.filter(t => t.recurringTaskId);
    console.log(`   Recurring-generated tasks: ${recurringGenerated.length}\n`);

    if (recurringGenerated.length > 0) {
      console.log('📋 Generated Tasks:');
      for (const task of recurringGenerated) {
        console.log(`   - ${task.title} | Due: ${task.dueDate.toDateString()} | Priority: ${task.priority} | Status: ${task.status}`);
      }
    }

    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testRecurringTasks();
