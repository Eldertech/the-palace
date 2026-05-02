import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { blackboardMiddleware } from './server/middleware.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// PALACE_ROOT env override → use it. Otherwise: app/ is at
// <palace>/_ops/stigmergy/app/, so palace root is three levels up.
const PALACE_ROOT = process.env.PALACE_ROOT
  ? resolve(process.env.PALACE_ROOT)
  : resolve(__dirname, '../../..');

export default defineConfig({
  plugins: [
    react(),
    blackboardMiddleware(PALACE_ROOT),
  ],
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      // The design-system files we read from at dev-time live above the app/
      // directory, so widen the served-file allow-list.
      allow: ['..'],
    },
  },
});
