import { createVNode } from "./vnode";

let uid = 0;
export function createAppAPI(render) {
  return function createApp(rootComponent, rootProps = null) {
    let isMounted = false;
    const app = {
      _uid: uid++, // 组件标识
      _component: rootComponent, // 当前组件
      _props: rootProps, // 组件传值
      _container: null, // 组件的容器

      mount(rootContainer: HTMLElement, isSVG?: boolean) {
        if (!isMounted) {
          const vnode = createVNode(rootComponent, rootProps);
          render(vnode, rootContainer);
        }
      },
    };
    return app;
  };
}
