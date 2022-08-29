import { proxyRefs } from '../reactivity';
import { shallowReadonly } from '../reactivity/reactive';
import { emit } from './componentEmit';
import { initProps } from './componentProps';
import { PublicInstanceProxyHandlers } from './componentPublicInstance';
import { initSlots } from './componentSlots';

export function createComponentInstance(vnode: any, parent: any) {
  const component = {
    vnode,
    type: vnode.type,
    next: null,
    setupState: {},
    props: {},
    slots: {},
    provides: parent?.provides || {}, //指向父指针
    parent,
    emit: () => {},
    isMounted: false,
    subTree: {},
  };
  component.emit = emit.bind(null, component) as any;
  return component;
}
export function setupComponent(instance) {
  initProps(instance, instance.vnode.props);
  initSlots(instance, instance.vnode.children);
  setupStatefulComponent(instance);
}
function setupStatefulComponent(instance: any) {
  const Component = instance.type;
  instance.proxy = new Proxy(
    { _instance: instance },
    PublicInstanceProxyHandlers,
  );
  const { setup } = Component;
  if (setup) {
    //暴露组件实例对象
    setCurrentInstance(instance);
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    });
    setCurrentInstance(null);

    handleSetupResult(instance, setupResult);
  }
}

function handleSetupResult(instance: any, setupResult: any) {
  if (typeof setupResult == 'object') {
    instance.setupState = proxyRefs(setupResult);
  }
  finishComponentSetup(instance);
}
function finishComponentSetup(instance: any) {
  const Component = instance.type;
  if (compiler && !Component.render) {
    if (Component.template) {
      Component.render = compiler(Component.template);
    }
  }
  instance.render = Component.render;
}
let currentInstance = null;
export function getCurrentInstance() {
  return currentInstance;
}
export function setCurrentInstance(instance: any) {
  currentInstance = instance;
}
let compiler;
export function registerRuntimeCompiler(_compiler) {
  compiler = _compiler;
}
