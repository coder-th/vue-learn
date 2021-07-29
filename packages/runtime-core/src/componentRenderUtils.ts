import { ShapeFlags } from "@vue/shared";
import { normalizeVNode } from "./vnode";

/**
 * 渲染组件
 * @param instance
 */
export function renderComponentRoot(instance) {
  const { type: Component, vnode, render, props } = instance;
  console.log("renderComponentRoot", instance);

  let result;
  try {
    console.log("renderComponentRoot-render", render);

    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      result = normalizeVNode(render!.call(instance, props));
    } else {
      const render = Component;
      result = normalizeVNode(render!.call(instance, props));
    }
    // let root = result
  } catch (error) {
    console.log(error);
  }
  console.log("result", result);

  return result;
}
