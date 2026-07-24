import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5274,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.BACKEND_TARGET || 'http://127.0.0.1:3004',
        changeOrigin: true,
      },
    },
  },
});
