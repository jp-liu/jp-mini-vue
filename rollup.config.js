import typescript from '@rollup/plugin-typescript'

export default {
  input: './src/index.ts',
  output: [
    // 打包出来的规范选择
    // 1.commonjs
    // 2.esm
    {
      format: 'cjs',
      file: 'lib/jp-liu-mini-vue.cjs.js'
    },
    {
      format: 'es',
      file: 'lib/jp-liu-mini-vue.esm.js'
    }
  ],
  plugins: [typescript()]
}
