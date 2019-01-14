import camelCase from 'lodash.camelcase';
import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';
import sourceMaps from 'rollup-plugin-sourcemaps';

const pkg = require('./package.json');
const libraryName = 'intersection-observer-admin';

export default {
  external: [],
  input: `dist/es/index.js`,
  output: [
    { file: pkg.main, name: camelCase(libraryName), format: 'umd' },
    { file: pkg.module, format: 'es' }
  ],
  plugins: [
    typescript({
      typescript: require('typescript'),
    }),
    // Resolve source maps to the original source
    sourceMaps()
  ],
  sourcemap: true,
  // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
  watch: {
    include: 'dist/es/**'
  }
};
