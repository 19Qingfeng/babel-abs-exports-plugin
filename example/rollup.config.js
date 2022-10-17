const { babel } = require('@rollup/plugin-babel');
const babelPluginImport = require('../lib/index').default;
const commonjs = require('@rollup/plugin-commonjs').default;

module.exports = {
  input: ['./main.js'],
  plugins: [
    // commonjs
    commonjs(),
    babel({
      presets: [
        [
          'babel-preset-env',
          {
            modules: false,
          },
        ],
      ],
      plugins: [
        babelPluginImport({
          patterns: [
            {
              source: '@MyTestPackage',
              match: ['@mui/material'],
            },
          ],
        }),
      ],
    }),
  ],
  external: ['react', 'react-dom', '@mui/material'],
  output: {
    file: 'dist/main.js',
  },
};

// 我需要做的是不进行额外引入，同样针对于每一个Icon的引入都需要是一个独立的文件对吧
//

// const path = require('path')
// console.log(require.resolve('loose-envify'));

// 比方说 import { Button } from '@xxx'

// 首先判断是否存在幽灵依赖处理
// 1. pnpm && 默认不提升 -> 幽灵依赖查找规则
// 2. 非 pnpm

// 1. 优先支持查找 @xxx/node_modules/Button路径 文件
// 2. 如果是非 Npm 的话，那么刚好直接调用 require.resolve 即可
