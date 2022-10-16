import { analyzeImportee, generateExp, matchPattern } from "./utils/import";
import { analyzeRequire, findMatchedSource, generateRequireExp } from "./utils/require";


export type Pattern = { source: string, match: string[] }

export type Patterns = Array<Pattern>


/**
 * TODO:
 * 1. getPnpmPath 中 require.resolve 处理 done
 * 2. import { Button as _Button } 重命名处理 done
 * 3. 动态参数处理，支持多个参数。 done
 * 4. 代码逻辑整理 done
 * 5. const t = require('@babel/types') done
 * 6. 包依赖整理
 * 7. require 方式扔存在问题
 */
const babelPluginImport = (options: {
  patterns?: Array<{ source: string, match: string[] }>
} = {}) => {
  // 参数处理 validateSchema
  const { patterns = [{
    source: '@mui/material', // 原本路径
    match: ['@mui/material'], // 优先尝试寻找的包路径
  }] } = options;

  return {
    visitor: {
      // ESM 处理
      ImportDeclaration(nodePath) {
        const { node } = nodePath
        // 节点通过插件生成的不需要再次处理了
        if (node.__$done) {
          return;
        }
        const { specifiers, source } = node
        const pattern = matchPattern(patterns, source.value)
        if (!pattern) {
          return;
        }
        // 分离语句
        const { original, transform } = analyzeImportee(specifiers, pattern, source.value)
        // 生成最终的节点
        const { replaceNode, originalNode } = generateExp(original, transform)
        // 标记插件生成的引入为 __$done=true
        // 生成的节点
        originalNode.__$done = true
        nodePath.replaceWithMultiple(replaceNode)
        nodePath.skip()
      },
      // SSR 处理
      VariableDeclarator(nodePath) {
        const { node } = nodePath
        if (node.__$done) {
          return;
        }
        const { id, init } = node
        const originPckName = init?.arguments?.[0]?.value
        // 寻找对应的节点语句是否是
        const pattern = findMatchedSource(patterns, init)
        if (!pattern || !originPckName) {
          return
        }
        // 需要转化的list 
        // TODO: 这里分割有问题
        const { original, transform } = analyzeRequire(id, pattern, originPckName)
        console.log(original, transform, '分割完后的')
        // 转化后的节点
        const { replaceNode, originalNode } = generateRequireExp(original, transform)
        // 标记生成的节点
        if (originalNode) {
          originalNode.__$done = true
        }
        console.log(originalNode, 'originalNode')
        console.log(replaceNode, 'replaceNode')
        nodePath.replaceWithMultiple(replaceNode)
        nodePath.stop()
      }
    },
  };
}

export default babelPluginImport