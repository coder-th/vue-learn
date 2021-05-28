import { isObject } from "@vue/shared";
import {
  mutableHandlers,
  shallowReactiveHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers,
} from "./baseHandlers";
/**
 * 用来存储需要响应式的对象
 */
const reactiveMap = new WeakMap();
/**
 * 用来存储只读对象
 */
const readonlyMap = new WeakMap();
/**
 * 创建 一个响应式代理,将结果进行缓存
 * @param target 目标对象
 * @param isReadOnly 是否是只读的
 * @param baseHandlers 拦截器
 * @returns 返回代理后的对象
 */
function createReactiveObject(target, isReadOnly, baseHandlers) {
  // 用户传入的值不是对象，就不做了
  if (!isObject(target)) return;
  /**
   * 当前的存储器
   */
  const proxyMap = isReadOnly ? readonlyMap : reactiveMap;
  // 取出当前对象的代理
  const existProxy = proxyMap.get(target);
  if (existProxy) {
    // 该对象已经被代理过了
    return existProxy;
  }
  // 对当前对象进行代理，并且存储
  const proxy = new Proxy(target, baseHandlers);
  proxyMap.set(target, proxy);
  return proxy;
}

/**
 * 将对象进行深层次的响应式代理，返回代理
 * @param target
 */
export function reactive(target) {
  return createReactiveObject(target, false, mutableHandlers);
}
/**
 * 创建一个浅代理对象
 * @param target
 * @returns
 */
export function shallowReactive(target) {
  return createReactiveObject(target, false, shallowReactiveHandlers);
}
/**
 * 创建一个只读代理
 * @param target
 * @returns
 */
export function readonly(target) {
  return createReactiveObject(target, true, readonlyHandlers);
}
/**
 * 创建一个浅的只读代理对象
 * @param target
 * @returns
 */
export function shallowReadonly(target) {
  return createReactiveObject(target, true, shallowReadonlyHandlers);
}
