import {
  extend,
  isArray,
  isFunction,
  isObject,
  isOn,
  isString,
  normalizeClass,
  normalizeStyle,
  ShapeFlags,
} from "@vue/shared";
import { isProxy } from "@vue/vue";

export function createVNode(type, props?, children: unknown = null) {
  if (!type) {
    type = Comment;
  }
  console.log("isVNode", type);

  // class & style normalization.标准化class和style属性
  if (props) {
    // for reactive or proxy objects, we need to clone it to enable mutation.
    if (isProxy(props)) {
      props = extend({}, props);
    }
    let { class: klass, style } = props;
    if (klass && !isString(klass)) {
      props.class = normalizeClass(klass);
    }
    if (isObject(style)) {
      // reactive state objects need to be cloned since they are likely to be
      // mutated
      if (isProxy(style) && !isArray(style)) {
        style = extend({}, style);
      }
      props.style = normalizeStyle(style);
    }
  }
  // 用二进制来保存当前组件类型，好处是可以通过进制运算得到多方面知道组件的具体类型
  // eg. 00000100&00000110  =》 状态组件&函数组件 =》具有状态的函数组件
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : isFunction(type)
    ? ShapeFlags.FUNCTIONAL_COMPONENT
    : 0;
  const vnode = {
    __v_isVNode: true,
    __v_skip: true,
    type,
    props,
    shapeFlag,
    key: props && normalizeKey(props),
    children: null,
    component: null,
    el: null,
  };
  console.log("createVNode", vnode);
  normalizeChildren(vnode, children);
  return vnode;
}
export const Fragment = Symbol(undefined);
export const Comment = Symbol(undefined);
export const Text = Symbol(undefined);
/**
 * 标准化虚拟节点
 * @param child
 */
export function normalizeVNode(child) {
  if (child === null || typeof child === "boolean") {
    //   empty placeholder
    return createVNode(Comment);
  } else if (isArray(child)) {
    return createVNode(Fragment);
  } else if (typeof child === "object") {
    return child.el === null ? child : cloneVNode(child);
  } else {
    // 普通的字符串或者数字
    return createVNode(Text, null, child);
  }
}
/**
 * 复制节点
 * @param vnode
 * @param extraProps
 * @returns
 */
export function cloneVNode(vnode, extraProps?) {
  const { props, children } = vnode;
  // 合并props
  const mergedProps = extraProps ? mergeProps(props || {}, extraProps) : props;
  const cloneNode = {
    __v_isVNode: true,
    __v_skip: true,
    type: vnode.type,
    props: mergedProps,
    key: mergedProps && normalizeKey(mergedProps),
    children,
    el: vnode.el,
    anchor: vnode.anchor,
    component: vnode.component,
  };

  return cloneNode;
}
/**
 * 规范化节点的children属性，给虚拟节点添加上children
 * @param vnode
 * @param children
 */
export function normalizeChildren(vnode, children) {
  let type = 0;
  const { shapeFlag } = vnode;
  console.log("normalizeChildren", vnode, children);

  if (children == null) {
    children = null;
  } else if (isArray(children)) {
    // 子节点是数组
    type = ShapeFlags.ARRAY_CHILDREN;
  } else if (typeof children === "object") {
    // 子节点是插槽
    type = ShapeFlags.SLOTS_CHILDREN;
  } else if (isFunction(children)) {
    // 子节点是函数，包装成对象，变成插槽统一处理
    children = { default: children };
  } else {
    // 子节点是普通类型
    children = String(children);
    type = ShapeFlags.TEXT_CHILDREN;
  }
  // 保存子节点到虚拟节点上
  vnode.children = children;
  // 更新节点类型
  vnode.shapeFlag |= type;
}

export function mergeProps(...args) {
  const ret = extend({}, args[0]);
  for (let i = 1; i < args.length; i++) {
    const toMerge = args[i];
    for (const key in toMerge) {
      if (key === "class") {
        if (ret.class !== toMerge.class) {
          ret.class = normalizeClass([ret.class, toMerge.class]);
        }
      } else if (key === "style") {
        ret.style = normalizeStyle([ret.style, toMerge.style]);
      } else if (isOn(key)) {
        const existing = ret[key];
        const incoming = toMerge[key];
        if (existing !== incoming) {
          ret[key] = existing
            ? [].concat(existing as any, incoming as any)
            : incoming;
        }
      } else if (key !== "") {
        ret[key] = toMerge[key];
      }
    }
  }
  return ret;
}
const normalizeKey = ({ key }) => (key != null ? key : null);
export function isVNode(value: any) {
  return value ? value.__v_isVNode === true : false;
}
