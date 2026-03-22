import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      lib: path.resolve(__dirname, 'src/lib'),
      routes: path.resolve(__dirname, 'src/routes'),
      'app.js': path.resolve(__dirname, 'src/app.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
