import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const result = await mongoose.connection.db.collection('tasks').deleteOne({
    _id: new mongoose.Types.ObjectId('695565baa7641e63fe5f7b65')
  });
  console.log('Deleted task:', result.deletedCount);
  process.exit(0);
});
