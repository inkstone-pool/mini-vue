import {
    h,
    ref,
    createTextVNode
} from '../../../dist/learn-mini-vue.esm.js'
import ArrayToArray from './ArrayToArray.js';
import ArrayToText from './ArrayToText.js';
import TextToArray from './TextToArray.js';
import TextToText from './TextToText.js';
export const App = {
    render() {
        return h('div', {
            id: 'root',
            ...this.props
        }, [h('div', {}, 'count:' + this.count), h('button', {
                onClick: this.onClick
            }, 'click'), h('button', {
                onClick: this.onPropChange
            }, 'onPropChange'), h('button', {
                onClick: this.onPropToundifind
            }, 'onPropToundifind'), h('button', {
                onClick: this.onPropDelete
            }, 'onPropDelete'),
            h('div', {
                style: 'background:pink'
            }, 'ArrayToText'),
            h(ArrayToText),
            h('div', {
                style: 'background:pink'
            }, 'TextToText'),
            h(TextToText),
            h('div', {
                style: 'background:pink'
            }, 'TextToArray'),
            h(TextToArray),
            h('div', {
                style: 'background:pink'
            }, 'ArrayToArray'),
            h(ArrayToArray),
        ]);
    },
    setup() {
        let count = ref(0)
        let props = ref({
            foo: 'foo',
            bar: 'bar'
        })
        let b = props
        const onClick = () => {
            count.value++
        }
        const onPropChange = () => {
            props.value.foo = 'new-foo'
        }
        const onPropToundifind = () => {
            props.value.foo = undefined
        }
        const onPropDelete = () => {
            props.value = {
                foo: 'foo',
            }
        }
        return {
            count,
            props,
            onClick,
            onPropChange,
            onPropToundifind,
            onPropDelete
        }
    }
}