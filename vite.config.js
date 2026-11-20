import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  // Unit tests: DOM helpers need a browser-like environment.
  test: { environment: 'jsdom', include: ['tests/**/*.test.js'], restoreMocks: true },
});
