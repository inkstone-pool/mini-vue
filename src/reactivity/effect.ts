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
        activeEffect=this
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
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
}
export function trigger(target,key){
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
export function effect(fn,options:any={}){
    //fn
    const _effect=new ReactiveEffect(fn)
    extend(_effect,options)
    _effect.run()
    let runner:any=_effect.run.bind(_effect)
    runner.effect=_effect
    return runner
}
export function stop(runner){
    runner.effect.stop()
}