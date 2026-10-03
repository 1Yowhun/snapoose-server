import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
  },
  plugins: [
    // Gunakan plugin SWC agar Vitest memproses TypeScript Decorators NestJS dengan benar
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
});
