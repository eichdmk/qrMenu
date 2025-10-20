import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createDefaultAdmin } from './utils/initAdmin.js';

// Роуты
import menuRoutes from './routes/menu.route.js';
import ordersRoutes from './routes/orders.route.js';
import tablesRoutes from './routes/tables.route.js';
import reservationsRoutes from './routes/reservations.route.js';
import uploadRoutes from './routes/uploads.route.js';
import categoriesRoutes from './routes/categories.route.js';
import authRoutes from './routes/auth.route.js'; 

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/menu', menuRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/tables', tablesRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/auth', authRoutes); 
app.use('/api/categories', categoriesRoutes);

app.get('/', (req, res) => {
  res.send('QR-Меню сервер работает!');
});

createDefaultAdmin();


app.use((req, res) => {
  res.status(404).json({ message: 'Эндпоинт не найден' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
