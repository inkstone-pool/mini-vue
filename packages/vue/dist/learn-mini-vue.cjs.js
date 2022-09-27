'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    let vnode = {
        type,
        props,
        children,
        component: null,
        key: props && props.key,
        shapeFlag: getShapeFlag(type),
        el: null,
    };
    if (typeof children === 'string') {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (typeof children === 'object') {
            vnode.shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
    if (typeof type === 'string') {
        return 1 /* ShapeFlags.ELEMENT */;
    }
    else {
        return 2 /* ShapeFlags.STATEFUL_COMPONENT */;
    }
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function toDisplayString(value) {
    return String(value);
}

function openBlock() {
    return '';
}

const extend = Object.assign;
const isObject = (value) => {
    return value !== null && typeof value == 'object';
};
const isString = (value) => {
    return typeof value == 'string';
};
const isFunction = (value) => {
    return typeof value === 'function';
};
const hasChanged = (newValue, oldValue) => {
    return !Object.is(newValue, oldValue);
};
const hasOwn = (obj, key) => {
    return Object.prototype.hasOwnProperty.call(obj, key);
};
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c && c.toUpperCase();
    });
};
const increasingNewIndexSequence = (arr) => {
    const copyArr = [...arr];
    const result = [0];
    let i, j, u, v, c;
    const length = arr.length;
    for (i = 0; i < length; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                copyArr[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    copyArr[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = copyArr[v];
    }
    return result;
};

function renderSlots(slots, defaultSoltName = 'default', slotsProps = {}) {
    const slot = slots[defaultSoltName];
    if (slot) {
        if (isFunction(slot)) {
            return createVNode(Fragment, {}, slot(slotsProps));
        }
    }
}

let activeEffect;
let shouldTrack;
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.deps = [];
        this.active = true;
        this._fn = fn;
        this.scheduler = scheduler;
    }
    run() {
        if (!this.active) {
            return this._fn();
        }
        shouldTrack = true;
        activeEffect = this; //初次执行前暴露实例用于收集,调换顺序响应式收集个寂寞
        let result = this._fn();
        shouldTrack = false;
        return result;
    }
    stop() {
        if (this.active) { //防止重复执行的开关而已，优化层面
            cleanupEffect(this);
            this.onStop && this.onStop();
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    //上述虽然清除了但是会残留空set结构在数组里
    effect.deps.length = 0;
}
function isTracking() {
    return activeEffect && shouldTrack !== false;
}
/*
收集依赖
*/
const targeMap = new Map();
function track(target, key) {
    if (!isTracking())
        return; //防止在effect执行外的依赖收集，性能和功能层面
    let depsMap = targeMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targeMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffects(dep);
}
function trackEffects(dep) {
    if (dep.has(activeEffect))
        return; //activeEffect一旦赋值就没有转为空
    dep.add(activeEffect); //组织依赖结构用于触发
    activeEffect.deps.push(dep); //双向收集是通过引用地址给activeEffect提供快速的清除便捷
}
/*
eg:targeMap{
    {name:alice,age:18}:{
        name:[activeEffect1,activeEffect2]
        age:[activeEffect3,activeEffect4]
    },
    {name:Tom,age:6}:{
        name:[activeEffect1,activeEffect2]
        age:[activeEffect3,activeEffect4]
    }
    step1-----------------------------------------------------------------------
    activeEffect1{
        deps:[[activeEffect1,activeEffect2],[activeEffect1,activeEffect2]]
    }
    step2-----------------------------------------------------------------------
    activeEffect1{
        deps:[[activeEffect1,activeEffect2],[activeEffect1,activeEffect2]]
    }
    activeEffect2{
        deps:[[activeEffect1,activeEffect2],[activeEffect1,activeEffect2]]两个引用地址一致增加与删除会呈现乘法表变化
    }:ReactiveEffect
}

*/
/*
触发依赖
 */
function trigger(target, key) {
    let dep = targeMap.get(target).get(key);
    triggerEffects(dep);
}
function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
/*
副作用方法包装
*/
function effect(fn, options = {}) {
    //fn
    const _effect = new ReactiveEffect(fn);
    extend(_effect, options);
    _effect.run();
    let runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}
/*
清除依赖自己的依赖
*/
function stop(runner) {
    runner.effect.stop();
}

let get = createGetter();
let set = createSetter();
let readonlyGet = createGetter(true);
let shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        //todo收集依赖
        if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        let res = Reflect.get(target, key);
        if (shallow) {
            return res;
        }
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        !isReadonly && track(target, key);
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        //todo触发依赖
        let res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`key${key}can't set on ${target}`);
        return true;
    }
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, { get: shallowReadonlyGet });

