import { createRenderer } from '@mini-vue/runtime-core';
function createElement(type) {
  return document.createElement(type);
}
function patchProp(el, key, prevVal, nextVal) {
  const isOn = (key) => /^on[A-Z]/.test(key);
  if (isOn(key)) {
    const eventName = key.slice(2).toLowerCase();
    el.addEventListener(eventName, nextVal);
  } else {
    if (nextVal === undefined || nextVal == null) {
      el.removeAttribute(key, nextVal);
    } else {
      el.setAttribute(key, nextVal);
    }
  }
}
function insert(child, parent, anchor) {
  parent.insertBefore(child, anchor || null);
}
function remove(child) {
  child.parentNode && child.parentNode.removeChild(child);
}
function setElementText(container, text) {
  container.textContent = text;
}
//定义默认渲染器
const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  remove,
  setElementText,
});
//引入runtime-dom 提供默认dom渲染器写法，纯函数的链式调用就是麻烦需要类似闭包保持依赖
export function createApp(...args) {
  return renderer.createApp(...args);
}
//主动转导上层依赖
export * from '@mini-vue/runtime-core';
