import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      // Allow serving files from the design-system directory (one level up)
      // so the design-system's CSS @import + relative woff2 paths resolve.
      allow: ['..'],
    },
  },
});
