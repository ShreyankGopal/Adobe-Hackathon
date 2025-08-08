import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'pdfembedapi.com', // ✅ allows external access
    port: 5173,
    open: true,
    allowedHosts: ['pdfembedapi.com'], // ✅ add your ngrok host here
  },
});
