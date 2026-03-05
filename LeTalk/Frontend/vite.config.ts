import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      // Forward semua request /letalk ke Django backend
      '/letalk': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // Forward WebSocket /ws ke Django Channels
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
