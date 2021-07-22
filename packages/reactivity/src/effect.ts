/**
 * 将用户传入的函数，变成响应式的effect函数，可以做到数据变化重新执行
 * @param fn
 * @param option
 */
export function effect(fn, options: any = {}) {
  if (isEffect(fn)) {
    //   是包装过的effect，需要拿到原函数
    fn = fn.raw;
  }
  // 创建一个新的effect函数，并且返回
  const effect = createReactiveEffect(fn, options);
  //   默认effect会先执行一次,更新视图
  if (!options.lazy) {
    effect();
  }
  return effect;
}
/**
 * effect的标识
 */
let uid = 0;
/**
 * effect的函数栈
 */
const effectStack = [];
/**
 * 创建一个响应式的effect
 * @param fn
 * @param options
 * @returns
 */
function createReactiveEffect(fn, options) {
  const effect = function reactiveEffect() {
    console.log(fn);
    if (!effect.active) {
      // 当前的effect没有开启,然后
      return options.scheduler ? undefined : fn();
    }
  };
  effect.id = uid++; // 每一个effect的标识
  effect._isEffect = true; // 标识该副作用是响应式的
  effect.raw = fn; // 保存用户存入的原函数
  effect.options = options; // 保存用户传入的配置
  effect.allowRecurse = !!options.allowRecurse;
  effect.active = true; // effect可不可以用
  effect.deps = []; // effect中的依赖
  return effect;
}
/**
 * 判断当前函数是不是一个包装过的effect
 * @param fn
 * @returns
 */
function isEffect(fn) {
  return fn && fn._isEffect === true;
}
