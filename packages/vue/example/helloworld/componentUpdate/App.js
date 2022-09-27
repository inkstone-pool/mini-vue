import {
    h,
    ref,
} from '../../../dist/learn-mini-vue.esm.js'
import Child from './Child.js'
export const App = {
    render() {
        return h('div', {
            id: 'root',
        }, [h('div', {}, 'hello'), h('button', {
            onClick: this.changeChildProps
        }, 'changechildprops'), h(Child, {
            msg: this.msg
        }), h('button', {
            onClick: this.changeCount
        }, 'changeCount'), h('p', {}, 'count' + this.count)]);
    },
    setup() {
        let msg = ref('123')
        const count = ref(1)
        window.msg = msg
        const changeChildProps = () => {
            msg.value = '456'
        }
        const changeCount = () => {
            count.value++
        }

        return {
            msg,
            count,
            changeChildProps,
            changeCount
        }
    }
}