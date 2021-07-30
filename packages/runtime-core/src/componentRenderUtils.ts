import { ShapeFlags } from "@vue/shared";
import { normalizeVNode } from "./vnode";

/**
 * 渲染组件
 * @param instance
 */
export function renderComponentRoot(instance) {
  const { type: Component, vnode, render, props } = instance;
  let result;
  try {
    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      result = normalizeVNode(render!.call(instance, props));
    } else {
      const render = Component;
      result = normalizeVNode(render!.call(instance, props));
    }
    instance.root = result;
  } catch (error) {
    console.log(error);
  }
  return result;
}
