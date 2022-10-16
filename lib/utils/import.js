"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateExp = exports.analyzeImportee = exports.matchPattern = void 0;
const _1 = require(".");
const path_1 = __importDefault(require("path"));
const types_1 = require("@babel/types");
/**
 * 寻找匹配的规则
 * @param patterns Patterns 外部传入的匹配规则
 * @param packageName 模块内引入的包名
 * @returns null | 匹配的 pattern
 */
const matchPattern = (patterns, packageName) => patterns.find(pattern => pattern.source === packageName);
exports.matchPattern = matchPattern;
/**
 * 分析当前 import 语句，分离需要单独引入的包
 * @param specifiers
 * @param pattern
 * @param originPckName
 * @returns
 */
const analyzeImportee = (specifiers, pattern, originPckName) => {
    const original = []; // 保留的具名原始引入语句
    const transform = []; // 需要转化的单独 export default
    specifiers.forEach(specifier => {
        const { imported, local } = specifier;
        // 这里的 searchPackages 要进行寻找
        // 这里需要一个一个进行查找
        const searchMatch = pattern.match;
        const defaultImportPath = searchMatch.find(replacePath => {
            return (0, _1.searchPackages)(path_1.default.join(`${replacePath}`, imported.name));
        });
        if (defaultImportPath) {
            transform.push({
                imported,
                local,
                transformPath: defaultImportPath,
            });
        }
        else {
            original.push({
                imported,
                local,
                transformPath: originPckName
            });
        }
    });
    return {
        original,
        transform
    };
};
exports.analyzeImportee = analyzeImportee;
/**
 * 生成最终节点
 * @param original
 * @param transform
 * @returns
 */
const generateExp = (original, transform) => {
    let transformExp;
    let originExp;
    // 需要修改的语句集合
    transformExp = transform.map(namedExport => {
        const { local, transformPath } = namedExport;
        // 生成节点
        return (0, types_1.importDeclaration)([(0, types_1.importDefaultSpecifier)(local)], (0, types_1.stringLiteral)(transformPath));
    });
    // 需要保留的原始引入语句
    if (original && original.length > 0) {
        const transformPath = original[0].transformPath;
        originExp = (0, types_1.importDeclaration)(
        // 这里应该是多个
        original.map(originalExport => {
            const { imported, local } = originalExport;
            return (0, types_1.importSpecifier)(local, imported);
        }), 
        // 这里填写 source
        (0, types_1.stringLiteral)(transformPath));
    }
    let replaceNode = [];
    if (transformExp && transformExp.length > 0) {
        replaceNode = replaceNode.concat(transformExp);
    }
    if (originExp) {
        replaceNode = replaceNode.concat(originExp);
    }
    return {
        replaceNode,
        transformNodes: transformExp,
        originalNode: originExp
    };
};
exports.generateExp = generateExp;
