import {h}from '../../lib/learn-mini-vue.esm.js'
export const App={
    render(){
        return h(
            'div',
            {
                id:'root',
                class:['red']
            },
            [h(
                'div',
                {
                    id:'first',
                    class:['red']
                },
                'hi,'+this.name
            ),h(
                'div',
                {
                    id:'second',
                    class:['red']
                },
                'hi,'+this.name
            )]
        );
    },
    setup(){
        return {
            name:'紫薯怪兽'
        }
    }
}