import express from 'express';
import {
  getCars,
  getCarById,
  createCar,
  updateCar,
  deleteCar,
  getMyCars,
} from '../controllers/carController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/mine', protect, restrictTo('vendor', 'admin'), getMyCars);
router.get('/', getCars);
router.get('/:id', getCarById);
router.post('/', protect, restrictTo('vendor', 'admin'), createCar);
router.patch('/:id', protect, restrictTo('vendor', 'admin'), updateCar);
router.delete('/:id', protect, restrictTo('vendor', 'admin'), deleteCar);

export default router;