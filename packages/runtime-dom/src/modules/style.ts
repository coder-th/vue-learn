import { isArray, isString } from "@vue/shared";

type Style = string | Record<string, string | string[]> | null;
export function patchStyle(el: HTMLElement, prev: Style, next: Style) {
  // 先拿到元素之前的样式
  const style = el.style;
  if (!next) {
    // 用户想删掉
    el.removeAttribute("style");
  } else if (isString(next)) {
    // eg. style:{color: 'red'} => style: "color:'red'"
    if (prev !== next) {
      const current = style.display;
      style.cssText = next;
    }
  } else {
    for (const key in next) {
      // 先将新的样式保存，与旧的进行合并，后面在考虑删除
      setStyle(style, key, next[key]);
    }
    if (prev && !isString(prev)) {
      for (const key in prev) {
        // eg. style:{color: 'red'} => style: {font: '16px'},原来的color属性被删掉了
        if (next[key] == null) {
          setStyle(style, key, "");
        }
      }
    }
  }
}

function setStyle(style, name, val: string | string[]) {
  if (isArray(val)) {
    val.forEach((v) => setStyle(style, name, v));
  } else {
    style[name] = val;
  }
}
