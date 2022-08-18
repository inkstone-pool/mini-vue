import { effect } from '../reactivity/effect';
import { ShapeFlags } from '../shared/ShapeFlags';
import { createComponentInstance, setupComponent } from './component';
import { createAppAPI } from './createApp';
import { Fragment, Text } from './vnode';
//作为底层向上层提供的个性化渲染器函数
export function createRenderer(renderFlowOptions) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = renderFlowOptions;

  function render(vnode, container) {
    patch(null, vnode, container, null);
  }
  function patch(n1, n2, container, parentComponent) {
    let { type, shapeFlag } = n2;
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent);
        break;
      case Text:
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent);
        }
        break;
    }
  }
  function processText(n1, n2: any, container: any) {
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));
    container.append(textNode);
  }
  /* 
  处理render的虚拟dom 返回的type属性为Fragment,只渲染children
  */
  function processFragment(n1: any, n2: any, container: any, parentComponent) {
    mountChildren(n2.children, container, parentComponent);
  }
  /* 
  处理render的虚拟dom 返回的type属性为浏览器原生元素(叫组件也不过分吧),进行初始化挂载与更新处理
  */
  function processElement(n1: any, n2: any, container: any, parentComponent) {
    if (!n1) {
      mountElement(n2, container, parentComponent);
    } else {
      patchElement(n1, n2, parentComponent);
    }
  }
  function patchElement(n1, n2, parentComponent) {
    console.log(n1, n2, 'patchElement');
    const oldProps = n1.props || {};
    const newProps = n2.props || {};
    const el = (n2.el = n1.el);
    patchChildren(n1, n2, el, parentComponent);
    patchProps(el, oldProps, newProps);
  }
  function patchChildren(n1, n2, container, parentComponent) {
    const { shapeFlag: prevShapeFlag } = n1;
    const { shapeFlag: nextShapeFlag } = n2;
    if (nextShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        //ArrayToText
        unmountChildren(n1.children);
      }
      if (n2.children !== n1.children) {
        //TextToText
        hostSetElementText(container, n2.children);
      }
    } else {
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        //TextToArray
        hostSetElementText(container, '');
        mountChildren(n2.children, container, parentComponent);
      } else {
        //ArrayToArray
      }
    }
  }
  function unmountChildren(children) {
    children.forEach((child) => {
      hostRemove(child.el);
    });
  }
  function patchProps(el, oldProps, newProps) {
    if (oldProps !== newProps) {
      for (const key in newProps) {
        const prevProp = oldProps[key];
        const nextProp = newProps[key];
        if (prevProp !== newProps) {
          hostPatchProp(el, key, prevProp, nextProp);
        }
      }
    }
    if (JSON.stringify(oldProps) !== '{}') {
      for (const key in oldProps) {
        if (!(key in newProps)) {
          hostPatchProp(el, key, oldProps[key], null);
        }
      }
    }
  }
  function mountElement(vnode: any, container: any, parentComponent) {
    const el = (vnode.el = hostCreateElement(vnode.type));
    const { props, children, shapeFlag } = vnode;
    for (const key in props) {
      hostPatchProp(el, key, null, props[key]);
    }
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      //数组
      mountChildren(children, el, parentComponent);
    }
    hostInsert(el, container);
  }
  function mountChildren(children, container, parentComponent) {
    children.forEach((v) => {
      patch(null, v, container, parentComponent);
    });
  }
  /* 
  处理render的虚拟dom 返回的type属性为使用者定义的组件对象，进行初始挂载响应式对象与render函数
  */
  function processComponent(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any,
  ) {
    mountComponent(n2, container, parentComponent);
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
    effect(() => {
      if (!instance.isMounted) {
        //初始化
        const { proxy } = instance;
        //初始化记录总虚拟节点对象
        const subTree = (instance.subTree = instance.render.call(proxy));
        patch(null, subTree, container, instance);
        //初始化挂载结束时
        initinalVnode.el = subTree.el;

        instance.isMounted = true;
      } else {
        //更新
        const { proxy } = instance;
        const subTree = instance.render.call(proxy);
        const preSubTree = instance.subTree;
        instance.subTree = subTree;
        patch(preSubTree, subTree, container, instance);
      }
    });
  }
  //保持调用链依赖注入的个性化render函数
  return {
    createApp: createAppAPI(render),
  };
}
