import {
    h,
    renderSlots
} from '../../../lib/learn-mini-vue.esm.js'
export const Foo = {
    render() {
        return h('div', {}, [renderSlots(this.$slots, 'header', {
            slotProps: 123
        }), h('p', {}, 'foo'), renderSlots(this.$slots, 'footer', {
            slotProps: 456
        })])
    },
    setup(props) {
        return {}
    }
}