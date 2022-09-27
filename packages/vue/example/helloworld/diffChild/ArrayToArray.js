import {
    createTextVNode,
    h,
    ref
} from '../../../dist/learn-mini-vue.esm.js'
/* 
左边对比 abc->abde
*/
const prevChildren = [h('div', {
    key: 'A'
}, 'A'), h('div', {
    key: 'B',
}, 'B'), h('div', {
    key: 'C'
}, 'C'), ]
const nextChildren = [h('div', {
    key: 'A'
}, 'A'), h('div', {
    key: 'B',
}, 'B'), h('div', {
    key: 'D'
}, 'D'), h('div', {
    key: 'E'
}, 'E'), ]


/* 
右边对比 abc->debc
*/
const prevChildren1 = [h('div', {
    key: 'A'
}, 'A'), h('div', {
    key: 'B',
}, 'B'), h('div', {
    key: 'C'
}, 'C'), ]
const nextChildren1 = [h('div', {
    key: 'D'
}, 'D'), h('div', {
    key: 'E',
}, 'E'), h('div', {
    key: 'B'
}, 'B'), h('div', {
    key: 'C'
}, 'C'), ]


/* 
左边对比新增 ab->abc
*/
const prevChildren2 = [h('div', {
    key: 'A'
}, 'A'), h('div', {
    key: 'B',
}, 'B'), ]
const nextChildren2 = [h('div', {
    key: 'A'
}, 'A'), h('div', {
    key: 'B',
}, 'B'), h('div', {
    key: 'C'
}, 'C'), h('div', {
    key: 'D'
}, 'D'), ]

/* 
右边对比新增 ab->cab
*/
const prevChildren3 = [h('div', {
    key: 'A'
}, 'A'), h('div', {
    key: 'B',
}, 'B')]
const nextChildren3 = [h('div', {
    key: 'D'
}, 'D'), h('div', {
    key: 'C'
}, 'C'), h('div', {
    key: 'A'
}, 'A'), h('div', {
    key: 'B',
}, 'B'), ]
/* 
左边对比新增 abc->ab
*/
const prevChildren4 = [h('div', {
    key: 'A'
}, 'A'), h('div', {
    key: 'B',
}, 'B'), h('div', {
    key: 'C'
}, 'C')]
const nextChildren4 = [h('div', {
    key: 'A'
}, 'A'), h('div', {
    key: 'B',
}, 'B'), ]
/* 
左边对比新增 abc->bc
*/
const prevChildren5 = [h('div', {
    key: 'A'
}, 'A'), h('div', {
    key: 'B',
}, 'B'), h('div', {
    key: 'C'
}, 'C')]
const nextChildren5 = [h('div', {
    key: 'B',
}, 'B'), h('div', {
    key: 'C'
}, 'C')]


/* 
diff fixed
abcdezfg->abdcyefg

*/
const prevChildren6 = [h('div', {
    key: 'A'
}, 'A'), h('div', {
    key: 'B',
}, 'B'), h('div', {
    key: 'C',
    id: 'c-prev'
}, 'C'), h('div', {
    key: 'D'
}, 'D'), h('div', {
    key: 'E'
}, 'E'), h('div', {
    key: 'Z'
}, 'Z'), h('div', {
    key: 'F',
}, 'F'), h('div', {
    key: 'G'
}, 'G')]
const nextChildren6 = [h('div', {
    key: 'A'
}, 'A'), h('div', {
    key: 'B',
}, 'B'), h('div', {
    key: 'D'
}, 'D'), h('div', {
    key: 'C',
    id: 'c-next'
}, 'C'), h('div', {
    key: 'Y',
    id: 'Y-next'
}, 'Y'), h('div', {
    key: 'E',
}, 'E'), h('div', {
    key: 'F',
}, 'F'), h('div', {
    key: 'G'
}, 'G')]
export default {
    name: 'ArrayToArray',
    setup() {
        const isChange = ref(false)
        window.isChange4 = isChange
        return {
            isChange
        }
    },
    render() {
        const self = this
        // let leftDiff = self.isChange === true ? h('div', {}, nextChildren) : h('div', {}, prevChildren)
        // let rightDiff = self.isChange === true ? h('div', {}, nextChildren1) : h('div', {}, prevChildren1)
        let newLeftDiff = self.isChange === true ? h('div', {}, nextChildren2) : h('div', {}, prevChildren2)
        let oldLeftDiff = self.isChange === true ? h('div', {}, nextChildren3) : h('div', {}, prevChildren3)
        let delLeftDiff = self.isChange === true ? h('div', {}, nextChildren4) : h('div', {}, prevChildren4)
        let delRightDiff = self.isChange === true ? h('div', {}, nextChildren5) : h('div', {}, prevChildren5)
        let delCenterDiff = self.isChange === true ? h('div', {}, nextChildren6) : h('div', {}, prevChildren6)
        return h('div', {}, [
            // createTextVNode('leftDiff'), leftDiff,
            // createTextVNode('rightDiff'), rightDiff,
            createTextVNode('newLeftDiff'), newLeftDiff,
            createTextVNode('oldLeftDiff'), oldLeftDiff,
            createTextVNode('delLeftDiff'), delLeftDiff,
            createTextVNode('delRightDiff'), delRightDiff,
            createTextVNode('delCenterDiff'), delCenterDiff
        ])

    }
}