import path from "path"
import { searchPackages } from "."
import { Pattern, Patterns } from '../index'
import { variableDeclaration, variableDeclarator, identifier, callExpression, stringLiteral, objectPattern, objectProperty } from '@babel/types'
import chalk from 'chalk'
import generate from '@babel/generator'

/**
 * 寻找匹配 require 语的包
 * @param patterns 
 * @param initDeclarator 
 * @returns 
 */
export const findMatchedSource = (patterns: Patterns, initDeclarator) => {
  const { callee, arguments: _arg } = initDeclarator
  const declarator = callee.name // require
  try {
    const packageName = _arg[0].value
    // 匹配的包名称
    if (declarator !== 'require') {
      return null
    }
    const matchedPattern = patterns.find(pattern => {
      const { source } = pattern
      return source === packageName
    })

    return matchedPattern
  } catch (e) {
    console.log(
      chalk.red(
        `require package error by findMatchedSource!`
      )
    )
    throw e
  }

}

/**
 * 分析require语句，尝试单独模块引入
 * @param objectPattern 
 * @param pattern 
 * @param originPckName 
 * @returns 
 */
export const analyzeRequire = (objectPattern, pattern: Pattern, originPckName) => {
  const { properties } = objectPattern
  const original = []
  const transform = []
  properties.forEach(property => {
    const { key, value } = property
    const originalName = key.name
    const replaceName = value.name
    // 拿 originalName 去寻找，
    // searchMatch
    const searchMatch = pattern.match
    const defaultRequirePath = searchMatch.find(replacePath => {
      return searchPackages(path.join(replacePath, originalName))
    })
    if (defaultRequirePath) {
      transform.push({
        properties,
        replaceName,
        transformPath: defaultRequirePath
      })
    } else {
      original.push({
        properties,
        originalName,
        replaceName,
        transformPath: originPckName
      })
    }
  })
  return {
    original,
    transform
  }
}

export const generateRequireExp = (original, transform) => {
  // 根据对应的list生成对应的节点
  let transformExp;
  let originExp;
  // 需要修改的导入语句
  transformExp = transform.map(namedExport => {
    const { transformPath, replaceName } = namedExport
    return variableDeclaration('const', [
      variableDeclarator(
        identifier(replaceName),
        callExpression(
          identifier('require'),
          // 修改后的路径
          [stringLiteral(transformPath)]
        )
      )
    ])
  })
  // 从原始包中引入的 require 语句
  if (original && original.length > 0) {
    const originPath = original?.[0].transformPath
    originExp = variableDeclaration('const', [
      variableDeclarator(
        objectPattern(
          original.map(origin => {
            return objectProperty(
              identifier(origin.originalName), // 原始的名称
              identifier(origin.replaceName)// 新的名称
            )
          })
        ),
        // 左边应该是是 Object 而不是数组
        // 右边应该是引入的语句
        callExpression(
          identifier('require'),
          // 修改后的路径 原始的包路径
          [stringLiteral(originPath)]
        )
      )
    ])
  }

  let replaceNode = []

  if (transformExp && transformExp.length > 0) {
    replaceNode = replaceNode.concat(transformExp)
  }
  if (originExp) {
    replaceNode = replaceNode.concat(originExp)
  }
  // console.log(originExp, '看看生成后的代码')
  console.log(generate(originExp), '原始保留的节点')
  transformExp.forEach(node => {
    console.log(generate(node), '转化后的节点')
  })
  console.log('结束一下')
  // replaceNode
  return {
    replaceNode,
    transformNodes: transformExp,
    originalNode: originExp
  }
}