function reactive(raw) {
    return createActiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createActiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createActiveObject(raw, shallowReadonlyHandlers);
}
function isReactive(value) {
    return !!value["__v_isReactive" /* ReactiveFlags.IS_REACTIVE */];
}
function isReadOnly(value) {
    return !!value["__v_isReadonly" /* ReactiveFlags.IS_READONLY */];
}
function isProxy(value) {
    return isReactive(value) || isReadOnly(value);
}
function createActiveObject(raw, baseHandlers) {
    return new Proxy(raw, baseHandlers);
}

class RefImpl {
    constructor(value) {
        this.dep = new Set();
        this._rawValue = value;
        this._value = convert(value);
    }
    set value(v) {
        if (!hasChanged(v, this._rawValue))
            return;
        this._rawValue = v;
        this._value = convert(v);
        triggerEffects(this.dep);
    }
    get value() {
        isTracking() && trackEffects(this.dep);
        return this._value;
    }
}
function convert(v) {
    return isObject(v) ? reactive(v) : v;
}
function ref(value) {
    return new RefImpl(value);
}
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, p) {
            return unRef(Reflect.get(target, p));
        },
        set(target, p, value) {
            if (isRef(Reflect.get(target, p)) && !isRef(value)) {
                return (target[p].value = value);
            }
            else {
                return Reflect.set(target, p, value);
            }
        },
    });
}
function isRef(ref) {
    return ref instanceof RefImpl;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}

function emit(instance, eventName, ...args) {
    const { props } = instance;
    const toHandlerkey = (str) => {
        return str && 'on' + capitalize(str);
    };
    const handler = props[toHandlerkey(camelize(eventName))];
    handler && handler(...args);
}

function initProps(instance, props) {
    instance.props = props || {};
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
    $props: (i) => i.props,
};
const PublicInstanceProxyHandlers = {
    get({ _instance }, key) {
        const { setupState, props } = _instance;
        if (key in setupState) {
            return setupState[key];
        }
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        return publicPropertiesMap[key] && publicPropertiesMap[key](_instance);
    },
};

function initSlots(instance, children) {
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlots(instance.slots, children);
    }
}
function normalizeObjectSlots(slots, children) {
    for (const key in children) {
        if (Object.prototype.hasOwnProperty.call(children, key)) {
            slots[key] = (props) => normalizeSlotValue(children[key](props));
        }
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        next: null,
        setupState: {},
        props: {},
        slots: {},
        provides: (parent === null || parent === void 0 ? void 0 : parent.provides) || {},
        parent,
        emit: () => { },
        isMounted: false,
        subTree: {},
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    instance.proxy = new Proxy({ _instance: instance }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        //暴露组件实例对象
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult == 'object') {
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (compiler && !Component.render) {
        if (Component.template) {
            Component.render = compiler(Component.template);
        }
    }
    instance.render = Component.render;
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}
let compiler;
function registerRuntimeCompiler(_compiler) {
    compiler = _compiler;
}

function provider(key, val) {
    var _a;
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = (_a = currentInstance.parent) === null || _a === void 0 ? void 0 : _a.provides;
        //将父提供的实例放在原型上防止当前组件实例修改后影响到父组件的提供
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = val;
    }
}
function inject(key, defaultValue) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const { parent } = currentInstance;
        return (parent.provides[key] ||
            (isFunction(defaultValue) ? defaultValue() : defaultValue));
    }
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            },
        };
    };
}

