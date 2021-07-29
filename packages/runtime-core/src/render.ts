import { isReservedProp, ShapeFlags } from "@vue/shared";
import { effect } from "@vue/vue";
import { createAppAPI } from "./apiCreateApp";
import { createComponentInstance, setupComponent } from "./component";
import { renderComponentRoot } from "./componentRenderUtils";

export function createRender(options) {
  return baseCreateRender(options);
}
/**
 * 所有的渲染器的创建器
 * @param options
 * @returns
 */
function baseCreateRender(options) {
  // 对应类型的属性
  const patch = (n1, n2, container, anchor = null, parentComponent = null) => {
    if (n1 && !isSameVNodeType(n1, n2)) {
      // n1存在节点，并且当前新节点类型和之前的不一样，那么旧节点需要卸载
      n1 = null;
    }
    const { type, shapeFlag } = n2;
    console.log("baseCreateRender", container);

    switch (type) {
      case Text:
        processText(n1, n2, container, anchor);
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 用户传的是dom元素
          processElement(n1, n2, container, anchor, processElement);
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          // 用户传的是组件类型
          processComponent(n1, n2, container, anchor, parentComponent);
        }
        break;
    }
  };
  const processText = (n1, n2, container, anchor) => {
    if (n1 == null) {
      hostInsert(
        (n2.el = hostCreateText(n2.children as string)),
        container,
        anchor
      );
    } else {
      const el = (n2.el = n1.el!);
      if (n2.children !== n1.children) {
        hostSetText(el, n2.children as string);
      }
    }
  };
  const processCommentNode = (n1, n2, container, anchor) => {
    if (n1 == null) {
      hostInsert(
        (n2.el = hostCreateComment((n2.children as string) || "")),
        container,
        anchor
      );
    } else {
      // there's no support for dynamic comments
      n2.el = n1.el;
    }
  };
  const processElement = (n1, n2, container, anchor, parentComponent) => {
    console.log("processElement", n1, n2, container);
    if (n1 === null) {
      // 第一次挂载
      mountElement(n2, container, anchor, parentComponent);
    }
  };
  const processComponent = (n1, n2, container, anchor, parentComponent) => {
    console.log("processComponent", n1, n2, container);
    console.log(container);

    if (n1 === null) {
      // 第一次挂载
      mountComponent(n2, container, anchor, parentComponent);
    }
  };
  const mountComponent = (initialVNode, container, anchor, parentComponent) => {
    // 创建当前组件实例
    const instance = (initialVNode.component = createComponentInstance(
      initialVNode,
      parentComponent
    ));
    // 注入数据到实例
    setupComponent(instance);
    // 让渲染器变成响应式
    setupRenderEffect(instance, initialVNode, container, anchor);
  };
  const mountElement = (vnode, container, anchor, parentComponent) => {
    let el;
    const { type, props, shapeFlag } = vnode;
    console.log("mountElement", type, props);

    el = vnode.el = hostCreateElement(type, false, props && props.is, props);
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, vnode.children as string);
    }
    if (props) {
      for (const key in props) {
        if (!isReservedProp(key)) {
          hostPatchProp(
            el,
            key,
            null,
            props[key],
            false,
            vnode.children,
            parentComponent
          );
        }
      }
    }
    hostInsert(el, container, anchor);
  };
  const setupRenderEffect = (instance, initialVNode, container, anchor) => {
    instance.update = effect(function componentEffect() {
      if (!instance.isMounted) {
        // 当前组件还没被挂载
        // 得到新的组件节点，作为下一级
        console.log("setupRenderEffect", instance);

        const subTree = (instance.subTree = renderComponentRoot(instance));
        console.log("subTree", subTree);

        patch(null, subTree, container, anchor, instance);
      }
    });
  };
  // 在runtime-dom重写的一系列方法和属性更新
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    forcePatchProp: hostForcePatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    createComment: hostCreateComment,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    setScopeId: hostSetScopeId,
    cloneNode: hostCloneNode,
    insertStaticContent: hostInsertStaticContent,
  } = options;
  const render = (vnode, container) => {
    console.log("render", container);

    if (vnode === null) {
      if (container._vnode) {
        // 容器之前挂载过节点，现在要卸载节点
      }
    } else {
      patch(container._vnode || null, vnode, container);
    }
    container._vnode = vnode;
  };
  return {
    // 当前的渲染方法，这里也返回，让用户也可以自己调用render，
    render,
    // 返回一个创建实例的方法
    createApp: createAppAPI(render),
  };
}
/**
 * 是否为同一个节点类型
 * @param n1
 * @param n2
 * @returns
 */
export function isSameVNodeType(n1, n2): boolean {
  return n1.type === n2.type && n1.key === n2.key;
}
