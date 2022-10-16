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

const getPnpmPath = (packageName: string) => {
  const pnpmPath = path.join(process.cwd(), 'node_modules', '.pnpm', 'node_modules', packageName)
  // 检查目录是否存在
  const isExist = fs.existsSync(pnpmPath)
  return isExist ? pnpmPath : null
}

/**
 * 查找安装目录的包地址
 * @param searchName 
 * @returns 
 */
export const searchPackages = (searchName: string) => {
  let packagePath
  try {
    const packageMain = path.resolve(require.resolve(searchName))
    // 包目录文件
    packagePath = path.dirname(packageMain)
  } catch {
    packagePath = getPnpmPath(searchName)
  }

  if (!packagePath || !fs.existsSync(packagePath)) {
    return null
  }

  return packagePath
}


