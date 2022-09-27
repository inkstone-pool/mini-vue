import {
    h,
    ref
} from '../../../dist/learn-mini-vue.esm.js'
const nextChildren = 'nextChildren'
const prevChildren = 'prevChildren'
export default {
    name: 'ArrayToArray',
    setup() {
        const isChange = ref(false)
        window.isChange2 = isChange
        return {
            isChange
        }
    },
    render() {
        const self = this
        return self.isChange === true ? h('div', {}, nextChildren) : h('div', {}, prevChildren)
    }
}