export function patchClass(el, value) {
  if (value === null) {
    value = "";
  }
  // 元素上有动画相关的标志
  const transitionClasses = el._vtc;
  if (transitionClasses) {
    value = (value ? [value, ...transitionClasses] : [value]).join(" ");
  }
  el.className = value;
}
