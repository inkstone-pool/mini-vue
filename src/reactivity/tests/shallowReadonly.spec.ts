import { isReadOnly, shallowReadonly } from "../reactive";

describe('shallowReadonly', () => {
    test('should not make non-reactive properties reactive', () => {
        const obj =shallowReadonly({people:{age:18}})
        expect(isReadOnly(obj)).toBe(true)
        expect(isReadOnly(obj.people)).toBe(false)
    });
    it('shallowReadonly set', () => {
        const original ={age:18,detail:{money:180}}
        console.warn=jest.fn()
        let res =shallowReadonly(original)
        res.age=19
        expect(res.age).toBe(18)
        expect(console.warn).toBeCalledTimes(1)
    });
});