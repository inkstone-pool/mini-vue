import {
    createApp,
} from '../../../lib/learn-mini-vue.esm.js';
import {
    Provider as App
} from './App.js'
const rootContainer = document.querySelector('#app')
createApp(App).mount(rootContainer)