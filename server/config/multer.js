import multer from 'multer';
import path from 'path';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary.js';

const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const imageFileFilter = (req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const isImage = file.mimetype.startsWith('image/');
  const isSupportedFormat = allowedExtensions.has(extension);

  if (isImage && isSupportedFormat) {
    callback(null, true);
    return;
  }

  callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'image'));
};

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'passly',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    resource_type: 'image',
  },
});

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});

export default upload;
