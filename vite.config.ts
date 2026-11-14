import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// All Gemini calls must go through the Express backend:
//   POST /app/server/api/v1/admin/ai/generate
// ISSUE 8 FIX: server-only packages listed as externals so Vite never
// tries to bundle them if a transitive import resolves to them.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
  },
  build: {
    outDir: 'build',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      external: [
        'express',
        'mongoose',
        'better-sqlite3',
        'bcryptjs',
        'multer',
        'cloudinary',
        'jsonwebtoken',
        'mongodb',
      ],
    },
  },
});