const queue = [];
let isFlushPending = false;
const p = Promise.resolve();
//单独调用时再快也是改变值后才调用的nextTick，这时微任务第一个并不是传入的fn，而是更新的nextTick(flushJobs)中的flushJobs函数为第一个执行的微任务
function nextTick(fn) {
    return fn ? p.then(fn) : p;
}
function queueJobs(job) {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush();
    function queueFlush() {
        if (isFlushPending)
            return;
        isFlushPending = true;
        nextTick(flushJobs);
    }
}
function flushJobs() {
    isFlushPending = false;
    let job;
    while ((job = queue.shift())) {
        job && job();
    }
}

//作为底层向上层提供的个性化渲染器函数
function createRenderer(renderFlowOptions) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = renderFlowOptions;
    function render(vnode, container) {
        patch(null, vnode, container, null, null);
    }
    function patch(n1, n2, container, parentComponent, archer) {
        let { type, shapeFlag } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, archer);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent, archer);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent, archer);
                }
                break;
        }
    }
    function processText(n1, n2, container) {
        if (n1 && n1.children !== n2.children) {
            //更新
            n1.el.textContent = n2.children;
        }
        else if (!n1) {
            //初始化
            const { children } = n2;
            const textNode = (n2.el = document.createTextNode(children));
            container.append(textNode);
        }
    }
    /*
    处理render的虚拟dom 返回的type属性为Fragment,只渲染children
    */
    function processFragment(n1, n2, container, parentComponent, archer) {
        mountChildren(n2.children, container, parentComponent, archer);
    }
    /*
    处理render的虚拟dom 返回的type属性为浏览器原生元素(叫组件也不过分吧),进行初始化挂载与更新处理
    */
    function processElement(n1, n2, container, parentComponent, archer) {
        if (!n1) {
            mountElement(n2, container, parentComponent, archer);
        }
        else {
            patchElement(n1, n2, parentComponent, archer);
        }
    }
    function patchElement(n1, n2, parentComponent, archer) {
        const oldProps = n1.props || {};
        const newProps = n2.props || {};
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentComponent, archer);
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent, archer) {
        const { shapeFlag: prevShapeFlag } = n1;
        const { shapeFlag: nextShapeFlag } = n2;
        if (nextShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            if (prevShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                //ArrayToText
                unmountChildren(n1.children);
            }
            if (n2.children !== n1.children) {
                //TextToText
                hostSetElementText(container, n2.children);
            }
        }
        else {
            if (prevShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                //TextToArray
                hostSetElementText(container, '');
                mountChildren(n2.children, container, parentComponent, archer);
            }
            else {
                //ArrayToArray
                patchKeyedChildren(n1.children, n2.children, container, parentComponent, archer);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, parentArcher) {
        let i = 0;
        const l1 = c1.length;
        const l2 = c2.length;
        let e1 = l1 - 1;
        let e2 = l2 - 1;
        function isSameVnodeType(n1, n2) {
            return n1.type === n2.type && n1.key === n2.key;
        }
        //左侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSameVnodeType(n1, n2)) {
                //外层相同判断里层
                patch(n1, n2, container, parentComponent, parentArcher);
            }
            else {
                break;
            }
            i++;
        }
        // 右侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSameVnodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentArcher);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        //new>old
        if (i > e1) {
            if (i <= e2) {
                const nextPos = e2 + 1;
                const archer = nextPos < l2 ? c2[nextPos].el : null;
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, archer);
                    i++;
                }
            }
        }
        else if (i > e2) {
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            const s1 = i; //便于循环识别
            const s2 = i;
            const toBePatched = e2 - s2 + 1;
            let hasPatched = 0;
            const keyToNewIndexMap = new Map(); //新节点存旧节点取识别是否未来已经存在，格式{'key1':0,'key2':1}
            const newIndexToOldIndexMap = Array(toBePatched).fill(0);
            let moved = false;
            let maxNewIndexSofar = 0;
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                nextChild.key && keyToNewIndexMap.set(nextChild.key, i);
            }
            let newIndex;
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                if (hasPatched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                if (prevChild.key) {
                    //写key便于查找
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    for (let j = s2; j <= e2; j++) {
                        if (isSameVnodeType(prevChild, e2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (!newIndex) {
                    //新的找不到相同的
                    hostRemove(prevChild.el);
                }
                else {
                    if (newIndex > maxNewIndexSofar) {
                        maxNewIndexSofar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    newIndexToOldIndexMap[newIndex - s2] = i + 1; //旨在准备好新旧key值匹配的新旧索引映射，例如
                    /*
                    old:[a,b,c,d,e,z,f,g]
                    new:[a,b,d,c,y,e,f,g]
                    newIndexToOldIndexMap: [0: 4
                                            1: 3
                                            2: 0
                                            3: 5]
                    
                    */
                    //找到了递归对比更新
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    hasPatched++;
                }
            }
            const increasingSequence = moved
                ? increasingNewIndexSequence(newIndexToOldIndexMap)
                : [];
            /*
           increasingSequence: [0: 1
                                1: 3]
           */
            let j = increasingSequence.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                else {
                    if (moved) {
                        if (j < 0 || i !== increasingSequence[j]) {
                            //move
                            hostInsert(nextChild.el, container, anchor);
                        }
                        else {
                            j--;
                        }
                    }
                }
            }
        }
    }
    function unmountChildren(children) {
        children.forEach((child) => {
            hostRemove(child.el);
        });
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                if (prevProp !== newProps) {
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }
        }
        if (JSON.stringify(oldProps) !== '{}') {
            for (const key in oldProps) {
                if (!(key in newProps)) {
                    hostPatchProp(el, key, oldProps[key], null);
                }
            }
        }
    }
    function mountElement(vnode, container, parentComponent, anchor) {
        const el = (vnode.el = hostCreateElement(vnode.type));
        const { props, children, shapeFlag } = vnode;
        for (const key in props) {
            hostPatchProp(el, key, null, props[key]);
        }
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            //数组
            mountChildren(children, el, parentComponent, anchor);
        }
        hostInsert(el, container, anchor);
    }
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach((v) => {
            patch(null, v, container, parentComponent, anchor);
        });
    }
    /*
    处理render的虚拟dom 返回的type属性为使用者定义的组件对象，进行初始挂载响应式对象与render函数
    */
    function processComponent(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountComponent(n2, container, parentComponent, anchor);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    function mountComponent(initinalVnode, container, parentComponent, anchor) {
        const instance = (initinalVnode.component = createComponentInstance(initinalVnode, parentComponent));
        setupComponent(instance);
        setupRenderEffect(instance, initinalVnode, container, anchor);
    }
    function updateComponent(n1, n2) {
        const instance = (n2.component = n1.component);
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2;
            instance.update();
        }
        else {
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    function setupRenderEffect(instance, initinalVnode, container, anchor) {
        instance.update = effect(() => {
            if (!instance.isMounted) {
                //初始化
                const { proxy } = instance;
                //初始化记录总虚拟节点对象
                const subTree = (instance.subTree = instance.render.call(proxy, proxy));
                patch(null, subTree, container, instance, anchor);
                //初始化挂载结束时
                initinalVnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                //更新
                const { proxy, next, vnode } = instance;
                if (next) {
                    next.el = vnode.el;
                }
                updateComponentPreRender(instance, next);
                const subTree = instance.render.call(proxy, proxy);
                const preSubTree = instance.subTree;
                instance.subTree = subTree;
                patch(preSubTree, subTree, container, instance, anchor);
            }
        }, {
            scheduler() {
                queueJobs(instance.update);
            },
        });
    }
    //保持调用链依赖注入的个性化render函数
    return {
        createApp: createAppAPI(render),
    };
}
function updateComponentPreRender(instance, nextVnode) {
    instance.vnode = nextVnode;
    instance.next = null;
    instance.props = nextVnode.props;
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevVal, nextVal) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const eventName = key.slice(2).toLowerCase();
        el.addEventListener(eventName, nextVal);
    }
    else {
        if (nextVal === undefined || nextVal == null) {
            el.removeAttribute(key, nextVal);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(child, parent, anchor) {
    parent.insertBefore(child, anchor || null);
}
function remove(child) {
    child.parentNode && child.parentNode.removeChild(child);
}
function setElementText(container, text) {
    container.textContent = text;
}
//定义默认渲染器
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText,
});
//引入runtime-dom 提供默认dom渲染器写法，纯函数的链式调用就是麻烦需要类似闭包保持依赖
function createApp(...args) {
    return renderer.createApp(...args);
}

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createApp: createApp,
    h: h,
    renderSlots: renderSlots,
    createTextVNode: createTextVNode,
    createElementBlock: createVNode,
    getCurrentInstance: getCurrentInstance,
    registerRuntimeCompiler: registerRuntimeCompiler,
    provider: provider,
    inject: inject,
    createRenderer: createRenderer,
    nextTick: nextTick,
    toDisplayString: toDisplayString,
    openBlock: openBlock,
    ref: ref,
    proxyRefs: proxyRefs,
    unRef: unRef,
    isRef: isRef,
    reactive: reactive,
    readonly: readonly,
    shallowReadonly: shallowReadonly,
    isReactive: isReactive,
    isReadOnly: isReadOnly,
    isProxy: isProxy,
    effect: effect,
    stop: stop
});

