import {
    h,
    ref,
} from '../../../dist/learn-mini-vue.esm.js'
export default {
    name: 'Child',
    render() {
        return h('div', {
            id: 'child',
        }, this.$props.msg);
    },
    setup() {

    }
}