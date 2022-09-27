import typescript from "@rollup/plugin-typescript"
import pkg from './package.json'
export default {
    input: "./packages/vue/src/index.ts",
    output: [{
            format: 'cjs',
            file: 'packages/vue/dist/learn-mini-vue.cjs.js'
        },
        {
            format: 'es',
            file: 'packages/vue/dist/learn-mini-vue.esm.js'
        }
    ],
    plugins: [
        typescript()
    ]
}