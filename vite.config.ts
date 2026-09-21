import { defineConfig } from 'vite';
import netlify from '@netlify/vite-plugin';

export default defineConfig({
  plugins: [netlify()],
  server: { host: '0.0.0.0', port: 5173, strictPort: true },
});
