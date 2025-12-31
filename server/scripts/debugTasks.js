import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  priority: String,
  status: String,
  dueDate: Date,
  startTime: String,
  endTime: String,
  recurringTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'RecurringTask' }
}, { timestamps: true });

const Task = mongoose.model('Task', TaskSchema);
const User = mongoose.model('User', new mongoose.Schema({ displayName: String, email: String }));

async function debugTasks() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    // Find the generated task
    const generatedTask = await Task.findById('695565baa7641e63fe5f7b65').populate('assignedTo createdBy');
    
    console.log('🔍 Looking for generated task: 695565baa7641e63fe5f7b65');
    if (generatedTask) {
      console.log('✅ Task FOUND in database:');
      console.log('   Title:', generatedTask.title);
      console.log('   Assigned to:', generatedTask.assignedTo);
      console.log('   Created by:', generatedTask.createdBy);
      console.log('   Due date:', generatedTask.dueDate);
      console.log('   Status:', generatedTask.status);
      console.log('   Recurring ID:', generatedTask.recurringTaskId);
      console.log('   Full task:', JSON.stringify(generatedTask, null, 2));
    } else {
      console.log('❌ Task NOT FOUND in database');
    }

    console.log('\n📊 All tasks in database:');
    const allTasks = await Task.find().populate('assignedTo createdBy');
    console.log(`   Total: ${allTasks.length} tasks\n`);
    
    for (const task of allTasks) {
      console.log(`   - ${task.title}`);
      console.log(`     ID: ${task._id}`);
      console.log(`     Assigned to: ${task.assignedTo?.displayName || task.assignedTo?.email || task.assignedTo}`);
      console.log(`     Due: ${task.dueDate?.toDateString() || 'No date'}`);
      console.log(`     Recurring: ${task.recurringTaskId ? 'Yes' : 'No'}`);
      console.log('');
    }

    // Check for Rakshith's user ID
    const rakshith = await User.findOne({ email: { $regex: /rakshith/i } });
    if (rakshith) {
      console.log(`👤 Rakshith's ID: ${rakshith._id}`);
      const rakshithTasks = await Task.find({ assignedTo: rakshith._id });
      console.log(`   Tasks assigned to Rakshith: ${rakshithTasks.length}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugTasks();
