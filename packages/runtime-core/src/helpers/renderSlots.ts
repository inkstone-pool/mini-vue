import { isFunction } from '@mini-vue//shared';
import { createVNode, Fragment } from '../vnode';

export function renderSlots(
  slots,
  defaultSoltName = 'default',
  slotsProps = {},
) {
  const slot = slots[defaultSoltName];
  if (slot) {
    if (isFunction(slot)) {
      return createVNode(Fragment, {}, slot(slotsProps));
    }
  }
}
