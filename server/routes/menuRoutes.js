import express from 'express';
import { updateMenuItem, deleteMenuItem, searchMenuItems } from '../controllers/restaurantController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/search', searchMenuItems);
router.patch('/:id', protect, restrictTo('vendor', 'admin'), updateMenuItem);
router.delete('/:id', protect, restrictTo('vendor', 'admin'), deleteMenuItem);

export default router;