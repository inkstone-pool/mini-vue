import { readonly, isReadOnly, isProxy } from '../src/reactive';
import { vi, describe, it, expect,test } from 'vitest';
describe('readonly', () => {
  it('readonly get', () => {
    const original = { age: 18, detail: { money: 180 } };
    let res = readonly(original);
    expect(res).not.toBe(original);
    expect(res.age).toBe(18);
    expect(isReadOnly(res)).toBe(true);
    expect(isReadOnly(original)).toBe(false);
    expect(isReadOnly(res.detail)).toBe(true);
    expect(isProxy(res.detail)).toBe(true);
    expect(isReadOnly(original.detail)).toBe(false);
  });
  it('readonly set', () => {
    const original = { age: 18, detail: { money: 180 } };
    console.warn = vi.fn();
    let res = readonly(original);
    res.age = 19;
    expect(res.age).toBe(18);
    expect(console.warn).toBeCalledTimes(1);
  });
});
