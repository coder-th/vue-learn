import { EMPTY_OBJ, hasOwn } from "@vue/shared";

const enum AccessTypes {
  SETUP,
  DATA,
  PROPS,
  CONTEXT,
  OTHER,
}
let normalizedProps;
let globalProperties;
export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key: string) {
    const { accessCache, setupState, data, ctx, props, appContext } = instance;
    if (key[0] !== "$") {
      // 不是以$开头的变量，说明是用户定义的变量
      // 现在缓存中查询
      const n = accessCache[key];
      if (n !== undefined) {
        switch (n) {
          case AccessTypes.SETUP:
            return setupState[key];
          case AccessTypes.DATA:
            return data[key];
          case AccessTypes.CONTEXT:
            return ctx[key];
          case AccessTypes.PROPS:
            return props![key];
        }
      } else if (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) {
        accessCache![key] = AccessTypes.SETUP;
        return setupState[key];
      } else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
        accessCache![key] = AccessTypes.DATA;
        return data[key];
      } else if (
        // only cache other properties when instance has declared (thus stable)
        // props
        (normalizedProps = instance.propsOptions[0]) &&
        hasOwn(normalizedProps, key)
      ) {
        accessCache![key] = AccessTypes.PROPS;
        return props![key];
      } else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
        accessCache![key] = AccessTypes.CONTEXT;
        return ctx[key];
      }
    }
    // 用户可能取值 eg. app.config.globalProperties.$http
    if (
      ((globalProperties = appContext.config.globalProperties),
      hasOwn(globalProperties, key))
    ) {
      return globalProperties[key];
    }
  },
  set({ _: instance }, key: string, value) {
    const { data, setupState, ctx } = instance;
    if (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) {
      setupState[key] = value;
    } else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
      data[key] = value;
    }
    if (key[0] === "$" && key.slice(1) in instance) {
      // 设置的$开头的属性，必须是组件上的属性
      ctx[key] = value;
    }
    return true;
  },
  has({ _: instance }, key: string): boolean {
    const { data, setupState, accessCache, ctx, appContext, propsOptions } =
      instance;
    let normalizedProps;
    return (
      accessCache![key] !== undefined ||
      (data !== EMPTY_OBJ && hasOwn(data, key)) ||
      (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) ||
      ((normalizedProps = propsOptions[0]) && hasOwn(normalizedProps, key)) ||
      hasOwn(ctx, key) ||
      hasOwn(appContext.config.globalProperties, key)
    );
  },
};
