import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { uploadImage, deleteImage } from '../controllers/uploads.controller.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

export default async function uploadsRoutes(fastify, options) {
  fastify.post('/', { preHandler: [authenticateToken, isAdmin] }, uploadImage);

  fastify.delete('/:filename', { preHandler: [authenticateToken, isAdmin] }, deleteImage);
}
