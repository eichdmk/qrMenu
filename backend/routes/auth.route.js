import express from 'express';
import { loginAdmin } from '../controllers/auth.controller.js';

const router = express.Router();

// Логин администратора
router.post('/login', loginAdmin);

export default router;
