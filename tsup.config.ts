import { defineConfig } from 'tsup';

export default defineConfig({
  entryPoints: ['src/index.ts'],
  dts: true,
  clean: true,
  format: 'esm',
  splitting: true,
  sourcemap: false,
  external: [
    '@vue',
    'vue',
    'dayjs',
    'element-plus',
    'axios',
    'vue-router',
  ],
  minify: true,
  // esbuildOptions: {
  //   target: 'es2020',
  // },
})