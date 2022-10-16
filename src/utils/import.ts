import { Patterns } from "src"
import { searchPackages } from "."
import path from 'path'
import { importDeclaration, importDefaultSpecifier, stringLiteral, importSpecifier } from '@babel/types'

/**
 * 寻找匹配的规则
 * @param patterns Patterns 外部传入的匹配规则
 * @param packageName 模块内引入的包名
 * @returns null | 匹配的 pattern
 */
export const matchPattern = (
  patterns: Patterns,
  packageName: string
) => patterns.find(pattern => pattern.source === packageName)

/**
 * 分析当前 import 语句，分离需要单独引入的包
 * @param specifiers 
 * @param pattern 
 * @param originPckName 
 * @returns 
 */
export const analyzeImportee = (specifiers, pattern, originPckName) => {
  const original = [] // 保留的具名原始引入语句
  const transform = [] // 需要转化的单独 export default

  specifiers.forEach(specifier => {
    const { imported, local } = specifier
    // 这里的 searchPackages 要进行寻找
    // 这里需要一个一个进行查找
    const searchMatch = pattern.match
    const defaultImportPath = searchMatch.find(replacePath => {
      return searchPackages(path.join(`${replacePath}`, imported.name))
    })

    if (defaultImportPath) {
      transform.push({
        imported,
        local,
        transformPath: defaultImportPath,
      })
    } else {
      original.push({
        imported,
        local,
        transformPath: originPckName
      })
    }
  })
  return {
    original,
    transform
  }
}

/**
 * 生成最终节点
 * @param original 
 * @param transform 
 * @returns 
 */
export const generateExp = (original, transform) => {
  let transformExp;
  let originExp;
  // 需要修改的语句集合
  transformExp = transform.map(namedExport => {
    const { local, transformPath } = namedExport
    // 生成节点
    return importDeclaration(
      [importDefaultSpecifier(local)],
      stringLiteral(transformPath)
    )
  })

  // 需要保留的原始引入语句
  if (original && original.length > 0) {
    const transformPath = original[0].transformPath

    originExp = importDeclaration(
      // 这里应该是多个
      original.map(originalExport => {
        const { imported, local } = originalExport
        return importSpecifier(local, imported)
      }),
      // 这里填写 source
      stringLiteral(transformPath)
    )
  }
  let replaceNode = []
  if (transformExp && transformExp.length > 0) {
    replaceNode = replaceNode.concat(transformExp)
  }
  if (originExp) {
    replaceNode = replaceNode.concat(originExp)
  }
  return {
    replaceNode,
    transformNodes: transformExp,
    originalNode: originExp
  }
}
