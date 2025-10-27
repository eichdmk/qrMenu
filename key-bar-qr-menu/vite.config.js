import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  
  // Оптимизация производительности
  build: {
    // Минификация и оптимизация
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Удаляем console.log в production
        drop_debugger: true,
      },
    },
    
    // Code splitting - разбиваем на чанки
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['react-toastify'],
        },
      },
    },
    
    // Оптимизация размера bundle
    chunkSizeWarningLimit: 1000,
    
    // Source maps для production (можно отключить для производительности)
    sourcemap: false,
  },
  
  // Оптимизация зависимостей
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-toastify',
      'axios',
    ],
  },
  
  // Настройки сервера для dev
  server: {
    // Горячая перезагрузка
    hmr: true,
  },
})
