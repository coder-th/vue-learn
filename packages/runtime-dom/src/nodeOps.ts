export const svgNS = "http://www.w3.org/2000/svg";

const doc = (typeof document !== "undefined" ? document : null) as Document;

let tempContainer: HTMLElement;
let tempSVGContainer: SVGElement;
/**
 * 重写node节点的相关操作，这里比较简单，了解一下就可以了
 */
export const nodeOps = {
  insert: (child, parent, anchor) => {
    parent.insertBefore(child, anchor || null);
  },

  remove: (child) => {
    const parent = child.parentNode;
    if (parent) {
      parent.removeChild(child);
    }
  },

  createElement: (tag, isSVG, is, props): Element => {
    const el = isSVG
      ? doc.createElementNS(svgNS, tag)
      : doc.createElement(tag, is ? { is } : undefined);

    if (tag === "select" && props && props.multiple != null) {
      (el as HTMLSelectElement).setAttribute("multiple", props.multiple);
    }

    return el;
  },

  createText: (text) => doc.createTextNode(text),

  createComment: (text) => doc.createComment(text),

  setText: (node, text) => {
    node.nodeValue = text;
  },

  setElementText: (el, text) => {
    el.textContent = text;
  },

  parentNode: (node) => node.parentNode as Element | null,

  nextSibling: (node) => node.nextSibling,

  querySelector: (selector) => doc.querySelector(selector),

  setScopeId(el, id) {
    el.setAttribute(id, "");
  },

  cloneNode(el) {
    const cloned = el.cloneNode(true);
    if (`_value` in el) {
      (cloned as any)._value = (el as any)._value;
    }
    return cloned;
  },
  insertStaticContent(content, parent, anchor, isSVG) {
    const temp = isSVG
      ? tempSVGContainer ||
        (tempSVGContainer = doc.createElementNS(svgNS, "svg"))
      : tempContainer || (tempContainer = doc.createElement("div"));
    temp.innerHTML = content;
    const first = temp.firstChild as Element;
    let node: Element | null = first;
    let last: Element = node;
    while (node) {
      last = node;
      nodeOps.insert(node, parent, anchor);
      node = temp.firstChild as Element;
    }
    return [first, last];
  },
};
