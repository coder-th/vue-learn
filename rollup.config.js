import json from "@rollup/plugin-json";
import ts from "rollup-plugin-typescript2";
import resolvePlugin from "@rollup/plugin-node-resolve";
import path from "path";
// 找到  packages目录，
const packagesDir = path.resolve(__dirname, "packages");
// 找到当前要打包的包
const packageDir = path.resolve(packagesDir, process.env.TARGET);
// 定义一个函数，方便拿到当前打包文件夹中的文件或者文件夹
const resolve = (fileOrDir) => path.resolve(packageDir, fileOrDir);
// 拿到目标文件夹的打包配置文件
const pkg = require(resolve("package.json"));
// 拿到package.json定义的一些选项
const pkgName = path.basename(packageDir);
const pkgOptions = pkg.buildOptions;
// 对打包类型 先做一个映射表，根据你提供的formats 来格式化需要打包的内容
const outputFormatConfig = {
  // 自定义的
  "esm-bundler": {
    file: resolve(`dist/${pkgName}.esm-bundler.js`),
    format: "es",
  },
  cjs: {
    file: resolve(`dist/${pkgName}.cjs.js`),
    format: "cjs",
  },
  global: {
    file: resolve(`dist/${pkgName}.global.js`),
    format: "iife", // 立即执行函数
  },
};
/**
 * 生成输出的配置
 * @param {*} format 采用的打包规范
 * @returns
 */
function createOutputConfig(format) {
  return {
    name: pkgOptions.name,
    sourcemap: process.env.SOURCE_MAP
      ? process.env.SOURCE_MAP === "true"
      : true,
    ...outputFormatConfig[format],
  };
}
/**
 * 根据传入的规范生成对应的打包配置文件
 * @param {*} format
 * @returns
 */
function createConfig(format) {
  return {
    input: resolve("src/index.ts"),
    output: createOutputConfig(format),
    plugins: [
      json(),
      ts({
        tsconfig: path.resolve(__dirname, "tsconfig.json"),
      }),
      resolvePlugin(),
    ],
  };
}
const inlineFormats = process.env.FORMATS && process.env.FORMATS.split(",");
/**
 * 最终要打包的规范，命令行的优先级高于package.json
 */
const packageFormats = inlineFormats || pkgOptions.formats;
export default packageFormats.map((format) => createConfig(format));
