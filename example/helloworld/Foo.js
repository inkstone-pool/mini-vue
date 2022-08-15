import {
    h
} from '../../lib/learn-mini-vue.esm.js'
export const Foo = {
    render() {
        return h('div', {}, [h('button', {
            onClick: this.emitAdd
        }, 'emitAdd'), h('p', {}, 'foo')])
    },
    setup(props, {
        emit
    }) {
        console.log(props, emit)
        const emitAdd = () => {
            emit('add', 123, 456)
            emit('addFoo', 123, 456)
        }
        return {
            emitAdd,
        }
    }
}