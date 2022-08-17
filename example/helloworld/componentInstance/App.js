import {
    h,
    getCurrentInstance
} from '../../../lib/learn-mini-vue.esm.js'
import {
    Foo
} from './Foo.js';
export const App = {
    render() {
        return h('div', {}, [h('p', {}, 'instance app'), h(Foo)]);
    },
    setup() {
        const instance = getCurrentInstance()
        console.log('App', instance)
        return {
            name: '紫薯怪兽'
        }
    }
}