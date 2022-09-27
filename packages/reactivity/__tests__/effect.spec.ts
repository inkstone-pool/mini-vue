import { reactive } from '../src/reactive';
import { effect, stop } from '../src/effect';
import { vi } from 'vitest';
describe('effect', () => {
  it('happy path', () => {
    const user = reactive({
      age: 10,
    });
    let nextAge;
    effect(() => {
      nextAge = user.age + 1;
    });
    //假如多次使用同一个方法，副作用实例都是独立new的
    effect(() => {
      nextAge = user.age + 1;
    });
    expect(nextAge).toBe(11);
    //update
    user.age++;
    expect(nextAge).toBe(12);
  });
  it('should return runner when call effect', () => {
    let foo = 10;
    let runner = effect(() => {
      foo++;
      return 'foo';
    });
    expect(foo).toBe(11);
    const r = runner();
    expect(r).toBe('foo');
  });
  it('scheduler', () => {
    let dummy;
    let run: any;
    const scheduler = vi.fn(() => {
      run = runner;
    });
    const obj = reactive({ foo: 1 });
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      { scheduler },
    );
    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);
    obj.foo++;
    expect(scheduler).toHaveBeenCalledTimes(1);
    expect(dummy).toBe(1);
    run();
    expect(dummy).toBe(2);
  });
  it('stop', () => {
    let dummy;
    const obj = reactive({ prop: 1 });
    let runner = effect(() => {
      dummy = obj.prop;
    });
    obj.prop = 2;
    expect(dummy).toBe(2);
    stop(runner);
    obj.prop++;
    expect(dummy).toBe(2);
    runner();
    expect(dummy).toBe(3);
  });
  it('onStop', () => {
    let dummy;
    const obj = reactive({ foo: 1 });
    let onStop = vi.fn();
    let runner = effect(
      () => {
        dummy = obj.foo;
      },
      { onStop },
    );
    stop(runner);
    expect(onStop).toBeCalledTimes(1);
  });
});
