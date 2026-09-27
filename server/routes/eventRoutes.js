import express from 'express';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getMyEvents,
} from '../controllers/eventController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/mine', protect, restrictTo('vendor', 'admin'), getMyEvents);
router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', protect, restrictTo('vendor', 'admin'), createEvent);
router.patch('/:id', protect, restrictTo('vendor', 'admin'), updateEvent);
router.delete('/:id', protect, restrictTo('vendor', 'admin'), deleteEvent);

export default router;