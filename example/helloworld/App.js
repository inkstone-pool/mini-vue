import {
    h
} from '../../lib/learn-mini-vue.esm.js'
import {
    Foo
} from './Foo.js';
export const App = {
    render() {
        return h(
            'div', {
                id: 'root',
                class: ['red'],
                onClick() {
                    console.log('click parent')
                },
                onMouseDown() {
                    console.log('onMouseDown')
                }
            },
            [h(Foo, {
                count: 1,
                onAdd(val) {
                    console.log('onAdd', val)
                },
                onAddFoo(val) {
                    console.log('onAddFoo', val)
                }
            }), h(
                'div', {
                    id: 'second',
                    class: ['red']
                },
                'hi,' + this.name
            )]
        );
    },
    setup() {
        return {
            name: '紫薯怪兽'
        }
    }
}