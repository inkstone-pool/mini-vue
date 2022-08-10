import { ReactiveEffect } from "./effect";

/* 
_getter:计算函数
_computedValue:计算缓存值
_shouldExecute:是否需要执行
_effect:副作用函数
*/
class ComputedRefImpl{
    private _getter: any
    private _computedValue: any;
    private _shouldExecute: boolean = true;
    private _effect: any;
    constructor(getter){
        this._getter=getter
        this._effect=new ReactiveEffect(getter,()=>{
            this._shouldExecute=true
        })
    }
    get value() : string {
        if(this._shouldExecute){
            this._shouldExecute=false
            this._computedValue=this._effect.run()
        }
        return this._computedValue
    } 
}
export function computed(getter){
    return new ComputedRefImpl(getter)
}