import {
  mutableHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers,
  type Handlers,
} from './baseHandlers';
export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly',
}

export function reactive(raw: Object) {
  return createActiveObject(raw, mutableHandlers);
}
export function readonly(raw: Object) {
  return createActiveObject(raw, readonlyHandlers);
}
export function shallowReadonly(raw: Object) {
  return createActiveObject(raw, shallowReadonlyHandlers);
}
export function isReactive(value) {
  return !!value[ReactiveFlags.IS_REACTIVE];
}
export function isReadOnly(value) {
  return !!value[ReactiveFlags.IS_READONLY];
}
export function isProxy(value) {
  return isReactive(value) || isReadOnly(value);
}
function createActiveObject(raw: Object, baseHandlers: Handlers): any {
  return new Proxy(raw, baseHandlers);
}
