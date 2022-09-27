import { hasChanged, isObject } from '@mini-vue/shared';
import { isTracking, trackEffects, triggerEffects } from './effect';
import { reactive } from './reactive';

class RefImpl {
  private _value: any;
  public dep = new Set();
  private _rawValue: any;
  constructor(value) {
    this._rawValue = value;
    this._value = convert(value);
  }

  set value(v: any) {
    if (!hasChanged(v, this._rawValue)) return;
    this._rawValue = v;
    this._value = convert(v);
    triggerEffects(this.dep);
  }

  get value(): any {
    isTracking() && trackEffects(this.dep);
    return this._value;
  }
}
function convert(v) {
  return isObject(v) ? reactive(v) : v;
}
export function ref(value) {
  return new RefImpl(value);
}
export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, p) {
      return unRef(Reflect.get(target, p));
    },
    set(target, p, value) {
      if (isRef(Reflect.get(target, p)) && !isRef(value)) {
        return (target[p].value = value);
      } else {
        return Reflect.set(target, p, value);
      }
    },
  });
}
export function isRef(ref) {
  return ref instanceof RefImpl;
}
export function unRef(ref) {
  return isRef(ref) ? ref.value : ref;
}
