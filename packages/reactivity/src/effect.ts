import { isArray, isIntegerKey } from "@vue/shared";
import { TriggerOpTypes } from "./operators";

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
}

export function trigger(target, type, key?, newValue?, oldValue?) {
  // 如果这个属性没有被收集过 effect
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  // 把所有的effect都放到一块
  const effects = new Set<any>();
  const add = (effectsToAdd: Set<any> | undefined) => {
    if (effectsToAdd) {
      // 过滤掉没有tracked过的属性，指对象的新增属性
      effectsToAdd.forEach((effect) => {
        if (effect !== activeEffect || effect.allowRecurse) {
          effects.add(effect);
        }
      });
    }
  };
  // 如果修改的是数组的长度，eg: arr:[1,2,3] => arr.length = 1
  if (key === "length" && isArray(target)) {
    // 如果对应的长度 有依赖收集需要更新
    depsMap.forEach((dep, mapKey) => {
      if (mapKey === "length" || mapKey > newValue) {
        // 如果更改的长度 小于收集的索引，
        // 那么这个收集的索引也需要触发effect重新执行, 让之前的数据变成empty
        add(dep);
      }
    });
  } else {
    // 修改的如果是对象，eg: demo: {name: 1} => demo.name = 2或者 demo.title = 1
    if (key !== undefined) {
      // 如果是对象的属性的修改或者增加，
      //由于增加属性的话,由于新增的属性，并没有被tracked过，
      // 所以，depsMap.get(key)拿到的是undefined，在add会被忽略
      add(depsMap.get(key));
    }
    switch (type) {
      case TriggerOpTypes.ADD:
        // 数组新增了索引，eg: arr:[1,2,3] => arr[100] = 99
        // 因为这里新增的索引之前并没有被tracked，所以就用length的effect去执行
        if (isArray(target) && isIntegerKey(key)) {
          add(depsMap.get("length"));
        }
        break;
    }
  }
  const run = (effect: any) => {
    console.log("effect.options.scheduler", effect.options.scheduler);

    if (effect.options.scheduler) {
      // 用户自定义了handler
      effect.options.scheduler(effect);
    } else {
      effect();
    }
  };
  effects.forEach(run);
}
