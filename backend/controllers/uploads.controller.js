import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../uploads');

// Настройки оптимизации изображений
const OPTIMIZATION_CONFIG = {
  maxWidth: 1920,        // Максимальная ширина в пикселях
  maxHeight: 1920,       // Максимальная высота в пикселях
  quality: 85,           // Качество JPEG/WebP (0-100)
  webpQuality: 80,       // Качество WebP (обычно можно ниже)
  jpegQuality: 85,       // Качество JPEG
  pngCompression: 9,     // Сжатие PNG (0-9, где 9 - максимальное)
};

export const uploadImage = async (request, reply) => {
  try {
    const data = await request.file();
    if (!data) return reply.status(400).send({ message: 'Файл не загружен' });

    const buffer = await data.toBuffer();
    const originalFilename = data.filename;
    const fileExtension = path.extname(originalFilename).toLowerCase();
    const baseFilename = path.basename(originalFilename, fileExtension);
    
    // Определяем формат для сохранения
    const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(fileExtension);
    
    if (!isImage) {
      return reply.status(400).send({ message: 'Поддерживаются только изображения (JPG, PNG, WebP, GIF)' });
    }

    let optimizedBuffer;
    let outputExtension;
    let outputFilename;

    try {
      // Обрабатываем изображение с помощью sharp
      let imageProcessor = sharp(buffer);
      
      // Получаем метаданные изображения
      const metadata = await imageProcessor.metadata();
      
      // Определяем, нужно ли изменять размер
      const needsResize = metadata.width > OPTIMIZATION_CONFIG.maxWidth || 
                         metadata.height > OPTIMIZATION_CONFIG.maxHeight;
      
      if (needsResize) {
        imageProcessor = imageProcessor.resize(
          OPTIMIZATION_CONFIG.maxWidth,
          OPTIMIZATION_CONFIG.maxHeight,
          {
            fit: 'inside',  // Сохраняет пропорции
            withoutEnlargement: true  // Не увеличивает маленькие изображения
          }
        );
      }

      // Конвертируем в WebP для лучшего сжатия (если поддерживается)
      // Для PNG с прозрачностью оставляем PNG, но оптимизируем
      if (metadata.hasAlpha && fileExtension === '.png') {
        // PNG с прозрачностью - оптимизируем PNG
        optimizedBuffer = await imageProcessor
          .png({ 
            compressionLevel: OPTIMIZATION_CONFIG.pngCompression,
            quality: OPTIMIZATION_CONFIG.quality 
          })
          .toBuffer();
        outputExtension = '.png';
      } else {
        // Конвертируем в WebP для лучшего сжатия
        optimizedBuffer = await imageProcessor
          .webp({ quality: OPTIMIZATION_CONFIG.webpQuality })
          .toBuffer();
        outputExtension = '.webp';
      }

      // Генерируем имя файла
      const timestamp = Date.now();
      outputFilename = `${timestamp}-${baseFilename}${outputExtension}`;
      const filepath = path.join(uploadDir, outputFilename);
      
      // Сохраняем оптимизированное изображение
      await fs.promises.writeFile(filepath, optimizedBuffer);

      // Логируем информацию об оптимизации
      const originalSize = buffer.length;
      const optimizedSize = optimizedBuffer.length;
      const savings = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
      
      console.log(`Изображение оптимизировано: ${originalFilename}`);
      console.log(`  Оригинал: ${(originalSize / 1024).toFixed(2)} KB`);
      console.log(`  Оптимизировано: ${(optimizedSize / 1024).toFixed(2)} KB`);
      console.log(`  Экономия: ${savings}%`);

      return reply.status(201).send({ 
        image_url: `/uploads/${outputFilename}`,
        original_size: originalSize,
        optimized_size: optimizedSize,
        savings_percent: parseFloat(savings)
      });
    } catch (optimizationError) {
      // Если оптимизация не удалась, сохраняем оригинал
      console.warn('Ошибка оптимизации, сохраняем оригинал:', optimizationError.message);
      const timestamp = Date.now();
      outputFilename = `${timestamp}-${originalFilename}`;
      const filepath = path.join(uploadDir, outputFilename);
      await fs.promises.writeFile(filepath, buffer);
      
      return reply.status(201).send({ image_url: `/uploads/${outputFilename}` });
    }
  } catch (err) {
    console.error('Ошибка при загрузке файла:', err);
    return reply.status(500).send({ message: 'Ошибка при загрузке файла' });
  }
};

// Удаление изображения
export const deleteImage = async (request, reply) => {
  try {
    const { filename } = request.params;
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return reply.status(404).send({ message: 'Файл не найден' });
    }

    fs.unlinkSync(filePath);
    return reply.send({ message: 'Файл успешно удалён' });
  } catch (err) {
    console.error(err);
    return reply.status(500).send({ message: 'Ошибка при удалении файла' });
  }
};
