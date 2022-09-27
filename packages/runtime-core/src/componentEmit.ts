import { camelize, capitalize } from '@mini-vue/shared';

export function emit(instance: any, eventName: string, ...args) {
  const { props } = instance;

  const toHandlerkey = (str: string) => {
    return str && 'on' + capitalize(str);
  };
  const handler = props[toHandlerkey(camelize(eventName))];
  handler && handler(...args);
}
