import express from 'express';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categories.controller.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// CRUD категорий
router.get('/', getAllCategories);
router.post('/', authenticateToken, isAdmin, createCategory);
router.put('/:id', authenticateToken, isAdmin, updateCategory);
router.delete('/:id', authenticateToken, isAdmin, deleteCategory);

export default router;
