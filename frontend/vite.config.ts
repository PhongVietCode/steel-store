import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(here, 'src') },
  },
  server: {
    port: 5173,
    proxy: {
      // Optional: avoids CORS entirely when running locally. The client
      // hits /api/* and Vite forwards to the backend at 8080.
      '/api': { target: 'http://localhost:8080', changeOrigin: false },
    },
  },
});
