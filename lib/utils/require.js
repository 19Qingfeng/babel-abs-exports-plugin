"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRequireExp = exports.analyzeRequire = exports.findMatchedSource = void 0;
const path_1 = __importDefault(require("path"));
const _1 = require(".");
const types_1 = require("@babel/types");
const chalk_1 = __importDefault(require("chalk"));
/**
 * 寻找匹配 require 语的包
 * @param patterns
 * @param initDeclarator
 * @returns
 */
const findMatchedSource = (patterns, initDeclarator) => {
    const { callee, arguments: _arg } = initDeclarator;
    const declarator = callee.name; // require
    try {
        const packageName = _arg[0].value;
        // 匹配的包名称
        if (declarator !== 'require') {
            return null;
        }
        const matchedPattern = patterns.find(pattern => {
            const { source } = pattern;
            return source === packageName;
        });
        return matchedPattern;
    }
    catch (e) {
        console.log(chalk_1.default.red(`require package error by findMatchedSource!`));
        throw e;
    }
};
exports.findMatchedSource = findMatchedSource;
/**
 * 分析require语句，尝试单独模块引入
 * @param objectPattern
 * @param pattern
 * @param originPckName
 * @returns
 */
const analyzeRequire = (objectPattern, pattern, originPckName) => {
    const { properties } = objectPattern;
    const original = [];
    const transform = [];
    // console.log(properties, 'aaaaaproperties')
    properties.forEach(property => {
        const { key, value } = property;
        const originalName = key.name;
        const replaceName = value.name;
        // 拿 originalName 去寻找，
        // searchMatch
        const searchMatch = pattern.match;
        const defaultRequirePath = searchMatch.find(replacePath => {
            return (0, _1.searchPackages)(path_1.default.join(replacePath, originalName));
        });
        if (defaultRequirePath) {
            transform.push({
                properties,
                replaceName,
                transformPath: defaultRequirePath
            });
        }
        else {
            original.push({
                properties,
                originalName,
                replaceName,
                transformPath: originPckName
            });
        }
    });
    return {
        original,
        transform
    };
};
exports.analyzeRequire = analyzeRequire;
const generateRequireExp = (original, transform) => {
    // 根据对应的list生成对应的节点
    let transformExp;
    let originExp;
    // 需要修改的导入语句
    transformExp = transform.map(namedExport => {
        const { transformPath, replaceName } = namedExport;
        return (0, types_1.variableDeclaration)('const', [
            (0, types_1.variableDeclarator)((0, types_1.identifier)(replaceName), (0, types_1.callExpression)((0, types_1.identifier)('require'), 
            // 修改后的路径
            [(0, types_1.stringLiteral)(transformPath)]))
        ]);
    });
    // 从原始包中引入的 require 语句
    if (original && original.length > 0) {
        const originPath = original === null || original === void 0 ? void 0 : original[0].transformPath;
        originExp = (0, types_1.variableDeclaration)('const', [
            (0, types_1.variableDeclarator)((0, types_1.objectPattern)(original.map(origin => {
                return (0, types_1.objectProperty)((0, types_1.identifier)(origin.originalName), // 原始的名称
                (0, types_1.identifier)(origin.replaceName) // 新的名称
                );
            })), 
            // 左边应该是是 Object 而不是数组
            // 右边应该是引入的语句
            (0, types_1.callExpression)((0, types_1.identifier)('require'), 
            // 修改后的路径 原始的包路径
            [(0, types_1.stringLiteral)(originPath)]))
        ]);
    }
    let replaceNode = [];
    console.log(transformExp, 'transformExp');
    console.log(originExp, 'originExp');
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
exports.generateRequireExp = generateRequireExp;
