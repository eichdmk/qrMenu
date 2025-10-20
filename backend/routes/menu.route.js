import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  getAllMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getMenuItemById
} from '../controllers/menu.controller.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// __dirname для ES-модуля
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Настройка multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = Date.now() + ext;
    cb(null, filename);
  },
});
const upload = multer({ storage });

// CRUD меню — только админ
router.get('/', getAllMenuItems);
router.get('/:id', getMenuItemById);
router.post('/', authenticateToken, isAdmin, upload.single('image'), createMenuItem);
router.put('/:id', authenticateToken, isAdmin, upload.single('image'), updateMenuItem);
router.delete('/:id', authenticateToken, isAdmin, deleteMenuItem);

export default router;
