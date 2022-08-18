const extend = Object.assign;
const isObject = (value) => {
    return value !== null && typeof value == 'object';
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
        if (this.active) {
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
        return;
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
    activeEffect.deps.push(dep);
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
                return target[p].value = value;
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

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    let vnode = {
        type,
        props,
        children,
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

function renderSlots(slots, defaultSoltName = 'default', slotsProps = {}) {
    const slot = slots[defaultSoltName];
    if (slot) {
        if (isFunction(slot)) {
            return createVNode(Fragment, {}, slot(slotsProps));
        }
    }
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
    if (Component.render) {
        instance.render = Component.render;
    }
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
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

//作为底层向上层提供的个性化渲染器函数
function createRenderer(renderFlowOptions) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = renderFlowOptions;
    function render(vnode, container) {
        patch(null, vnode, container, null);
    }
    function patch(n1, n2, container, parentComponent) {
        let { type, shapeFlag } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent);
                }
                break;
        }
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    /*
    处理render的虚拟dom 返回的type属性为Fragment,只渲染children
    */
    function processFragment(n1, n2, container, parentComponent) {
        mountChildren(n2.children, container, parentComponent);
    }
    /*
    处理render的虚拟dom 返回的type属性为浏览器原生元素(叫组件也不过分吧),进行初始化挂载与更新处理
    */
    function processElement(n1, n2, container, parentComponent) {
        if (!n1) {
            mountElement(n2, container, parentComponent);
        }
        else {
            patchElement(n1, n2, parentComponent);
        }
    }
    function patchElement(n1, n2, parentComponent) {
        console.log(n1, n2, 'patchElement');
        const oldProps = n1.props || {};
        const newProps = n2.props || {};
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentComponent);
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent) {
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
                mountChildren(n2.children, container, parentComponent);
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
    function mountElement(vnode, container, parentComponent) {
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
            mountChildren(children, el, parentComponent);
        }
        hostInsert(el, container);
    }
    function mountChildren(children, container, parentComponent) {
        children.forEach((v) => {
            patch(null, v, container, parentComponent);
        });
    }
    /*
    处理render的虚拟dom 返回的type属性为使用者定义的组件对象，进行初始挂载响应式对象与render函数
    */
    function processComponent(n1, n2, container, parentComponent) {
        mountComponent(n2, container, parentComponent);
    }
    function mountComponent(initinalVnode, container, parentComponent) {
        const instance = createComponentInstance(initinalVnode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initinalVnode, container);
    }
    function setupRenderEffect(instance, initinalVnode, container) {
        effect(() => {
            if (!instance.isMounted) {
                //初始化
                const { proxy } = instance;
                //初始化记录总虚拟节点对象
                const subTree = (instance.subTree = instance.render.call(proxy));
                patch(null, subTree, container, instance);
                //初始化挂载结束时
                initinalVnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                //更新
                const { proxy } = instance;
                const subTree = instance.render.call(proxy);
                const preSubTree = instance.subTree;
                instance.subTree = subTree;
                patch(preSubTree, subTree, container, instance);
            }
        });
    }
    //保持调用链依赖注入的个性化render函数
    return {
        createApp: createAppAPI(render),
    };
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
function insert(el, parent) {
    parent.append(el);
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

export { createApp, createRenderer, createTextVNode, getCurrentInstance, h, inject, provider, proxyRefs, ref, renderSlots };
