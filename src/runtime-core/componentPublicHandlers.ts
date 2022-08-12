const componentPublicHandlersMap = {
  $el: (i) => i.vnode.$el,
};
export const componentPublicHandlers = {
  get({ _instance }, key) {
    const { setupState } = _instance;
    if (key in setupState) {
      return setupState[key];
    }
    return (
      componentPublicHandlersMap[key] &&
      componentPublicHandlersMap[key](_instance)
    );
  },
};
