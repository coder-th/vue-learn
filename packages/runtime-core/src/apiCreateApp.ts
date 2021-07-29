let uid = 0;
export function createAppAPI(render) {
  return function createApp(rootComponent, rootProps = null) {
    console.log(rootComponent, rootProps);

    let isMounted = false;

    const app = {
      _uid: uid++, // 组件标识
      _component: rootComponent, // 当前组件
      _props: rootProps, // 组件传值
      _container: null, // 组件的容器

      mount(rootContainer: HTMLElement, isSVG?: boolean) {
        if (!isMounted) {
          render(rootContainer);
        }
      },
    };
    return app;
  };
}
