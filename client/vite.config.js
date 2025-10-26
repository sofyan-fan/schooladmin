import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'url';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [react(), tailwindcss(), svgr()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
  host: true, 
  port: 5173,
  allowedHosts: [
    'school-admin.nl',
    'www.school-admin.nl' 
  ],
  proxy: {
    '/api': {
      target: 'http://server:3000', 
      changeOrigin: true,
      secure: false,
    },
  },
},
});
