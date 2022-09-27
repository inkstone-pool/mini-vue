import {
    h,
    ref
} from '../../../dist/learn-mini-vue.esm.js'
const nextChildren = 'nextChildren'
const prevChildren = [h('div', {}, 'A'), h('div', {}, 'B')]
export default {
    name: 'ArrayToText',
    setup() {
        const isChange = ref(false)
        window.isChange1 = isChange
        return {
            isChange
        }
    },
    render() {
        const self = this
        return self.isChange === true ? h('div', {}, nextChildren) : h('div', {}, prevChildren)
    }
}