export const extend = Object.assign;
export const isObject = (value) => {
  return value !== null && typeof value == 'object';
};
export const isFunction = (value) => {
  return typeof value === 'function';
};
export const hasChanged = (newValue, oldValue) => {
  return !Object.is(newValue, oldValue);
};
export const hasOwn = (obj: any, key: any) => {
  return Object.prototype.hasOwnProperty.call(obj, key);
};
export const capitalize = (str: String) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
export const camelize = (str: String) => {
  return str.replace(/-(\w)/g, (_, c: String) => {
    return c && c.toUpperCase();
  });
};
export const increasingNewIndexSequence = (arr: Array<Number>) => {
  const copyArr = [...arr];
  const result = [0];
  let i, j, u, v, c;
  const length = arr.length;
  for (i = 0; i < length; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        copyArr[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          copyArr[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = copyArr[v];
  }
  return result;
};
