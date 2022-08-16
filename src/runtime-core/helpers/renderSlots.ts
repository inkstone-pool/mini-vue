import { createVNode } from '../vnode';

export function renderSlots(
  slots,
  defaultSoltName = 'default',
  slotsProps = {},
) {
  const slot = slots[defaultSoltName];
  if (slot) {
    if (typeof slot === 'function') {
      return createVNode('div', {}, slot(slotsProps));
    }
  }
}
