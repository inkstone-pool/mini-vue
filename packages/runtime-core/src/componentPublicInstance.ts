import { hasOwn } from '@mini-vue/shared';

const publicPropertiesMap = {
  $el: (i) => i.vnode.el,
  $slots: (i) => i.slots,
  $props: (i) => i.props,
};
export const PublicInstanceProxyHandlers = {
  get({ _instance }, key) {
    const { setupState, props } = _instance;
    if (key in setupState) {
      return setupState[key];
    }
    if (hasOwn(setupState, key)) {
      return setupState[key];
    } else if (hasOwn(props, key)) {
      return props[key];
    }
    return publicPropertiesMap[key] && publicPropertiesMap[key](_instance);
  },
};
