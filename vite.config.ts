
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 確保在 GitHub Pages 子路徑下能正確讀取資源
  define: {
    // 注入環境變數，若不存在則為 undefined，讓前端代碼進行空值檢查
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
    'process.env.FIREBASE_CONFIG': JSON.stringify(process.env.FIREBASE_CONFIG),
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // 生產環境可保留 console 或設為 true 移除
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom', 'firebase/app', 'firebase/auth', 'firebase/firestore'],
          'ui': ['recharts', 'lucide-react']
        }
      }
    }
  },
});
