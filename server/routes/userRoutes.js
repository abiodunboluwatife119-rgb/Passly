import express from 'express';
import { getAllUsers, updateUserRole } from '../controllers/userController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, restrictTo('admin'), getAllUsers);
router.patch('/:id/role', protect, restrictTo('admin'), updateUserRole);

export default router;