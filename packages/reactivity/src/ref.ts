import { hasChanged, isArray, isObject } from "@vue/shared";
import { reactive, track, trigger } from "@vue/vue";
import { TrackOpTypes, TriggerOpTypes } from "./operators";

export function ref(value) {
  return createRef(value);
}

export function shallowRef(value) {
  return createRef(value, true);
}

function createRef(value, shallow = false) {
  return new RefImpl(value, shallow);
}
const convert = (value) => (isObject(value) ? reactive(value) : value);
class RefImpl {
  public _value; //表示 声明了一个_value属性 但是没有赋值
  public __v_isRef = true; // 产生的实例会被添加 __v_isRef 表示是一个ref属性
  constructor(public _rawValue, public _shallow) {
    this._value = _shallow ? _rawValue : convert(_rawValue);
  }
  // value属性访问器
  get value() {
    track(this, TrackOpTypes.GET, "value");
    return this._value;
  }
  // value属性设置器
  set value(newValue) {
    // 如果发生改变
    if (hasChanged(newValue, this._rawValue)) {
      this._rawValue = newValue;
      this._value = this._shallow ? newValue : convert(newValue);
      // 视图更新
      trigger(this, TriggerOpTypes.SET, "value", newValue, this._rawValue);
    }
  }
}

export function toRef(target, key) {
  return new ObjectRefImpl(target, key);
}
export function toRefs(target) {
  const ret = isArray(target) ? new Array(target.length) : {};
  for (const key of target) {
    ret[key] = toRef(target, key);
  }
  return ret;
}
class ObjectRefImpl {
  public __v_isRef = true;
  constructor(public _target, public _key) {}
  get value() {
    // 如果原对象是响应式的就会依赖收集
    return this._target[this._key];
  }
  set value(newValue) {
    // 如果原来对象是响应式的 那么就会触发更新
    this._target[this._key] = newValue;
  }
}
/**
 * 自定义ref
 * @param factory
 * @returns
 */
export function customRef(factory) {
  return new CustomRefImpl(factory);
}

class CustomRefImpl {
  public readonly __v_isRef = true;
  public _get;
  public _set;
  constructor(public factory) {
    const { get, set } = factory(
      () => track(this, TrackOpTypes.GET, "value"),
      () => trigger(this, TriggerOpTypes.SET, "value")
    );
    console.log(get, set);
    this._get = get;
    this._set = set;
  }
  get value() {
    return this._get();
  }
  set value(newValue) {
    this._set(newValue);
  }
}
