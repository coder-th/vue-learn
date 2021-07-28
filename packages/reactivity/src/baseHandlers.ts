import {
  hasChanged,
  hasOwn,
  isArray,
  isIntegerKey,
  isObject,
} from "@vue/shared/src";
import { reactive, readonly, trigger } from "@vue/reactivity";
import {
  pauseTracking,
  ReactiveFlags,
  reactiveMap,
  readonlyMap,
  resetTracking,
  toRaw,
  track,
} from "@vue/vue";
import { TrackOpTypes, TriggerOpTypes } from "./operators";
const get = createGetter();
const set = createSetter();
const shallowGet = createGetter(false, true);
const shallowSet = createSetter(false, true);
const readonlyGet = createGetter(true, false);
const readonlySet = (target, key) => {
  console.warn(`set on key ${key} falied`);
};
const shallowReadonlyGet = createGetter(true, true);
const shallowReadonlySet = (target, key) => {
  console.warn(`set on key ${key} falied`);
};
export const mutableHandlers = {
  get,
  set,
};
export const shallowReactiveHandlers = {
  get: shallowGet,
  set: shallowSet,
};
export const readonlyHandlers = {
  get: readonlyGet,
  set: readonlySet,
};
export const shallowReadonlyHandlers = {
  get: shallowReadonlyGet,
  set: shallowReadonlySet,
};

/**
 * 因为数组也是对象，方法｜length｜index都是被访问到（getter拦截到，而getter会track依赖）的，也就是会造成添加重复依赖的情况
 * 为了减少不必要的依赖添加，需要对以下会使用或者修改到 length|index的方法，进行重写，然后，直接一次性将依赖收集了，就不用重复收集
 * 实例： arr.indexOf调用过程访问了： arr.indexOf => arr.length => index
 *
 * 不拦截   map|forEach|some其他等等的方法，是因为，这些方法的底层还是会用到以下的这些方法。
 */
const arrayInstrumentations: Record<string, Function> = {};
(["includes", "indexOf", "lastIndexOf"] as const).forEach((key) => {
  // 当前拦截的数组方法名
  const method = Array.prototype[key] as Function;
  arrayInstrumentations[key] = function (this: unknown[], ...args: unknown[]) {
    // 得到源对象
    const arr = toRaw(this);
    for (let i = 0, l = this.length; i < l; i++) {
      // 收集数组中的元素成为依赖，让元素具有响应式,这样就收集到依赖了
      track(arr, TrackOpTypes.GET, i + "");
    }
    // 调用原有的方法
    const res = method.apply(arr, args);
    if (res === -1 || res === false) {
      // 再次确认一下结果是否正确
      return method.apply(arr, args.map(toRaw));
    } else {
      return res;
    }
  };
});
// push => length => element => length => element => length
// 以下的方法会使用到length属性，
// 而使用到length，length在effect会被当作依赖收集,
//但是因为length会被方法改变，effect重新执行，又再次执行方法，依赖又会改变，会导致无限的循环渲染更新
// eg. effect(() => arr.push(1))
(["push", "pop", "shift", "unshift", "splice"] as const).forEach((key) => {
  const method = Array.prototype[key] as Function;
  arrayInstrumentations[key] = function (this: unknown[], ...args: unknown[]) {
    pauseTracking();
    const res = method.apply(this, args);
    resetTracking();
    return res;
  };
});
/**
 * 创建getter
 * @param isReadonly 是否只读
 * @param shallow 是否浅代理
 * @returns
 */
function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    console.log("get操作", target, key, receiver);
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    } else if (
      key === ReactiveFlags.RAW && // toRaw()会调用
      receiver === (isReadonly ? readonlyMap : reactiveMap).get(target) // 可以保证当前的对象是本身而不是原型链上的其他对象
    ) {
      return target;
    }
    const targetIsArray = isArray(target);
    // 这个的操作是减少不必要的依赖添加，访问includes的时候，会拦截到  includes、length、0 -> 目标下标
    // 这里转向原生对象的操作是为了避免依赖的添加
    // 如果是数组里面的方法的话，是不会在往下继续执行，所以连方法的依赖也没有添加，所以作者明显就是不想要监听这几种方法
    if (!isReadonly && targetIsArray && hasOwn(arrayInstrumentations, key)) {
      return Reflect.get(arrayInstrumentations, key, receiver);
    }
    const res = Reflect.get(target, key, receiver);
    if (!isReadonly) {
      // 不是只读的，说明需要待会数据更新后，要进行视图更新
      // 执行effect的时候，会执行getter函数，这时候就可以收集依赖
      track(target, TrackOpTypes.GET, key);
    }
    if (shallow) {
      // 浅代理，直接返回该对象就可以了
      return res;
    }
    if (isObject(res)) {
      // value是对象，也需要代理，那么就进行在对value进行一层代理，
      // 相比vue2，优化了，vue2是全部一次性递归，
      // vue3则是，取值才进行代理
      return isReadonly ? readonly(res) : reactive(res);
    }
    return res;
  };
}
/**
 * 创建一个setter
 * @param isReadonly 是否只读
 * @param shallow 是否浅代理
 * @returns
 */
function createSetter(isReadonly = false, shallow = false) {
  return function set(target, key, value, receiver) {
    const oldValue = target[key]; // 获取老的值
    const hadKey =
      isArray(target) && isIntegerKey(key)
        ? Number(key) < target.length
        : hasOwn(target, key);
    const result = Reflect.set(target, key, value, receiver);
    // 保证target是原来的对象，而不是同一个原型链上的对象
    if (target === toRaw(receiver)) {
      if (!hadKey) {
        //   对象新增了属性,触发依赖的effect
        trigger(target, TriggerOpTypes.ADD, key, value);
      } else if (hasChanged(value, oldValue)) {
        // 对象的属性发生了更新,触发依赖的effect
        trigger(target, TriggerOpTypes.SET, key, value, oldValue);
      }
    }

    return result;
  };
}
