import express from 'express';
import {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  addMenuItem,
  getMyRestaurants,
} from '../controllers/restaurantController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/mine', protect, restrictTo('vendor', 'admin'), getMyRestaurants);
router.get('/', getRestaurants);
router.get('/:id', getRestaurantById);
router.post('/', protect, restrictTo('vendor', 'admin'), createRestaurant);
router.post('/:id/menu', protect, restrictTo('vendor', 'admin'), addMenuItem);

export default router;