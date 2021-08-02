import { isFunction, isObject, isPromise, ShapeFlags } from "@vue/shared";
import { pauseTracking, proxyRefs, resetTracking } from "@vue/vue";
import { PublicInstanceProxyHandlers } from "./compnentPublicInstanceProxy";
const EMPTY_OBJ = {};
let uid = 0;
/**
 * 创建当前组件实例
 */
export function createComponentInstance(vnode, parent) {
  const type = vnode.type;
  const appContext = (parent ? parent.appContext : vnode.appContext) || {};
  const instance = {
    _uid: uid++, // 当前组件实例标识
    vnode, // 保存当前组件节点,
    type,
    parent,
    appContext, // 组件的全局上下文
    subTree: null!, // will be set synchronously right after creation
    update: null!, // will be set synchronously right after
    render: null,
    root: null!, // to be immediately set
    isMounted: false, // 组件是否已经挂载，决定是初次渲染还是更新
    isUnmounted: false, // 是否已经卸载
    provides: parent
      ? parent.provides
      : Object.create(appContext.provides || null), // 获取全局提供的值
    proxy: null, // 当前组件的代理实例
    exposed: null, // 向外暴露的属性或者方法
    // state
    ctx: EMPTY_OBJ,
    data: EMPTY_OBJ,
    props: EMPTY_OBJ,
    attrs: EMPTY_OBJ,
    slots: EMPTY_OBJ,
    refs: EMPTY_OBJ,
    setupState: EMPTY_OBJ,
    setupContext: null,
    accessCache: null,
  };
  instance.ctx = { _: instance };
  instance.root = parent ? parent.root : instance;
  return instance;
}

export function setupComponent(instance) {
  // 判断当前组件是不是有状态的组件
  const isStateful = isStatefulComponent(instance);

  const setupResult = isStateful ? setupStatefulComponent(instance) : undefined;
  return setupResult;
}

export function isStatefulComponent(instance) {
  return instance.vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT;
}
function setupStatefulComponent(instance) {
  const Component = instance.type;
  // 当前组件可以获取数据的来源
  instance.accessCache = Object.create(null);
  // 将组件的上下文进行代理，并且使用原本的对象
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);
  // 调用setup函数
  const { setup } = Component;
  if (setup) {
    const setupContext = (instance.setupContext =
      setup.length > 1 ? createSetupContext(instance) : null); // 如果setup函数参数大于1，那么说明用户想要使用setupContext
    //这里依赖收集的原因是，我希望setup函数只会执行一次，
    //如果在setup函数使用依赖收集，那么有种情况 比如 demo.value= 12就会出发setup函数重新执行。这样会导致循环执行的后果
    pauseTracking();
    // 如果用户传了setup函数
    const setupResult = setup.call(instance, instance.props, setupContext);
    resetTracking();
    if (isPromise(setup)) {
      // 如果用户将setup函数写成了promise异步函数,给个报错，
      // 因为这里没办法等异步执行后拿到结果再去生成render
      console.error("setup function cannot be a promise");
    } else {
      handleSetupResult(instance, setupResult);
    }
  } else {
    // 如果用户没传setup函数
    finishComponentSetup(instance);
  }
}
export function finishComponentSetup(instance) {
  // render函数可以在以下情况拿到
  // 1. 在setup函数中，返回了一个render函数
  // 2. 用户直接在组件中写了一个render函数
  // 3. 用户压根就没写render函数，那么就拿到template进行compile生成一个render函数
  // 优先级 1 > 2 > 3
  const Component = instance.type;

  if (instance.render || Component.render) {
    instance.render = instance.render || Component.render;
  } else {
    // 通过模板编译拿到render函数
  }
  console.log("当前实例", instance);
}
export function handleSetupResult(instance, setupResult) {
  if (isFunction(setupResult)) {
    // 用户的setup函数返回的是一个render函数
    instance.render = setupResult;
  } else if (isObject(setupResult)) {
    // 用户的setup函数返回的是一个对象，那这个对象的要进行代理
    instance.setupState = proxyRefs(setupResult);
  }
  finishComponentSetup(instance);
}
export function createSetupContext(instance) {
  const expose = (exposed) => {
    // 向父组件暴露自定义属性或者事件，并且做了一层响应式代理
    instance.exposed = proxyRefs(exposed);
  };
  return {
    attrs: instance.attrs, // 父组件给子组件的传值，
    slots: instance.slots,
    emit: instance.emit,
    expose,
  };
}
