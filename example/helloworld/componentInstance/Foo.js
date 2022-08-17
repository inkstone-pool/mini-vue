import {
    h,
    getCurrentInstance
} from '../../../lib/learn-mini-vue.esm.js'
export const Foo = {
    render() {
        return h('div', {}, [h('p', {}, 'foo')])
    },
    setup() {
        const instance = getCurrentInstance()
        console.log('Foo', instance)
        return {}
    }
}