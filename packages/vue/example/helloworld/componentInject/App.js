import {
    h,
    provider,
    inject
} from '../../../dist/learn-mini-vue.esm.js'
export const Provider = {
    name: 'Provider',
    setup() {
        provider('foo', 'fooval')
        provider('bar', 'barval')
    },
    render() {
        return h('div', {}, [h('p', {}, 'Provider'), h(Consumer)]);
    },
}
const Consumer = {
    name: 'Provider',
    setup() {
        const foo = inject('foo')
        const bar = inject('bar', '123')
        const baz = inject('baz', () => {
            return '456'
        })
        return {
            foo,
            bar,
            baz
        }
    },
    render() {
        return h('div', {}, [h('p', {}, 'Consumer' + this.foo + this.bar + this.baz)]);
    },
}