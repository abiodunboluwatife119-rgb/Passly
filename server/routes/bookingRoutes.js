import express from 'express';
import {
    createBooking,
    getMyBookings,
    getVendorBookings,
    getBookingById,
    cancelBooking,
} from '../controllers/bookingController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createBooking);
router.get('/me', protect, getMyBookings);
router.get('/vendor', protect, restrictTo('vendor', 'admin'), getVendorBookings);
router.get('/:id', protect, getBookingById);
router.patch('/:id/cancel', protect, cancelBooking);

export default router;