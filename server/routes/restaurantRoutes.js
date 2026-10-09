import express from 'express';
import {
  getRestaurants,
  getMyRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  addMenuItem,
} from '../controllers/restaurantController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getRestaurants);
router.get('/mine', protect, restrictTo('vendor', 'admin'), getMyRestaurants);
router.get('/:id', getRestaurantById);
router.post('/', protect, restrictTo('vendor', 'admin'), createRestaurant);
router.patch('/:id', protect, restrictTo('vendor', 'admin'), updateRestaurant);
router.delete('/:id', protect, restrictTo('vendor', 'admin'), deleteRestaurant);
router.post('/:id/menu', protect, restrictTo('vendor', 'admin'), addMenuItem);

export default router;