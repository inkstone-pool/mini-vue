import {
    h,
    ref
} from '../../../lib/learn-mini-vue.esm.js'
const nextChildren = [h('div', {}, 'C'), h('div', {}, 'D')]
const prevChildren = 'prevChildren'
export default {
    name: 'ArrayToArray',
    setup() {
        const isChange = ref(false)
        window.isChange3 = isChange
        return {
            isChange
        }
    },
    render() {
        const self = this
        return self.isChange === true ? h('div', {}, nextChildren) : h('div', {}, prevChildren)
    }
}