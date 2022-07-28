import {track ,trigger } from "./effect";
let get=createGetter()
let set=createSetter()
let readonlyGet=createGetter(true)
function createGetter(isReadOnly=false){
    return function get(target, key) {
        //todo收集依赖
        let res =Reflect.get(target, key)
        !isReadOnly&&track(target,key)
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
