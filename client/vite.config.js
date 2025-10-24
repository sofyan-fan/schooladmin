import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'url';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [react(), tailwindcss(), svgr()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Optional: local proxy for API during dev
  // server: {
  //   proxy: {
  //     target: 'http://localhost:3000',
  //     changeOrigin: true,
  //     secure: false,
  //     rewrite: (p) => p.replace(/^\/api/, ''), // strip /api → your Express routes
  //   },
  // },
});
