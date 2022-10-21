import { ReactiveEffect } from '../../reactivity/src/effect';
import { queuePreFlushCb } from './scheduler';

export function watchEffect(fn) {
  function job() {
    effect.run();
  }
  let cleanup;
  const onCleanup = function (fn) {
    cleanup = effect.onStop = () => {
      fn();
    };
  };
  function getter() {
    cleanup && cleanup();
    fn(onCleanup);
  }
  const effect = new ReactiveEffect(getter, () => {
    queuePreFlushCb(job);
  });
  effect.run();
  return () => {
    effect.stop();
  };
}
