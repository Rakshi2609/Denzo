import express from 'express';
import { getStats, getCalendar, getOverdue } from '../controllers/dashboard.controller.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', verifyToken, getStats);
router.get('/calendar', verifyToken, getCalendar);
router.get('/overdue', verifyToken, getOverdue);

export default router;
