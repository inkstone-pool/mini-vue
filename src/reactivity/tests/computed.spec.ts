import { computed } from "../computed";
import { reactive } from "../reactive";

describe('computed', () => {
    it('happy path', () => {
        const user =reactive({
            age:1
        })
        const age=computed(()=>{
            return user.age
        })
        expect(age.value).toBe(1)
    });
    it('should compute lazily',()=>{
        const user =reactive({
            age:1
        })
        const getter=jest.fn(()=>{
            return user.age
        })
        const age=computed(getter)
        expect(getter).not.toHaveBeenCalled()
        expect(age.value).toBe(1)
        expect(getter).toHaveBeenCalledTimes(1)
        age.value
        expect(getter).toHaveBeenCalledTimes(1)
        user.age=6
        expect(getter).toHaveBeenCalledTimes(1)
        expect(age.value).toBe(6)
        expect(getter).toHaveBeenCalledTimes(2)
        age.value
        expect(getter).toHaveBeenCalledTimes(2)
    })
});