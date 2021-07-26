import { isFunction } from "@vue/shared";
import { effect, ReactiveFlags, toRaw, track, trigger } from "@vue/vue";
import { TrackOpTypes, TriggerOpTypes } from "./operators";

class ComputedRefImpl {
  private _value;
  // computed缓存的标识(_dirty为true 代表是新数据， 为false代表的是 旧数据，直接读取缓存的_value)
  private _dirty = true;
  private effect;
  public readonly __v_isRef = true;
  public readonly [ReactiveFlags.IS_READONLY]: boolean;
  constructor(public getter, public setter, public isReadonly) {
    this.effect = effect(getter, {
      lazy: true,
      // setter调用的
      scheduler: () => {
        if (!this._dirty) {
          this._dirty = true;
          trigger(toRaw(this), TriggerOpTypes.SET, "value");
        }
      },
    });
    this[ReactiveFlags.IS_READONLY] = isReadonly;
  }
  get value() {
    // 保证拿到的是computed，因为实例可能会被readonly包裹着
    const self = toRaw(this);
    // 如果数据修改了或者是刚刚初始化
    if (self._dirty) {
      self._value = this.effect();
      self._dirty = false;
    }
    track(self, TrackOpTypes.GET, "value");
    return self._value;
  }
  set value(newVal) {
    this.setter(newVal);
  }
}

export function computed(getterOrOptions) {
  // 保存getter和setter
  let getter;
  let setter;
  // 用户传入的是函数，说明该属性是只读的
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
    setter = () => {
      console.warn("该属性是只读的");
    };
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(
    getter,
    setter,
    isFunction(getterOrOptions) || !getterOrOptions.set
  );
}
