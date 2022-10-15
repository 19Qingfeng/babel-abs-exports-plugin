// import { isGhostPeer } from './utils/index'
// TODO: 后续处理成为 babel Plugin 形式
import { searchPackages } from "./utils"
// import t from '@babel/types'
const t = require('@babel/types')
// const gen = require('@babel/generator')

/**
 * TODO:
 * 1. getPnpmPath 中 require.resolve 处理
 * 2. import { Button as _Button } 重命名处理
 * 3. 动态参数处理，支持多个参数。
 * 4. 代码逻辑整理
 * 5. const t = require('@babel/types') import 处理
 * 6. 包依赖整理
 */
const babelPluginImport = (options: {
  patterns?: string[]
} = {}) => {

  const { patterns = ['@mui/material'] } = options;

  return {
    visitor: {
      // ESM 处理
      ImportDeclaration(nodePath) {
        const { node } = nodePath
        const { specifiers, source } = node
        const process = patterns.find((pattern) => pattern === source.value)
        if (!process) {
          // don't do nothing
          return;
        }

        const original = []
        const transform = []
        specifiers.forEach(specifier => {
          const { imported, local } = specifier
          const defaultPckPath = searchPackages(`@mui/material/${imported.name}`)

          if (defaultPckPath) {
            transform.push({
              imported,
              local,
              transformPath: defaultPckPath,
            })
          } else {
            original.push({
              imported,
              local,
              transformPath: source.value
            })
          }
        })
        // 最终的节点
        let transformExp;
        let originExp;
        // 生成具名引入
        transformExp = transform.map(namedExport => {
          const { imported, local, transformPath } = namedExport
          // 生成节点
          return t.importDeclaration(
            [t.importDefaultSpecifier(local)],
            t.stringLiteral(transformPath)
          )
        })

        // 保留的原始节点 这里生成一个语句就够了
        if (original && original.length > 0) {
          const transformPath = original[0].transformPath

          originExp = t.importDeclaration(
            // 这里应该是多个
            original.map(originalExport => {
              const { imported, local } = originalExport
              // TODO: ImportNamespaceSpecifier 重命名处理
              return t.importSpecifier(local, imported)
            }),
            // 这里填写 source
            t.stringLiteral(transformPath)
          )
        }
        nodePath.replaceWithMultiple([...transformExp, originExp])
        nodePath.stop()
      },
      // SSR 处理
      VariableDeclarator() {
      }
    },
  };
}

export default babelPluginImport