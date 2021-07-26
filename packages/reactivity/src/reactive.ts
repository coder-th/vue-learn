import { def, isObject, toRawType } from "@vue/shared";
import {
  mutableHandlers,
  shallowReactiveHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers,
} from "./baseHandlers";
export const enum ReactiveFlags {
  SKIP = "__v_skip",
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly",
  RAW = "__v_raw",
}
const enum TargetType {
  INVALID = 0,
  COMMON = 1,
  COLLECTION = 2,
}
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
 * @param isReadonly 是否是只读的
 * @param baseHandlers 拦截器
 * @returns 返回代理后的对象
 */
function createReactiveObject(target, isReadonly, baseHandlers) {
  // 用户传入的值不是对象，就不做了
  if (!isObject(target)) return;
  // ① 源数据为Proxy
  // __v_raw仅当数据源已经是Proxy时才会有，既然是Proxy说明是转化过的响应式数据，
  // 那么直接把对象原封不动的返回即可
  if (
    target[ReactiveFlags.RAW] &&
    !(isReadonly && target[ReactiveFlags.IS_REACTIVE])
  ) {
    return target;
  }
  // 2 源数据合法性白名单检测
  // 只有target在可转化类型白名单里才会进行转化，否则直接返回target
  // canObserve会校验target的__v_skip是否为true、target类型是否在白名单里、target是否
  // 为冻结对象，三者同时满足才会继续转化
  const targetType = getTargetType(target)
  if (targetType === TargetType.INVALID) {
    return target
  }
  /**
   * 当前的存储器
   */
  const proxyMap = isReadonly ? readonlyMap : reactiveMap;
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
/**
 * 类型映射表
 * @param rawType
 * @returns
 */
function targetTypeMap(rawType: string) {
  switch (rawType) {
    case "Object":
    case "Array":
      return TargetType.COMMON;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return TargetType.COLLECTION;
    default:
      return TargetType.INVALID;
  }
}
/**
 * 获取当前对象分类
 * @param target
 * @returns
 */
export function getTargetType(target) {
  // 当前对象被标记为原生对象或者，该对象不可被扩展，说明该对象无效，不需要在进行响应式代理
  return target[ReactiveFlags.SKIP] || !Object.isExtensible(target)
    ? TargetType.INVALID
    : targetTypeMap(toRawType(target));
}
/**
 * 判断当前对象是不是可响应的
 * @param value
 * @returns
 */
export function isReactive(value: unknown): boolean {
  if (isReadonly(value)) {
    return isReactive(value[ReactiveFlags.RAW]);
  }
  return !!(value && value[ReactiveFlags.IS_REACTIVE]);
}
/**
 * 判断当前对象是不是只读
 * @param value
 * @returns
 */
export function isReadonly(value: unknown): boolean {
  return !!(value && value[ReactiveFlags.IS_READONLY]);
}
/**
 * 判断当前对象有没有被代理过
 * @param value
 * @returns
 */
export function isProxy(value: unknown): boolean {
  return isReactive(value) || isReadonly(value);
}
/**
 * 得到原生对象
 * @param observed
 * @returns
 */
export function toRaw<T>(observed: T): T {
  return (observed && toRaw(observed[ReactiveFlags.RAW])) || observed;
}
/**
 * 标记该对象为原生对象，直接跳过响应式代理
 * @param value
 * @returns
 */
export function markRaw<T extends object>(value: T): T {
  def(value, ReactiveFlags.SKIP, true);
  return value;
}
