import { createRenderer } from '../runtime-core';
function createElement(type) {
  return document.createElement(type);
}
function patchProp(el, key, val) {
  const isOn = (key) => /^on[A-Z]/.test(key);
  if (isOn(key)) {
    const eventName = key.slice(2).toLowerCase();
    el.addEventListener(eventName, val);
  } else {
    el.setAttribute(key, val);
  }
}
function insert(el, parent) {
  parent.append(el);
}
//定义默认渲染器
const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
});
//引入runtime-dom 提供默认dom渲染器写法，纯函数的链式调用就是麻烦需要类似闭包保持依赖
export function createApp(...args) {
  return renderer.createApp(...args);
}
//主动转导上层依赖
export * from '../runtime-core';
