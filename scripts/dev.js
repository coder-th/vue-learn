const fs = require("fs");
const execa = require("execa");
const { devBuildDirs } = require("./config");
// 需要打包的文件夹
const targetDirs = devBuildDirs;
// 对目标目录并行打包
async function build(target) {
  /**
   *   执行脚本命令，并加载进环境变量，传入对应的目录等信息，，
   *  将进程信息共享给主进程，让rollup.config.js生成对应目录的配置，然后进行打包
   */
  await execa("rollup", ["-c", "--environment", `TARGET:${target}`], {
    stdio: "inherit",
  });
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
