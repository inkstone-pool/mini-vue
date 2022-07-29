import { extend } from "../shared";

class ReactiveEffect{
    private _fn :any;
    deps=[];
    active=true;
    onStop?:()=>void
    public scheduler:Function|undefined
    constructor(fn){
        this._fn=fn
    }
    run(){
        activeEffect=this//初次执行前暴露实例用于收集,调换顺序响应式收集个寂寞
        return this._fn()
    }
    stop(){
        if(this.active){
            cleanupEffect(this)
            this.onStop&&this.onStop()
            this.active=false
        }
    }
}
function cleanupEffect(effect){
    effect.deps.forEach((dep:any)=>{
        dep.delete(effect)
    })
}
/* 
收集依赖
*/
const targeMap =new Map()
export function track(target,key){
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
    if(!activeEffect)return
    dep.add(activeEffect)//组织依赖结构用于触发
    activeEffect.deps.push(dep)
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
export function trigger(target,key): void{
    let dep=targeMap.get(target).get(key)
    
    for (const effect of dep) {
        if(effect.scheduler){
            effect.scheduler()
        }else{
            effect.run()
        }
    }
}
let activeEffect;
/* 
副作用方法包装
*/
export function effect(fn,options:any={}): any{
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