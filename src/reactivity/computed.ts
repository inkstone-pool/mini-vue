import { ReactiveEffect } from "./effect";

/* 
_getter:计算函数
_computedValue:计算缓存值
_shouldExecute:是否需要执行
_effect:副作用函数
*/
type Getter=(...args: any) => any
class ComputedRefImpl<Getter extends (...args: any) => any>{
    private _getter: Getter
    private _computedValue: ReturnType<Getter> | undefined;
    private _shouldExecute: boolean = true;
    private _effect: ReactiveEffect;
    constructor(getter:Getter){
        this._getter=getter
        this._effect=new ReactiveEffect(getter as Function ,()=>{
            this._shouldExecute=true
        })
    }
    get value() : ReturnType<Getter> | undefined {
        if(this._shouldExecute){
            this._shouldExecute=false
            this._computedValue=this._effect.run()
        }
        return this._computedValue
    } 
}
export function computed(getter:Getter){
    return new ComputedRefImpl<Getter>(getter)
}