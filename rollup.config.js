import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default [
  {
    input: 'src/index.js',
    output: [
      {
        file: 'build/pocketfx.esm.js',
        format: 'es',
        sourcemap: true
      },
      {
        file: 'build/pocketfx.cjs.js',
        format: 'cjs',
        sourcemap: true
      },
      {
        file: 'build/pocketfx.umd.js',
        format: 'umd',
        name: 'PocketFX',
        sourcemap: true
      }
    ],
    plugins: [resolve(), commonjs()]
  }
];