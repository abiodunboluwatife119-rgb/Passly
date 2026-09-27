import express from 'express';
import {
  applyForVendor,
  getMyApplication,
  getAllApplications,
  approveApplication,
  rejectApplication,
} from '../controllers/vendorApplicationController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, applyForVendor);
router.get('/mine', protect, getMyApplication);
router.get('/', protect, restrictTo('admin'), getAllApplications);
router.patch('/:id/approve', protect, restrictTo('admin'), approveApplication);
router.patch('/:id/reject', protect, restrictTo('admin'), rejectApplication);

export default router;