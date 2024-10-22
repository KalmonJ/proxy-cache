import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src'],
  outDir: 'dist',
  format: ["cjs"],
  splitting: true,
  dts: true,
  sourcemap: true,
  clean: true,
});
