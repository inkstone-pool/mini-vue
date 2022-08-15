export const extend = Object.assign;
export const isObject = (value) => {
  return value !== null && typeof value == 'object';
};
export const hasChanged = (newValue, oldValue) => {
  return !Object.is(newValue, oldValue);
};
export const hasOwn = (obj: any, key: any) => {
  return Object.prototype.hasOwnProperty.call(obj, key);
};
