import fs from 'fs'
import path from 'path'
// the order here matters, more specific one comes first
export const LOCKS: Record<string, string> = {
  'bun.lockb': 'bun',
  'pnpm-lock.yaml': 'pnpm',
  'yarn.lock': 'yarn',
  'package-lock.json': 'npm',
  'npm-shrinkwrap.json': 'npm',
}

let topLevelFiles: string[]

/**
 * TODO: 监听顶部文件变动，现在每次启动时仅会读取一次
 * 获取顶层所有文件名称
 * @param rootPath 目录
 * @returns 
 */
export const scanTopLevelFiles = async (rootPath: string) => {
  if (topLevelFiles.length > 0) {
    return topLevelFiles
  } else {
    topLevelFiles = await fs.promises.readdir(rootPath, { encoding: 'utf-8' })
    return topLevelFiles
  }
}

/**
 * 根据文件目录判断使用的包管理工具
 * @param files 文件目录
 * @returns 
 */
export const scanPckManager = async (files: string[]) => {
  let pnpm, yarn, npm, bun
  for (let i = 0; i < files.length; i++) {
    const filename = files[i]
    switch (filename) {
      case 'pnpm-lock.yaml':
        pnpm = true
        break;
      case 'yarn.lock':
        yarn = true
        break;
      case 'bun.lockb':
        bun = true
        break;
      default:
        npm = true
        break;
    }
  }
  return {
    pnpm,
    yarn,
    bun,
    npm
  }
}


// 查看是否是幽灵依赖 TODO: 其实不用
// 1. 我优先查找 .pnpm
// export const isGhostPeer = async (rootPath: string) => {
//   const files = await scanTopLevelFiles(rootPath)
//   const { pnpm, yarn, bun, npm } = await scanPckManager(files)
//   // pnpm 不存在扁平化目录
//   if (!pnpm) {
//     return false
//   }
//   if (pnpm) {

//     // 检查顶层是否存在 .npmrc
//     // 两种情况 
//   }
// }

const getPnpmPath = (packageName: string) => {
  const pnpmPath = path.join(process.cwd(), 'node_modules', '.pnpm', 'node_modules', packageName)
  // 检查目录是否存在
  const isExist = fs.existsSync(pnpmPath)
  return isExist ? pnpmPath : null
}

export const searchPackages = (searchName: string) => {
  let packagePath
  try {
    // TODO: 这里得处理下
    // TODO: 这里的模块路径查找不太对 normal search
    packagePath = path.resolve(require.resolve(searchName), '../')

    // 他妈的 寻找到 package.json 后

    // 我只是需要对应的包路径即可
    console.log('innerpackagePath', packagePath)
  } catch {
    // search by pnpm path
    packagePath = getPnpmPath(searchName)
    console.log('pnpm packagePath', packagePath)
  }
  if (!packagePath) {
    return null
  }
  return packagePath
}


