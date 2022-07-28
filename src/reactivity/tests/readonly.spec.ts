import { readonly } from "../reactive";

describe('readonly', () => {
    it('readonly get', () => {
        const original ={age:18,detail:{money:180}}
        let res =readonly(original)
        expect(res).not.toBe(original)
        expect(res.age).toBe(18)
    });
    it('readonly set', () => {
        const original ={age:18,detail:{money:180}}
        console.warn=jest.fn()
        let res =readonly(original)
        res.age=19
        expect(res.age).toBe(18)
        expect(console.warn).toBeCalledTimes(1)
    });
});