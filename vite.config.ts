
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 確保在 GitHub Pages 子路徑下能正確讀取資源
  define: {
    // 僅將 Gemini API_KEY 注入，Firebase 設定改為在程式碼中直接管理
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
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
