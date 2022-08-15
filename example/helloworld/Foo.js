import {
    h
} from '../../lib/learn-mini-vue.esm.js'
export const Foo = {
    render() {
        return h('div', {}, 'foo' + this.count)
    },
    setup(props) {
        console.log(props)
        return {
            name: '紫薯怪兽'
        }
    }
}