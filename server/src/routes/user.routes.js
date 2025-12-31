import express from 'express';
import { getAllUsers, updateUserRole } from '../controllers/user.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, getAllUsers);
router.patch('/:id/role', verifyToken, requireRole('Admin'), updateUserRole);

export default router;
