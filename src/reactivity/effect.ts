import { extend } from "../shared";
let activeEffect;
let shouldTrack;
export class ReactiveEffect{
    private _fn :Function;
    deps=[];
    active:boolean=true;
    onStop?:()=>void
    public scheduler:Function|undefined
    constructor(fn:Function,scheduler?:Function){
        this._fn=fn
        this.scheduler=scheduler
    }
    run(){
        if(!this.active){
            return this._fn()
        }
        shouldTrack=true
        activeEffect=this//初次执行前暴露实例用于收集,调换顺序响应式收集个寂寞
        let result= this._fn()
        shouldTrack=false
        return result
    }
    stop(){
        if(this.active){//防止重复执行的开关而已，优化层面
            cleanupEffect(this)
            this.onStop&&this.onStop()
            this.active=false
        }
    }
}
function cleanupEffect(effect:ReactiveEffect){
    effect.deps.forEach((dep:any)=>{
        dep.delete(effect)
    })
    //上述虽然清除了但是会残留空set结构在数组里
    effect.deps.length=0
}
export function isTracking(){
    return  activeEffect&&shouldTrack!==false
}
/* 
收集依赖
*/
const targeMap =new Map()
export function track(target,key){
    if(!isTracking())return;//防止在effect执行外的依赖收集，性能和功能层面
    let depsMap=targeMap.get(target)
    if(!depsMap){
        depsMap=new Map()
        targeMap.set(target,depsMap)
    }
    let dep=depsMap.get(key)
    if(!dep){
        dep=new Set()
        depsMap.set(key,dep)
    }
    trackEffects(dep)
}
export function trackEffects(dep){
    if(dep.has(activeEffect))return//activeEffect一旦赋值就没有转为空
    dep.add(activeEffect)//组织依赖结构用于触发
    activeEffect.deps.push(dep)//双向收集是通过引用地址给activeEffect提供快速的清除便捷
}
/* 
eg:targeMap{
    {name:alice,age:18}:{
        name:[activeEffect1,activeEffect2]
        age:[activeEffect3,activeEffect4]
    },
    {name:Tom,age:6}:{
        name:[activeEffect1,activeEffect2]
        age:[activeEffect3,activeEffect4]
    }
    step1-----------------------------------------------------------------------
    activeEffect1{
        deps:[[activeEffect1,activeEffect2],[activeEffect1,activeEffect2]]
    }
    step2-----------------------------------------------------------------------
    activeEffect1{
        deps:[[activeEffect1,activeEffect2],[activeEffect1,activeEffect2]]
    }
    activeEffect2{
        deps:[[activeEffect1,activeEffect2],[activeEffect1,activeEffect2]]两个引用地址一致增加与删除会呈现乘法表变化
    }:ReactiveEffect
}

*/
/* 
触发依赖
 */
export function trigger(target:Object,key:string): void{
    let dep=targeMap.get(target).get(key)
    triggerEffects(dep)
 
}
export function triggerEffects(dep){
    for (const effect of dep) {
        if(effect.scheduler){
            effect.scheduler()
        }else{
            effect.run()
        }
    }
}
/* 
副作用方法包装
*/
export function effect(fn,options:{onStop?:()=>any,scheduler?:()=>any}={}): Function{
    //fn
    const _effect=new ReactiveEffect(fn)
    extend(_effect,options)
    _effect.run()
    let runner:any=_effect.run.bind(_effect)
    runner.effect=_effect
    return runner
}
/* 
清除依赖自己的依赖
*/
export function stop(runner){
    runner.effect.stop()
}