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
let activeEffect;
/**
 * 创建一个响应式的effect
 * @param fn
 * @param options
 * @returns
 */
function createReactiveEffect(fn, options) {
  const effect = function reactiveEffect() {
    // 如果在栈已经存在了,就不放了，防止一个函数多次执行
    if (!effectStack.includes(effect)) {
      try {
        effectStack.push(effect);
        activeEffect = effect;
        return fn(); // 执行用户的fn函数，里面的依赖会触发get方法
      } finally {
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1];
      }
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
// 记录当前属性的effect函数
// 形式: Map(key => {name:'tianheng',title:'qy'},
//          value => Map(
//                     key => 'name'
//                     value => Set([effect1,effect2]))
//       ))
const targetMap = new WeakMap();
/**
 * 收集依赖，
 * 让对象中的某个属性，收集当前对应的effect函数
 * @param target
 * @param type
 * @param key
 */
export function track(target, type, key) {
  // 当前没有在某个effect作用域中
  if (!activeEffect) return;
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
  }
  console.log("收集了当前的依赖", targetMap);
}
