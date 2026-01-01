import express from 'express';
import {
  getAllTasks,
  getMyTasks,
  getFollowUps,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getTaskUpdates,
  addComment,
  completeTask,
  deleteTaskByBody,
  toggleReaction
} from '../controllers/task.controller.js';
import { verifyToken } from '../middleware/auth.js';
import { canEditTask, canUpdateStatus, canComment } from '../middleware/taskPermissions.js';

const router = express.Router();

router.get('/', verifyToken, getAllTasks);
router.get('/my-tasks', verifyToken, getMyTasks);
router.get('/follow-ups', verifyToken, getFollowUps);
router.get('/:id', verifyToken, getTaskById);
router.post('/', verifyToken, createTask);
router.put('/:id', verifyToken, canEditTask, updateTask);
router.patch('/:id/status', verifyToken, canUpdateStatus, updateTaskStatus);
router.patch('/complete', verifyToken, completeTask);
router.delete('/delete', verifyToken, deleteTaskByBody);
router.delete('/:id', verifyToken, canEditTask, deleteTask);
router.get('/:taskId/updates', verifyToken, getTaskUpdates);
router.post('/:taskId/updates', verifyToken, canComment, addComment);
router.post('/:taskId/updates/:updateId/react', verifyToken, toggleReaction);

export default router;
