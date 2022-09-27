import { effect } from '@mini-vue/reactivity';
import { increasingNewIndexSequence } from '@mini-vue//shared';
import { ShapeFlags } from '@mini-vue//shared';
import { createComponentInstance, setupComponent } from './component';
import { createAppAPI } from './createApp';
import { queueJobs } from './scheduler';
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
    patch(null, vnode, container, null, null);
  }
  function patch(n1, n2, container, parentComponent, archer) {
    let { type, shapeFlag } = n2;
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, archer);
        break;
      case Text:
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent, archer);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent, archer);
        }
        break;
    }
  }
  function processText(n1, n2: any, container: any) {
    if (n1 && n1.children !== n2.children) {
      //更新
      n1.el.textContent = n2.children;
    } else if (!n1) {
      //初始化
      const { children } = n2;
      const textNode = (n2.el = document.createTextNode(children));
      container.append(textNode);
    }
  }
  /* 
  处理render的虚拟dom 返回的type属性为Fragment,只渲染children
  */
  function processFragment(
    n1: any,
    n2: any,
    container: any,
    parentComponent,
    archer,
  ) {
    mountChildren(n2.children, container, parentComponent, archer);
  }
  /* 
  处理render的虚拟dom 返回的type属性为浏览器原生元素(叫组件也不过分吧),进行初始化挂载与更新处理
  */
  function processElement(
    n1: any,
    n2: any,
    container: any,
    parentComponent,
    archer: any,
  ) {
    if (!n1) {
      mountElement(n2, container, parentComponent, archer);
    } else {
      patchElement(n1, n2, parentComponent, archer);
    }
  }
  function patchElement(n1, n2, parentComponent, archer) {
    const oldProps = n1.props || {};
    const newProps = n2.props || {};
    const el = (n2.el = n1.el);
    patchChildren(n1, n2, el, parentComponent, archer);
    patchProps(el, oldProps, newProps);
  }
  function patchChildren(n1, n2, container, parentComponent, archer) {
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
        mountChildren(n2.children, container, parentComponent, archer);
      } else {
        //ArrayToArray
        patchKeyedChildren(
          n1.children,
          n2.children,
          container,
          parentComponent,
          archer,
        );
      }
    }
  }
  function patchKeyedChildren(
    c1,
    c2,
    container,
    parentComponent,
    parentArcher,
  ) {
    let i = 0;
    const l1 = c1.length;
    const l2 = c2.length;
    let e1 = l1 - 1;
    let e2 = l2 - 1;
    function isSameVnodeType(n1, n2) {
      return n1.type === n2.type && n1.key === n2.key;
    }
    //左侧
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVnodeType(n1, n2)) {
        //外层相同判断里层
        patch(n1, n2, container, parentComponent, parentArcher);
      } else {
        break;
      }
      i++;
    }
    // 右侧
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVnodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentArcher);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    //new>old
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        const archer = nextPos < l2 ? c2[nextPos].el : null;
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, archer);
          i++;
        }
      }
    } else if (i > e2) {
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    } else {
      const s1 = i; //便于循环识别
      const s2 = i;
      const toBePatched = e2 - s2 + 1;
      let hasPatched = 0;
      const keyToNewIndexMap = new Map(); //新节点存旧节点取识别是否未来已经存在，格式{'key1':0,'key2':1}
      const newIndexToOldIndexMap = Array(toBePatched).fill(0);
      let moved = false;
      let maxNewIndexSofar = 0;
      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        nextChild.key && keyToNewIndexMap.set(nextChild.key, i);
      }
      let newIndex;
      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i];
        if (hasPatched >= toBePatched) {
          hostRemove(prevChild.el);
          continue;
        }
        if (prevChild.key) {
          //写key便于查找
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          for (let j = s2; j <= e2; j++) {
            if (isSameVnodeType(prevChild, e2[j])) {
              newIndex = j;
              break;
            }
          }
        }
        if (!newIndex) {
          //新的找不到相同的
          hostRemove(prevChild.el);
        } else {
          if (newIndex > maxNewIndexSofar) {
            maxNewIndexSofar = newIndex;
          } else {
            moved = true;
          }
          newIndexToOldIndexMap[newIndex - s2] = i + 1; //旨在准备好新旧key值匹配的新旧索引映射，例如
          /* 
          old:[a,b,c,d,e,z,f,g]
          new:[a,b,d,c,y,e,f,g]
          newIndexToOldIndexMap: [0: 4
                                  1: 3
                                  2: 0
                                  3: 5]
          
          */
          //找到了递归对比更新
          patch(prevChild, c2[newIndex], container, parentComponent, null);
          hasPatched++;
        }
      }

      const increasingSequence = moved
        ? increasingNewIndexSequence(newIndexToOldIndexMap)
        : [];
      /* 
     increasingSequence: [0: 1
                          1: 3]
     */
      let j = increasingSequence.length - 1;
      for (let i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = i + s2;
        const nextChild = c2[nextIndex];
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, parentComponent, anchor);
        } else {
          if (moved) {
            if (j < 0 || i !== increasingSequence[j]) {
              //move
              hostInsert(nextChild.el, container, anchor);
            } else {
              j--;
            }
          }
        }
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
  function mountElement(vnode: any, container: any, parentComponent, anchor) {
    const el = (vnode.el = hostCreateElement(vnode.type));
    const { props, children, shapeFlag } = vnode;
    for (const key in props) {
      hostPatchProp(el, key, null, props[key]);
    }
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      //数组
      mountChildren(children, el, parentComponent, anchor);
    }
    hostInsert(el, container, anchor);
  }
  function mountChildren(children, container, parentComponent, anchor) {
    children.forEach((v) => {
      patch(null, v, container, parentComponent, anchor);
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
    anchor: any,
  ) {
    if (!n1) {
      mountComponent(n2, container, parentComponent, anchor);
    } else {
      updateComponent(n1, n2);
    }
  }
  function mountComponent(
    initinalVnode: any,
    container: any,
    parentComponent: any,
    anchor: any,
  ) {
    const instance = (initinalVnode.component = createComponentInstance(
      initinalVnode,
      parentComponent,
    ));
    setupComponent(instance);
    setupRenderEffect(instance, initinalVnode, container, anchor);
  }
  function updateComponent(n1, n2) {
    const instance = (n2.component = n1.component);
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2;
      instance.update();
    } else {
      n2.el = n1.el;
      instance.vnode = n2;
    }
  }

  function setupRenderEffect(
    instance: any,
    initinalVnode: any,
    container: any,
    anchor: any,
  ) {
    instance.update = effect(
      () => {
        if (!instance.isMounted) {
          //初始化
          const { proxy } = instance;
          //初始化记录总虚拟节点对象
          const subTree = (instance.subTree = instance.render.call(
            proxy,
            proxy,
          ));
          patch(null, subTree, container, instance, anchor);
          //初始化挂载结束时
          initinalVnode.el = subTree.el;

          instance.isMounted = true;
        } else {
          //更新
          const { proxy, next, vnode } = instance;
          if (next) {
            next.el = vnode.el;
          }
          updateComponentPreRender(instance, next);
          const subTree = instance.render.call(proxy, proxy);
          const preSubTree = instance.subTree;
          instance.subTree = subTree;
          patch(preSubTree, subTree, container, instance, anchor);
        }
      },
      {
        scheduler() {
          queueJobs(instance.update);
        },
      },
    );
  }

  //保持调用链依赖注入的个性化render函数
  return {
    createApp: createAppAPI(render),
  };
}
function updateComponentPreRender(instance, nextVnode) {
  instance.vnode = nextVnode;
  instance.next = null;
  instance.props = nextVnode.props;
}
