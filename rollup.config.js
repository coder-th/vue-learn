import json from '@rollup/plugin-json';
import ts from 'rollup-plugin-typescript2'
export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/bundle.js',
    format: 'cjs'
  },
  plugins: [ json(),ts()]
};