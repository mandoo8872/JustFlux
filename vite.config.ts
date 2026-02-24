import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: false, // 개발 시 파일 변경 즉시 감지
    },
  },
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['pdfjs-dist'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-dom/client'],
          'state': ['zustand', 'zustand/middleware/immer', 'immer'],
          'icons': ['phosphor-react'],
          'pdf-viewer': ['pdfjs-dist'],
          'pdf-editor': ['pdf-lib'],
          'ocr': ['tesseract.js', '@zxing/browser'],
        },
      },
    },
  },
  css: {
    devSourcemap: true, // CSS 디버깅 용이
  },
})
