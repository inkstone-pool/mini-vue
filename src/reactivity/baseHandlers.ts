import { isObject,extend } from "../shared";
import {track ,trigger } from "./effect";
import { reactive, ReactiveFlags, readonly } from "./reactive";
let get=createGetter()
let set=createSetter()
let readonlyGet=createGetter(true)
let shallowReadonlyGet=createGetter(true,true)
function createGetter(isReadonly=false,shallow=false){
    return function get(target, key) {
        //todo收集依赖
        if(key===ReactiveFlags.IS_REACTIVE){
            return !isReadonly
        }else if(key===ReactiveFlags.IS_READONLY){
            return isReadonly
        }
        let res =Reflect.get(target, key)
        if(shallow){
            return res
        }
        if(isObject(res)){
            return isReadonly?readonly(res):reactive(res)
        }
        !isReadonly&&track(target,key)
        return res
    }
}
function createSetter(){
    return function set(target, key, value) {
        //todo触发依赖
        let res =Reflect.set(target, key, value)
        trigger(target,key)
        return res
    }
}
export const mutableHandlers={
        get,
        set,
}
export const readonlyHandlers={
    get:readonlyGet,
    set(target, key, value) {
        console.warn(`key${key}can't set on ${target}`)
        return true
    }
}
export const shallowReadonlyHandlers=extend({},readonlyHandlers,{get:shallowReadonlyGet})
