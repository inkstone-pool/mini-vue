import { ShapeFlags } from '../shared/ShapeFlags';
import { createComponentInstance, setupComponent } from './component';
import { createAppAPI } from './createApp';
import { Fragment, Text } from './vnode';
//作为底层向上层提供的个性化渲染器函数
export function createRenderer(renderFlowOptions) {
  const { createElement, patchProp, insert } = renderFlowOptions;

  function render(vnode, container) {
    patch(vnode, container, null);
  }
  function patch(vnode, container, parentComponent) {
    let { type, shapeFlag } = vnode;
    switch (type) {
      case Fragment:
        processFragment(vnode, container, parentComponent);
        break;
      case Text:
        processText(vnode, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(vnode, container, parentComponent);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(vnode, container, parentComponent);
        }
        break;
    }
  }
  function processText(vnode: any, container: any) {
    const { children } = vnode;
    const textNode = (vnode.el = document.createTextNode(children));
    container.append(textNode);
  }
  /* 
  处理render的虚拟dom 返回的type属性为Fragment,只渲染children
  */
  function processFragment(vnode: any, container: any, parentComponent) {
    mountChildren(vnode.children, container, parentComponent);
  }
  /* 
  处理render的虚拟dom 返回的type属性为浏览器原生元素(叫组件也不过分吧),进行初始化挂载与更新处理
  */
  function processElement(vnode: any, container: any, parentComponent) {
    mountElement(vnode, container, parentComponent);
  }
  function mountElement(vnode: any, container: any, parentComponent) {
    const el = (vnode.el = createElement(vnode.type));
    const { props, children, shapeFlag } = vnode;
    for (const key in props) {
      const isOn = (key) => /^on[A-Z]/.test(key);
      patchProp(el, key, props[key]);
    }
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      //数组
      mountChildren(children, el, parentComponent);
    }
    insert(el, container);
  }
  function mountChildren(vnode, container, parentComponent) {
    vnode.forEach((v) => {
      patch(v, container, parentComponent);
    });
  }
  /* 
  处理render的虚拟dom 返回的type属性为使用者定义的组件对象，进行初始挂载响应式对象与render函数
  */
  function processComponent(vnode: any, container: any, parentComponent: any) {
    mountComponent(vnode, container, parentComponent);
  }
  function mountComponent(
    initinalVnode: any,
    container: any,
    parentComponent: any,
  ) {
    const instance = createComponentInstance(initinalVnode, parentComponent);
    setupComponent(instance);
    setupRenderEffect(instance, initinalVnode, container);
  }

  function setupRenderEffect(
    instance: any,
    initinalVnode: any,
    container: any,
  ) {
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);
    patch(subTree, container, instance);
    //初始化挂载结束时
    initinalVnode.el = subTree.el;
  }
  //保持调用链依赖注入的个性化render函数
  return {
    createApp: createAppAPI(render),
  };
}
