import { extend, isString } from "@vue/shared";
import { nodeOps } from "./nodeOps";
import { patchProp, forcePatchProp } from "./patchProp";
import { createRender } from "@vue/runtime-core";
export * from "@vue/runtime-core";
// 渲染器
let render;
// 拿到所有的重写方法进行合并
const renderOptions = extend({ patchProp, forcePatchProp }, nodeOps);
function ensureRender() {
  return render || (render = createRender(renderOptions));
}
/**
 * 思路
 * 1. 创建app实例
 * 2. 完成元素的挂载
 * 3. 返回当前实例
 * @param args
 * @returns
 */
export function createApp(...args) {
  // 抽取的作用：可以让当前的函数只负责，创建应用和挂载应用，平台之间的差异就不在这里管控
  const app = ensureRender().createApp(...args);
  const { mount } = app;
  app.mount = (container) => {
    container = normalizeContainer(container);
    if (!container) return;
    // clear content before mounting
    container.innerHTML = "";
    const proxy = mount(container);
    return proxy;
  };
  return app;
}
/**
 * 规范化容器
 * @param container
 * @returns
 */
function normalizeContainer(container): HTMLElement {
  if (isString(container)) {
    return document.querySelector(container);
  }
  return container;
}