const TO_DISPLAY_STRING = Symbol('toDisplayString');
const OPEN_BLOCK = Symbol('openBlock');
const CREATE_ELEMENT_BLOCK = Symbol('createElementBlock');
const CTX = Symbol('ctx');
const CACHE = Symbol('cache');
const RENDER = Symbol('render');
const VUE = Symbol('vue');
const helperMapName = {
    [TO_DISPLAY_STRING]: 'toDisplayString',
    [OPEN_BLOCK]: 'openBlock',
    [CREATE_ELEMENT_BLOCK]: 'createElementBlock',
    [CTX]: 'ctx',
    [CACHE]: 'cache',
    [RENDER]: 'render',
    [VUE]: 'Vue',
};

function generate(ast) {
    const context = createCodegenContext();
    const { push, helper } = context;
    genFunctionPreamble(ast, context);
    push('return ');
    const functionName = helperMapName[RENDER];
    const args = [helper(CTX), helper(CACHE)];
    const signature = args.join(',');
    push(`function ${functionName}(${signature}){`);
    push('return ');
    genNode(ast.codegenNode, context);
    push('}');
    return {
        code: context.code,
    };
}
function genFunctionPreamble(ast, context) {
    const { push } = context;
    const Vuebing = helperMapName[VUE];
    const alisaHelper = (s) => `${helperMapName[s]}:_${helperMapName[s]}`;
    if (ast.helpers.length > 0) {
        push(`const { ${ast.helpers.map(alisaHelper).join(', ')} } = ${Vuebing}`);
    }
    push('\n');
}
function genNode(node, context) {
    switch (node.type) {
        case 0 /* NodeTypes.INTERPOLATION */:
            genInterplation(node, context);
            break;
        case 3 /* NodeTypes.TEXT */:
            genText(node, context);
            break;
        case 1 /* NodeTypes.SIMPLE_EXPRESSION */:
            genExpression(node, context);
            break;
        case 2 /* NodeTypes.ELEMENT */:
            genElement(node, context);
            break;
        case 5 /* NodeTypes.COMPOUND_EXPRESSION */:
            genCompoundExpression(node, context);
            break;
    }
}
function genInterplation(node, context) {
    const { push, helper } = context;
    push(helper(TO_DISPLAY_STRING));
    push(`(`);
    genNode(node.content, context);
    push(`)`);
}
function genText(node, context) {
    const { push } = context;
    push(`'${node.content}'`);
}
function genExpression(node, context) {
    const { push } = context;
    push(node.content);
}
function genElement(node, context) {
    const { push, helper } = context;
    const { children, tag, props } = node;
    push(`(`);
    push(helper(OPEN_BLOCK));
    push('(),');
    push(helper(CREATE_ELEMENT_BLOCK));
    push(`(`);
    genNodeList(genNullable([tag, props, children]), context);
    push(`)`);
    push(`)`);
}
function genNullable(list) {
    return list.map((arg) => arg || 'null');
}
function genNodeList(nodes, context) {
    const { push } = context;
    nodes.forEach((child, index) => {
        if (isString(child)) {
            push(child);
        }
        else {
            genNode(child, context);
        }
        if (index < nodes.length - 1) {
            push(',');
        }
    });
}
function createCodegenContext() {
    let context = {
        code: '',
        push(source) {
            context.code += source;
        },
        helper(key) {
            return `_${helperMapName[key]}`;
        },
    };
    return context;
}
function genCompoundExpression(node, context) {
    const { children } = node;
    const { push } = context;
    children.forEach((child) => {
        if (isString(child)) {
            push(child);
        }
        else {
            genNode(child, context);
        }
    });
}

