import camelCase from 'lodash.camelcase';
import typescript from 'rollup-plugin-typescript2';
import sourceMaps from 'rollup-plugin-sourcemaps';

const pkg = require('./package.json');
const libraryName = 'intersection-observer-admin';

export default {
  external: [],
  input: `dist/es/index.js`,
  output: [
    { file: pkg.main, name: camelCase(libraryName), format: 'umd', sourcemap: true },
    { file: pkg.module, format: 'es', sourcemap: true }
  ],
  plugins: [
    typescript({
      typescript: require('typescript'),
    }),
    // Resolve source maps to the original source
    sourceMaps()
  ],
  // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
  watch: {
    include: 'dist/es/**'
  }
};
