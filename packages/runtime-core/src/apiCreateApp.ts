import { createVNode } from "./vnode";

let uid = 0;
export function createAppAPI(render) {
  return function createApp(rootComponent, rootProps = null) {
    let isMounted = false;
    const context = createAppContext();
    const app = {
      _uid: uid++, // 组件标识
      _component: rootComponent, // 根组件
      _props: rootProps, // 组件传值
      _container: null, // 组件的容器
      _context: context, // 当前全局上下文
      // app.config === app.context.config为了方便用户取值
      get config() {
        return context.config;
      },
      set config(v) {},
      mount(
        rootContainer: HTMLElement & { __vue_app__: unknown },
        isSVG?: boolean
      ) {
        if (!isMounted) {
          const vnode = createVNode(rootComponent, rootProps);
          vnode.appContext = context;
          render(vnode, rootContainer);
          isMounted = true;
          app._container = rootContainer;
          // 把当前的app实例存储到根节点dom上
          rootContainer.__vue_app__ = app;
          return vnode.component!.proxy;
        }
      },
    };

    return app;
  };
}
export function createAppContext() {
  return {
    app: null as any,
    config: {
      globalProperties: {}, // 全局属性，向外暴露  app.config.globalProperties
    },
    mixins: [],
    components: {},
    directives: {},
    provides: Object.create(null),
  };
}
