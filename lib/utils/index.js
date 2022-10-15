"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchPackages = exports.scanPckManager = exports.scanTopLevelFiles = exports.LOCKS = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// the order here matters, more specific one comes first
exports.LOCKS = {
    'bun.lockb': 'bun',
    'pnpm-lock.yaml': 'pnpm',
    'yarn.lock': 'yarn',
    'package-lock.json': 'npm',
    'npm-shrinkwrap.json': 'npm',
};
let topLevelFiles;
/**
 * TODO: 监听顶部文件变动，现在每次启动时仅会读取一次
 * 获取顶层所有文件名称
 * @param rootPath 目录
 * @returns
 */
const scanTopLevelFiles = (rootPath) => __awaiter(void 0, void 0, void 0, function* () {
    if (topLevelFiles.length > 0) {
        return topLevelFiles;
    }
    else {
        topLevelFiles = yield fs_1.default.promises.readdir(rootPath, { encoding: 'utf-8' });
        return topLevelFiles;
    }
});
exports.scanTopLevelFiles = scanTopLevelFiles;
/**
 * 根据文件目录判断使用的包管理工具
 * @param files 文件目录
 * @returns
 */
const scanPckManager = (files) => __awaiter(void 0, void 0, void 0, function* () {
    let pnpm, yarn, npm, bun;
    for (let i = 0; i < files.length; i++) {
        const filename = files[i];
        switch (filename) {
            case 'pnpm-lock.yaml':
                pnpm = true;
                break;
            case 'yarn.lock':
                yarn = true;
                break;
            case 'bun.lockb':
                bun = true;
                break;
            default:
                npm = true;
                break;
        }
    }
    return {
        pnpm,
        yarn,
        bun,
        npm
    };
});
exports.scanPckManager = scanPckManager;
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
const getPnpmPath = (packageName) => {
    const pnpmPath = path_1.default.join(process.cwd(), 'node_modules', '.pnpm', 'node_modules', packageName);
    // 检查目录是否存在
    const isExist = fs_1.default.existsSync(pnpmPath);
    return isExist ? pnpmPath : null;
};
const searchPackages = (searchName) => {
    let packagePath;
    try {
        // TODO: 这里得处理下
        // TODO: 这里的模块路径查找不太对 normal search
        packagePath = path_1.default.resolve(require.resolve(searchName), '../');
        // 他妈的 寻找到 package.json 后
        // 我只是需要对应的包路径即可
        console.log('innerpackagePath', packagePath);
    }
    catch (_a) {
        // search by pnpm path
        packagePath = getPnpmPath(searchName);
        console.log('pnpm packagePath', packagePath);
    }
    if (!packagePath) {
        return null;
    }
    return packagePath;
};
exports.searchPackages = searchPackages;
