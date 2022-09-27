import { ShapeFlags } from '@mini-vue/shared';

export function initSlots(instance: any, children: any) {
  const { vnode } = instance;
  if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
    normalizeObjectSlots(instance.slots, children);
  }
}
function normalizeObjectSlots(slots: any, children: any) {
  for (const key in children) {
    if (Object.prototype.hasOwnProperty.call(children, key)) {
      slots[key] = (props) => normalizeSlotValue(children[key](props));
    }
  }
}

function normalizeSlotValue(value) {
  return Array.isArray(value) ? value : [value];
}
