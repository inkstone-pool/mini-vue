import { reactive } from '@mini-vue/reactivity';
import { vi, describe, it, expect } from 'vitest';
import { nextTick } from '../../runtime-core/src/scheduler';
import { watchEffect } from '../src/watchEffect';
describe('watchEffect', () => {
  it('watchEffect', async () => {
    const state = reactive({ count: 0 });
    let dummy;
    watchEffect(() => {
      dummy = state.count;
    });
    state.count++;
    await nextTick(() => {});
    expect(dummy).toBe(1);
  });
  it('stop', async () => {
    const state = reactive({ count: 0 });
    let dummy;
    let stop = watchEffect(() => {
      dummy = state.count;
    });
    expect(dummy).toBe(0);
    stop();
    state.count++;
    await nextTick(() => {});
    expect(dummy).toBe(0);
  });
  it('cleanup', async () => {
    const state = reactive({ count: 0 });
    const cleanup = vi.fn();
    let dummy;
    let stop = watchEffect((onCleanup) => {
      onCleanup(cleanup);
      dummy = state.count;
    });
    expect(dummy).toBe(0);

    state.count++;
    await nextTick(() => {});
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(dummy).toBe(1);
    stop();
    expect(cleanup).toHaveBeenCalledTimes(2);
  });
});
