import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../uploads');

export const uploadImage = (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Файл не загружен' });

  res.status(201).json({ image_url: `/uploads/${req.file.filename}` });
};

// Удаление изображения
export const deleteImage = (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Файл не найден' });
    }

    fs.unlinkSync(filePath);
    res.json({ message: 'Файл успешно удалён' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при удалении файла' });
  }
};