const openDelimiter = '{{';
const closeDelimiter = '}}';
//process and advanceBy
function baseParse(content) {
    const context = creatrParseContext(content);
    return createRoot(parseChildren(context, []));
}
function parseChildren(context, ancestors) {
    const nodes = [];
    while (!isEnd(context, ancestors)) {
        let node;
        let s = context.source;
        if (s.startsWith('{{')) {
            node = parseInterpolation(context);
        }
        else if (s[0] === '<') {
            if (/[a-z]/.test(s[1])) {
                node = parseElement(context, ancestors);
            }
        }
        if (!node) {
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
function isEnd(context, ancestors) {
    const s = context.source;
    if (s.startsWith('</')) {
        for (let index = ancestors.length - 1; index >= 0; index--) {
            let { tag } = ancestors[index];
            if (startsWithEndTagOpen(s, tag)) {
                return true;
            }
        }
    }
    return !s;
}
function parseInterpolation(context) {
    const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);
    advanceBy(context, openDelimiter.length);
    const rawContentLength = closeIndex - openDelimiter.length;
    const rawContent = parseTextData(context, rawContentLength);
    const content = rawContent.trim();
    advanceBy(context, closeDelimiter.length);
    return {
        type: 0 /* NodeTypes.INTERPOLATION */,
        content: {
            type: 1 /* NodeTypes.SIMPLE_EXPRESSION */,
            content: content,
        },
    };
}
function advanceBy(context, length) {
    context.source = context.source.slice(length);
}
function createRoot(children) {
    return {
        children,
        type: 4 /* NodeTypes.ROOT */,
    };
}
function creatrParseContext(content) {
    return {
        source: content,
    };
}
function parseElement(context, ancestors) {
    const element = parseTag(context, 0 /* TagType.START */);
    ancestors.push(element);
    element.children = parseChildren(context, ancestors);
    ancestors.pop();
    if (startsWithEndTagOpen(context.source, element.tag)) {
        parseTag(context, 1 /* TagType.END */);
    }
    else {
        throw new Error(`缺少结束标签:${element.tag}`);
    }
    return element;
}
function startsWithEndTagOpen(source, tag) {
    return (source.startsWith('</') &&
        source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase());
}
function parseTag(context, type) {
    const match = /^<\/?([a-z]*)/i.exec(context.source);
    advanceBy(context, match[0].length);
    advanceBy(context, 1);
    if (type === 1 /* TagType.END */)
        return;
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag: match[1],
    };
}
function parseText(context) {
    let endTokenList = [openDelimiter, '<'];
    let endIndex = context.source.length;
    for (const endToken of endTokenList) {
        let findindex = context.source.indexOf(endToken);
        if (findindex !== -1 && endIndex > findindex) {
            endIndex = findindex;
        }
    }
    const content = parseTextData(context, endIndex);
    return { type: 3 /* NodeTypes.TEXT */, content };
}
function parseTextData(context, length) {
    const content = context.source.slice(0, length);
    advanceBy(context, content.length);
    return content;
}

function transform(root, options = {}) {
    const context = createTransformContext(root, options);
    traverseNode(root, context);
    createRootCodegen(root);
    root.helpers = [...context.helpers.keys()];
}
function createRootCodegen(root) {
    const child = root.children[0];
    if (child.type === 2 /* NodeTypes.ELEMENT */) {
        root.codegenNode = child.codegenNode;
    }
    else {
        root.codegenNode = child;
    }
}
function traverseNode(node, context) {
    const exitFns = [];
    context.nodeTransforms.forEach((fn) => {
        const onExit = fn(node, context);
        onExit && exitFns.push(onExit);
    });
    switch (node.type) {
        case 0 /* NodeTypes.INTERPOLATION */:
            break;
        case 4 /* NodeTypes.ROOT */:
        case 2 /* NodeTypes.ELEMENT */:
            traverseChildren(node, context);
            break;
    }
    let i = exitFns.length;
    while (i--) {
        exitFns[i]();
    }
}
function createTransformContext(root, options) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        helper(key) {
            context.helpers.set(key, 1);
        },
    };
    return context;
}
function traverseChildren(node, context) {
    let children = node.children;
    if (children) {
        children.forEach((node) => {
            traverseNode(node, context);
        });
    }
}

