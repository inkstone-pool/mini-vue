import {h}from '../../lib/learn-mini-vue.esm.js'
export const App={
    render(){
        return h('div','hi,'+this.name)
    },
    setup(){
        return {
            name:'紫薯怪兽'
        }
    }
}