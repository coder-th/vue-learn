import { createAppAPI } from "./apiCreateApp";

export function createRender(options) {
  return baseCreateRender(options);
}
/**
 * 所有的渲染器的创建器
 * @param options
 * @returns
 */
function baseCreateRender(options) {
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
  const render = (container) => {
    console.log("render", container);
  };
  return {
    // 当前的渲染方法，这里也返回，让用户也可以自己调用render，
    render,
    // 返回一个创建实例的方法
    createApp: createAppAPI(render),
  };
}
