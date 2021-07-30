import { isFunction, isObject, isPromise, ShapeFlags } from "@vue/shared";
import { proxyRefs } from "@vue/vue";

let uid = 0;
/**
 * 创建当前组件实例
 */
export function createComponentInstance(vnode, parent) {
  const type = vnode.type;
  const instance = {
    _uid: uid++, // 当前组件实例标识
    vnode, // 保存当前组件节点,
    type,
    parent,
    subTree: null!, // will be set synchronously right after creation
    update: null!, // will be set synchronously right after creation
    render: null,
    root: null!, // to be immediately set
    ctx: null,
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
  // 调用setup函数
  const { setup } = Component;
  if (setup) {
    // 如果用户传了setup函数
    const setupResult = setup.call(instance);
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

