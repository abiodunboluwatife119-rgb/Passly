import express from 'express';
import { uploadImage } from '../controllers/uploadController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import upload from '../config/multer.js';

const router = express.Router();

router.post('/image', protect, restrictTo('vendor', 'admin'), upload.single('image'), uploadImage);

export default router;