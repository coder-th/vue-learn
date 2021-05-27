const fs = require("fs");
const execa = require("execa");
const path = require("path");
/**
 * 拿到命令行的参数
 */
const args = require("minimist")(process.argv.slice(2));
/**
 * 当前要打包的文件夹
 */
const targets = args._;
/**
 * 当前打包的文件规范
 */
const formats = args.formats || args.f;
/**
 * 是否只打包开发时的文件
 */
const devOnly = args.devOnly || args.d;
/**
 * 是否打包sourcemap
 */
const sourceMap = args.sourcemap || args.s;
/**
 * 如果命令行中没有传入目标目录，那么
 * 拿到packages/* 下的所有目录，排除文件
 */
const targetDirs = targets.length
  ? targets
  : fs
      .readdirSync("packages")
      .filter((fileDir) => fs.statSync(`packages/${fileDir}`).isDirectory());
/**
 * 对目标目录并行打包s
 * @param {*} target
 */
async function build(target) {
  const pkgDir = path.resolve(`packages/${target}`);
  const pkg = require(`${pkgDir}/package.json`);
  /**
   * 没有传入要重新特殊打包的规范,删除目录重新打包
   */
  if (!formats) {
    await fs.remove(`${pkgDir}/dist`);
  }
  /**
   * 得到当前打包的执行环境变量
   */
  const env =
    (pkg.buildOptions && pkg.buildOptions.env) ||
    (devOnly ? "development" : "production");
  /**
   *   执行脚本命令，并加载进环境变量，传入对应的目录等信息，，
   *  将进程信息共享给主进程，让rollup.config.js生成对应目录的配置，然后进行打包
   */
  await execa(
    "rollup",
    [
      "-c",
      "--environment",
      [
        `TARGET:${target}`,
        `NODE_ENV:${env}`,
        formats ? `FORMATS:${formats}` : ``,
        sourceMap ? `SOURCE_MAP:${sourceMap}` : ``,
      ]
        .filter(Boolean)
        .join(","),
    ],
    {
      stdio: "inherit",
    }
  );
}
/**
 * 并行执行build
 * @param {*} maxConcurrency 当前系统的cpu最大核心数
 * @param {*} source 源代码目录
 * @param {*} iteratorFn 迭代
 * @returns
 */
async function runParallel(maxConcurrency, source, iteratorFn) {
  const ret = [];
  const executing = [];
  for (const item of source) {
    // 将要执行的任务放在promise微任务队列中
    const p = Promise.resolve().then(() => iteratorFn(item, source));
    ret.push(p);
    if (maxConcurrency <= source.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= maxConcurrency) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(ret);
}

runParallel(require("os").cpus().length, targetDirs, build);
