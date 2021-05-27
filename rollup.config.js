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
  "esm-bundler": {
    file: resolve(`dist/${pkgName}.esm-bundler.js`),
    format: `es`,
  },
  "esm-browser": {
    file: resolve(`dist/${pkgName}.esm-browser.js`),
    format: `es`,
  },
  cjs: {
    file: resolve(`dist/${pkgName}.cjs.js`),
    format: `cjs`,
  },
  global: {
    file: resolve(`dist/${pkgName}.global.js`),
    format: `iife`,
  },

  // runtime-only builds, for main "vue" package only
  "esm-bundler-runtime": {
    file: resolve(`dist/${pkgName}.runtime.esm-bundler.js`),
    format: `es`,
  },
  "esm-browser-runtime": {
    file: resolve(`dist/${pkgName}.runtime.esm-browser.js`),
    format: "es",
  },
  "global-runtime": {
    file: resolve(`dist/${pkgName}.runtime.global.js`),
    format: "iife",
  },
};
const inlineFormats = process.env.FORMATS && process.env.FORMATS.split(",");
/**
 * 最终要打包的规范，命令行的优先级高于package.json
 */
const packageFormats = inlineFormats || pkgOptions.formats;
/**
 * 生成的打包配置文件
 */
const packageConfigs =
  packageFormats.map((format) => createConfig(format)) || [];
if (process.env.NODE_ENV === "production") {
  addProductionConfig();
}
export default packageConfigs;
/**
 * 线上环境，进行tree-shaking打包
 * @param {*} format
 * @returns
 */
function createMinifiedConfig(format) {
  const { terser } = require("rollup-plugin-terser");
  return createConfig(
    format,
    {
      file: outputFormatConfig[format].file.replace(/\.js$/, ".prod.js"),
      format: outputFormatConfig[format].format,
    },
    [
      terser({
        module: /^esm/.test(format),
        compress: {
          ecma: 2015,
          pure_getters: true,
        },
        safari10: true,
      }),
    ]
  );
}
/**
 * 生成node,线上环境的配置文件
 * @param {*} format
 * @returns
 */
function createCjsProductionConfig(format) {
  return createConfig(format, {
    file: resolve(`dist/${pkgName}.${format}.prod.js`),
    format: outputFormatConfig[format].format,
  });
}
/**
 * 根据规范，给线上环境添加一些生产环境的配置
 */
function addProductionConfig() {
  packageFormats.forEach((format) => {
    console.log(format);
    //  当前执行的是打包
    if (pkgOptions.prod === false) {
      return;
    }
    if (format === "cjs") {
      // 如果规范是commonJS，则再添加一份打包的配置，生成  .prod.js文件
      packageConfigs.push(createCjsProductionConfig(format));
    }
    // 如果是global或者esMNodule规范，则进行treeShaking,减少代码，生成 .prod.js文件
    if (/^(global|esm-browser)(-runtime)?/.test(format)) {
      packageConfigs.push(createMinifiedConfig(format));
    }
  });
}
/**
 * 生成输出的配置
 * @param {*} format 采用的打包规范
 * @returns
 */
function createOutputConfig(format) {
  return {
    name: pkgOptions.name,
    sourcemap: !!process.env.SOURCE_MAP,
    ...outputFormatConfig[format],
  };
}
/**
 * 根据传入的规范生成对应的打包配置文件
 * @param {*} format
 * @returns
 */
function createConfig(format, outputOptions = {}) {
  return {
    input: resolve("src/index.ts"),
    output: { ...createOutputConfig(format), ...outputOptions },
    plugins: [
      json(),
      ts({
        tsconfig: path.resolve(__dirname, "tsconfig.json"),
      }),
      resolvePlugin(),
    ],
    treeshake: {
      moduleSideEffects: false,
    },
  };
}