function transformElement(node, context) {
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        return () => {
            const { children, props, tag } = node;
            const child = children[0];
            context.helper(OPEN_BLOCK);
            context.helper(CREATE_ELEMENT_BLOCK);
            const vondeElement = {
                type: 2 /* NodeTypes.ELEMENT */,
                tag: `'${tag}'`,
                props,
                children: child,
            };
            node.codegenNode = vondeElement;
        };
    }
}

function transformExpression(node, context) {
    if (node.type === 0 /* NodeTypes.INTERPOLATION */) {
        context.helper(TO_DISPLAY_STRING);
        node.content = processExpression(node.content);
    }
}
function processExpression(node) {
    node.content = `_${helperMapName[CTX]}.` + node.content;
    return node;
}

function isText(node) {
    return [3 /* NodeTypes.TEXT */, 0 /* NodeTypes.INTERPOLATION */].includes(node.type);
}

//将插值节点与文本节点融合成新节点，使用尾调用都可以进入node.type === NodeTypes.ELEMENT，还可以减少调用次数
function transformText(node) {
    let currentContainer;
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        return () => {
            const { children } = node;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (isText(child)) {
                    for (let j = i + 1; j < children.length; j++) {
                        const next = children[j];
                        if (isText(next)) {
                            if (!currentContainer) {
                                currentContainer = children[i] = {
                                    type: 5 /* NodeTypes.COMPOUND_EXPRESSION */,
                                    children: [child],
                                };
                            }
                            currentContainer.children.push('+');
                            currentContainer.children.push(next);
                            children.splice(j, 1);
                            j--;
                        }
                    }
                }
                else {
                    currentContainer = undefined;
                    break;
                }
            }
        };
    }
}

function baseCompile(template) {
    const ast = baseParse(template);
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText],
    });
    return generate(ast);
}

function compileToFunction(template) {
    const { code } = baseCompile(template);
    const render = new Function('Vue', code)(runtimeDom);
    return render;
}
registerRuntimeCompiler(compileToFunction);

exports.createApp = createApp;
exports.createElementBlock = createVNode;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.effect = effect;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.isProxy = isProxy;
exports.isReactive = isReactive;
exports.isReadOnly = isReadOnly;
exports.isRef = isRef;
exports.nextTick = nextTick;
exports.openBlock = openBlock;
exports.provider = provider;
exports.proxyRefs = proxyRefs;
exports.reactive = reactive;
exports.readonly = readonly;
exports.ref = ref;
exports.registerRuntimeCompiler = registerRuntimeCompiler;
exports.renderSlots = renderSlots;
exports.shallowReadonly = shallowReadonly;
exports.stop = stop;
exports.toDisplayString = toDisplayString;
exports.unRef = unRef;
