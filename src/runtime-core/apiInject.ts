import { isFunction } from '../shared';
import { getCurrentInstance } from './component';

export function provider(key, val) {
  const currentInstance: any = getCurrentInstance();
  if (currentInstance) {
    let { provides } = currentInstance;
    const parentProvides = currentInstance.parent?.provides;
    //将父提供的实例放在原型上防止当前组件实例修改后影响到父组件的提供
    if (provides === parentProvides) {
      provides = currentInstance.provides = Object.create(parentProvides);
    }
    provides[key] = val;
  }
}
export function inject(key, defaultValue) {
  const currentInstance: any = getCurrentInstance();
  if (currentInstance) {
    const { parent } = currentInstance;
    return (
      parent.provides[key] ||
      (isFunction(defaultValue) ? defaultValue() : defaultValue)
    );
  }
}
