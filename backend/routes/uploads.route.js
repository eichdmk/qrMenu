import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { uploadImage, deleteImage } from '../controllers/uploads.controller.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Для __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = Date.now() + ext;
    cb(null, filename);
  },
});
const upload = multer({ storage });

// Загрузка изображения (только админ)
router.post('/', authenticateToken, isAdmin, upload.single('image'), uploadImage);

// Удаление изображения (только админ)
router.delete('/:filename', authenticateToken, isAdmin, deleteImage);

export default router;
