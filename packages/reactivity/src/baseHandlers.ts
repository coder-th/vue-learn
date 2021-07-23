import { hasOwn, isArray, isIntegerKey, isObject } from "@vue/shared/src";
import { reactive, readonly } from "@vue/reactivity";
import { track } from "@vue/vue";
import { TrackOpTypes } from "./operators";
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
 * 创建getter
 * @param isReadonly 是否只读
 * @param shallow 是否浅代理
 * @returns
 */
function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
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
    const hadKey =
      isArray(target) && isIntegerKey(key)
        ? Number(key) < target.length
        : hasOwn(target, key);
    if (!hadKey) {
      //   对象新增了属性,触发依赖的effect
      console.log("对象新增了属性", key);
    } else {
      // 对象的属性发生了更新,触发依赖的effect
      console.log("对象的属性发生了更新", key);
    }
    const result = Reflect.set(target, key, value);
    return result;
  };
}
