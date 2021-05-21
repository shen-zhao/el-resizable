import path from 'path';
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: path.resolve(__dirname, 'src/core/resizable.js'),
  output: {
    file: 'dist/index.js',
    format: 'umd',
    name: "Resizable"
  },
  plugins: [
    resolve()
  ]
}