import express from 'express';
import {
  getAllRecurringTasks,
  createRecurringTask,
  updateRecurringTask,
  deleteRecurringTask,
  toggleRecurringTask,
  triggerRecurringTasks
} from '../controllers/recurringTask.controller.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, getAllRecurringTasks);
router.post('/', verifyToken, createRecurringTask);
router.post('/trigger-now', verifyToken, triggerRecurringTasks);
router.put('/:id', verifyToken, updateRecurringTask);
router.delete('/:id', verifyToken, deleteRecurringTask);
router.patch('/:id/toggle', verifyToken, toggleRecurringTask);

export default router;
