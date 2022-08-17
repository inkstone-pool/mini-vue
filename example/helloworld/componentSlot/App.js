import {
    h,
    createTextVNode
} from '../../../lib/learn-mini-vue.esm.js'
import {
    Foo
} from './Foo.js';
export const App = {
    render() {
        return h('div', {}, [h('div', {}, 'app'), h(Foo, {}, {
            'header': (slotsProps) => [h('p', {}, 'slot-defult' + slotsProps.slotProps), createTextVNode('just a text')],
            'footer': () => h('p', {}, 'slot-defult1')
        })]);
    },
    setup() {
        
        return {
            name: '紫薯怪兽'
        }
    }
}