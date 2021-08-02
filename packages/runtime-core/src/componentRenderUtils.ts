import { ShapeFlags } from "@vue/shared";
import { normalizeVNode } from "./vnode";

/**
 * 渲染组件
 * @param instance
 */
export function renderComponentRoot(instance) {
  const {
    type: Component,
    vnode,
    render,
    proxy,
    withProxy,
    renderCache,
    props,
    setupState,
    data,
    ctx,
  } = instance;
  let result;
  try {
    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      const proxyToUse = withProxy || proxy;
      result = normalizeVNode(
        render!.call(
          proxyToUse,
          proxyToUse!,
          renderCache,
          props,
          setupState,
          data,
          ctx
        )
      );
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
