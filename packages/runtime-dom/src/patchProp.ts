import { isOn } from "@vue/shared";
import { patchClass } from "./modules/class";
import { patchEvent } from "./modules/events";
import { patchStyle } from "./modules/style";
// vue源码对 类名，内联样式，attrs，dom上的props，事件进行匹配更新
// 这里为了简化学习，我们暂时只考虑 class style event
/**
 * 更新对应的属性传值
 * @param el
 * @param key
 * @param prevValue
 * @param nextValue
 */
export function patchProp(el, key, prevValue, nextValue) {
  switch (key) {
    case "class":
      // 类名列表发生变化
      patchClass(el, nextValue);
      break;
    case "style":
      // 内联样式发生改变
      patchStyle(el, prevValue, nextValue);
      break;
    default:
      if (isOn(key)) {
        // 当前是事件，绑定的事件发生改变
        patchEvent(el, key, prevValue, nextValue);
      }
      break;
  }
}
export const forcePatchProp = (_, key) => key === "value";
