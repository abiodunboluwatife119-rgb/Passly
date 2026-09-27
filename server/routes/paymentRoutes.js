import express from 'express';
import { mockSuccess, getPaymentById } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/mock-success', protect, mockSuccess);
router.get('/:id', protect, getPaymentById);

export default router;