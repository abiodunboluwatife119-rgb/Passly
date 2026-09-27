import express from 'express';
import { getMyTickets, getTicketByCode, verifyTicket } from '../controllers/ticketController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/me', protect, getMyTickets);
router.get('/:code', protect, getTicketByCode);
router.post('/verify', protect, restrictTo('vendor', 'admin'), verifyTicket);

export default router;