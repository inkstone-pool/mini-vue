import { ShapeFlags } from '../shared/ShapeFlags';
export const Fragment = Symbol('Fragment');
export const Text = Symbol('Text');
export { createVNode as createElementBlock };
export function createVNode(type, props?, children?) {
  let vnode = {
    type,
    props,
    children,
    component: null,
    key: props && props.key,
    shapeFlag: getShapeFlag(type),
    el: null,
  };
  if (typeof children === 'string') {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  }
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    if (typeof children === 'object') {
      vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN;
    }
  }
  return vnode;
}
export function createTextVNode(text: string) {
  return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
  if (typeof type === 'string') {
    return ShapeFlags.ELEMENT;
  } else {
    return ShapeFlags.STATEFUL_COMPONENT;
  }
}
