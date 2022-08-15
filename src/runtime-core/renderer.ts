import { ShapeFlags } from '../shared/ShapeFlags';
import { createComponentInstance, setupComponent } from './component';

export function render(vnode, container) {
  patch(vnode, container);
}
function patch(vnode, container) {
  let { shapeFlag } = vnode;
  // process component
  if (shapeFlag & ShapeFlags.ELEMENT) {
    processElement(vnode, container);
  } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    processComponent(vnode, container);
  }
}
/* 
处理render的虚拟dom 返回的type属性为浏览器原生元素(叫组件也不过分吧),进行初始化挂载与更新处理
*/
function processElement(vnode: any, container: any) {
  mountElement(vnode, container);
}
function mountElement(vnode: any, container: any) {
  const el = (vnode.$el = document.createElement(vnode.type));
  const { props, children, shapeFlag } = vnode;
  for (const key in props) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
      const eventName = key.slice(2).toLowerCase();
      el.addEventListener(eventName, props[key]);
    } else {
      el.setAttribute(key, props[key]);
    }
  }
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children;
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    //数组
    mountChildren(children, el);
  }
  container.append(el);
}
function mountChildren(vnode, container) {
  vnode.forEach((v) => {
    patch(v, container);
  });
}
/* 
处理render的虚拟dom 返回的type属性为使用者定义的组件对象，进行初始挂载响应式对象与render函数
*/
function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container);
}
function mountComponent(initinalVnode: any, container: any) {
  const instance = createComponentInstance(initinalVnode);
  setupComponent(instance);
  setupRenderEffect(instance, initinalVnode, container);
}

function setupRenderEffect(instance: any, initinalVnode: any, container: any) {
  const { proxy } = instance;
  const subTree = instance.render.call(proxy);
  patch(subTree, container);
  //初始化挂载结束时
  initinalVnode.$el = subTree.$el;
}
