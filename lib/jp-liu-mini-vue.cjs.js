'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
/**
 * @description 创建虚拟节点
 * @param type 节点类型
 * @param props 节点属性
 * @param children 子节点
 */
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        shapeFlag: getShapeFlag(type),
        el: null
    };
    if (typeof children === 'string') {
        // 子组件是文字,则将当前节点标注为,元素+文字
        vnode.shapeFlag |= 4 /* TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        // 子组件是数组,则有可能是新组件,或者元素子节点为,元素+子元素
        vnode.shapeFlag |= 8 /* ARRAY_CHILDREN */;
    }
    // 是否有插槽
    if (vnode.shapeFlag & 2 /* STATEFUL_COMPONENT */ &&
        typeof children === 'object') {
        vnode.shapeFlag |= 16 /* SLOT_CHILDREN */;
    }
    return vnode;
}
function createTextVnode(text) {
    return createVNode(Text, {}, text);
}
/**
 * @description 获取当前子节点的类型标识符
 * @param type 当前`vnode`的类型
 */
function getShapeFlag(type) {
    return typeof type === 'string'
        ? 1 /* ELEMENT */
        : 2 /* STATEFUL_COMPONENT */;
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                // 1.将组件或者`Dom`转换成为虚拟节点
                const vnode = createVNode(rootComponent);
                // 2.处理`vnode`
                render(vnode, rootContainer);
            }
        };
    };
}

const extend = Object.assign;
const isObject = value => value !== null && typeof value === 'object';
const hasChanged = (value, newValue) => !Object.is(value, newValue);
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
const keys = obj => Object.keys(obj);
const isOn = (str) => /^on[A-Z]/.test(str);
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, e) => {
        return e ? e.toUpperCase() : e;
    });
};
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
const toHanderKey = (str) => {
    return str ? `on${capitalize(str)}` : '';
};

// eslint-disable-next-line no-use-before-define
let activeEffect;
let shouldTrack = false;
const targetMap = new WeakMap();
/**
 * @description 被收集的依赖函数类
 */
class ReactiveEffect {
    constructor(fn, shceduler) {
        this.deps = [];
        this.active = true;
        this._fn = fn;
        this.shceduler = shceduler;
    }
    run() {
        // 执行`stop`之后,应该避免收集依赖,不开启依赖收集开关
        // 因为退出响应式系统,仍然保留着 fn 函数的执行权力
        if (!this.active) {
            return this._fn();
        }
        // 1.开启开关,允许依赖收集
        shouldTrack = true;
        // 2.设置依赖收集的目标
        activeEffect = this;
        // 3.执行`fn`,调用内部的`get`的时候,就可以收集`fn`了
        const result = this._fn();
        // 4.关闭依赖收集开关
        shouldTrack = false;
        return result;
    }
    // 退出响应式系统
    stop() {
        // 是否在响应式系统中
        if (this.active) {
            clearupEffect(this);
            // 如果给了回调,则进行回调
            if (this.onStop)
                this.onStop();
            this.active = false;
        }
    }
}
/**
 * @description 副作用函数,收集依赖
 * @param { Function } fn
 */
function effect(fn, options) {
    // 1.初始化
    const _effect = new ReactiveEffect(fn, options === null || options === void 0 ? void 0 : options.shceduler);
    extend(_effect, options);
    // 2.调用`run`方法,就是调用fn触发内部的`get/set`
    _effect.run();
    // 3.返回`runner`函数
    const runner = _effect.run.bind(activeEffect);
    runner.effect = _effect;
    return runner;
}
function clearupEffect(effect) {
    effect.deps.forEach(dep => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
/**
 * @description 调用`get`方法的时候,进行依赖收集
 * @param target 当前追踪对象
 * @param key 当前访问的`key`
 */
function track(target, key) {
    // @desc: 不是收集状态,直接返回
    if (!isTracting())
        return;
    // console.log(`触发 track -> target: ${target} key:${key}`)
    // 获取当前追踪对象
    let depsMap = targetMap.get(target);
    // 判断是否存在依赖中,没有则添加
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    // @desc: 获取当前对象的`key`对应的依赖
    let dep = depsMap.get(key);
    // 没有则添加一个
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    // @desc: 手动触发`track`,允许其他人加入响应式系统, 如`ref`
    trackEffects(dep);
}
function trackEffects(dep) {
    // @desc: 如果已经添加过了,避免重复添加
    if (!dep.has(activeEffect)) {
        // 将依赖加入对应的`dep`中
        dep.add(activeEffect);
        activeEffect === null || activeEffect === void 0 ? void 0 : activeEffect.deps.push(dep);
    }
}
function isTracting() {
    return shouldTrack && activeEffect;
}
/**
 * @description 调用`set`方法的时候,触发变更函数
 * @param target 当前追踪对象
 * @param key 当前访问的`key`
 */
function trigger(target, key) {
    // console.log(`触发 trigger -> target: ${target} key:${key}`)
    const depsMap = targetMap.get(target);
    const dep = depsMap.get(key);
    // @desc: 手动触发`trigger`,让其他人也可以加入响应式系统, 如`ref`
    triggerEffects(dep);
}
function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.shceduler) {
            // 如果用户需要自己拥有操作权,则采用这个方案
            effect.shceduler();
        }
        else {
            effect.run();
        }
    }
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const readonlySet = createSetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        if (key === "__v_reactive" /* IS_REACTIVE */) {
            return !isReadonly;
        }
        if (key === "__v_readonly" /* IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (shallow) {
            return res;
        }
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        // 进行依赖追踪
        if (!isReadonly) {
            track(target, key);
        }
        return res;
    };
}
function createSetter(isReadonly = false) {
    return function set(target, key, value) {
        if (isReadonly) {
            // 不能设置,给报错信息
            console.warn(`Cannot be edited key: ${String(key)}, it is readonly`);
            return true;
        }
        const res = Reflect.set(target, key, value);
        // 触发更新
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set
};
const readonlyHandlers = {
    get: readonlyGet,
    set: readonlySet
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet
});

function reactive(raw) {
    return createActiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createActiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createActiveObject(raw, shallowReadonlyHandlers);
}
function createActiveObject(raw, baseHandler) {
    if (!isObject(raw)) {
        console.warn(`target: ${raw} should be object`);
        return;
    }
    return new Proxy(raw, baseHandler);
}

class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        this._raw = value;
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        // 如何加入响应式,手动`track`,那么需要自己`trigger`
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        if (hasChanged(this._raw, newValue)) {
            this._raw = newValue;
            this._value = convert(newValue);
            triggerEffects(this.dep);
        }
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function trackRefValue(ref) {
    if (isTracting()) {
        trackEffects(ref.dep);
    }
}
function ref(value) {
    return new RefImpl(value);
}
function isRef(ref) {
    return !!ref.__v_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRef) {
    return new Proxy(objectWithRef, {
        get(target, key) {
            // get 操作,提供解包后的结果
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            // 如果新值是ref直接赋值,如果不是,则需要对value赋值
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            return Reflect.set(target, key, value);
        }
    });
}

/**
 * @tips 1.`emit`的事件,其实触发的还是组件本身,只是方法定义,放在了父组件上
 * @tips 2.为什么要这样呢? 因为组件被创建和挂载,是在父组件递归执行的,可以再这个时候拿到父组件的状态
 * @tips 2.所以,我们通过将组件上发出的事件名,在父组件中获取函数定义,并执行
 */
function emit(instance, event) {
    // 1.处理事件名称
    const handlerName = toHanderKey(camelize(event));
    // 2.获取函数定义,如果存在,则调用
    const { props } = instance;
    const handler = props[handlerName];
    if (handler && typeof handler !== 'function') {
        console.warn('Emit event handler should be a function');
        return;
    }
    // 3.执行函数
    handler && handler();
}

/**
 * @description 初始化组件的`props`属性内容,包括`attrs`非属性继承特性
 * @param instance 组件实例
 * @param rawProps 组件原始`props`
 */
function initProps(instance, rawProps) {
    instance.props = rawProps || {};
    // TODO attrs
}

function initSlots(instance, children) {
    const { shapeFlag } = instance.vnode;
    if (shapeFlag & 16 /* SLOT_CHILDREN */) {
        // 插槽是需要渲染到组件的子节点,作为子节点,我们的实现,两种情况
        //  - 只支持字符串,直接渲染
        //  - 数组,进行每个元素的判定执行后一步
        // 提供的插槽回事一个虚拟节点,所以需要作为数组,进行判定
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (const slot in children) {
        const value = children[slot]; // 对应的函数定义
        // 1.调用`value`获取虚拟节点类型,进行判定
        // 2.保留函数调用,执行插槽时,才能传入参数
        slots[slot] = props => normalizeValue(value(props));
    }
}
function normalizeValue(value) {
    return Array.isArray(value) ? value : [value];
}

/**
 * 设置当前组件实例
 */
let currentInstance = null;
function createComponentInstance(vnode, parent) {
    console.log(parent);
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false,
        subTree: null,
        emit: () => { }
    };
    component.emit = emit;
    return component;
}
function setupComponent(instance) {
    // TODO
    // 1.initProps
    initProps(instance, instance.vnode.props);
    // 2.initSlots
    initSlots(instance, instance.vnode.children);
    // 3.初始化组件状态
    setupStateFulComponent(instance);
}
function setupStateFulComponent(instance) {
    // 1.获取组件配置
    const Component = instance.type;
    // 2.获取组件的`setup`
    const { setup } = Component;
    // 3.获取配置返回状态
    if (setup) {
        // 设置全局实例对象,用于`getCurrentInstance`
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit.bind(null, instance)
        });
        // 释放实例
        setCurrentInstance(null);
        handleSetupResult(instance, proxyRefs(setupResult));
    }
}
function handleSetupResult(instance, setupResult) {
    // 1.判断是`setup`给的渲染函数,还是各种状态
    if (typeof setupResult === 'object') {
        instance.setupState = setupResult;
    }
    // TODO => 渲染函数的情况
    // 2.获取了组件的状态之后,进行最后一步处理
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    // 1.判断是否给定`render`渲染函数
    //   - 给了,则用用户的
    //   - 没给,自己根据情况创建 => TODO
    if (Component.render) {
        instance.render = Component.render;
    }
    // 到这里, 组件的状态,渲染函数已经全部获取到了,可以进行渲染了
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}
function getCurrentInstance() {
    return currentInstance;
}

/**
 * @description 组件实例属性访问符
 */
const publicPropertiesMap = {
    $el: i => i.vnode.el,
    $slots: i => i.slots
};
/**
 * @description 代理组件实例状态
 */
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        // 1.`setup`返回值对象,就是提供组件使用的状态
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        // 3.`props`传递对象
        if (hasOwn(props, key)) {
            return props[key];
        }
        // 2.组件实例上的专有属性,$el/$data...
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

/**
 * @description 通过外部定义创建渲染器,达到渲染不同平台元素
 * @param options 元素处理接口
 */
function createRenderer(options) {
    // 提供自定义渲染接口
    // 起别名
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, createTextNode: hostCreateTextNode } = options;
    function render(vnode, rootContainer) {
        patch(null, vnode, rootContainer, null);
    }
    function patch(n1, n2, container, parentComponent) {
        const { type, shapeFlag } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                // 1.判断类型,进行不同操作
                if (shapeFlag & 1 /* ELEMENT */) {
                    // 1.1 元素
                    processElement(n1, n2, container, parentComponent);
                }
                else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
                    // 1.2 组件
                    processComponent(n1, n2, container, parentComponent);
                }
                break;
        }
    }
    function processFragment(n1, n2, container, parentComponent) {
        mountChildren(n2, container, parentComponent);
    }
    function processText(n1, n2, container) {
        const el = (n2.el = hostCreateTextNode(n2.children));
        hostInsert(el, container);
    }
    function processComponent(n1, n2, container, parentComponent) {
        // 1.挂载组件
        mountComponent(n2, container, parentComponent);
    }
    function mountComponent(n2, container, parentComponent) {
        // 1.创建组件实例
        const instance = createComponentInstance(n2, parentComponent);
        // 2.初始化组件状态
        setupComponent(instance);
        // 3.获取状态之后,创建组件代理对象,访问组件实例
        instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
        // 4.挂载组件
        setupRenderEffect(instance, container);
    }
    function setupRenderEffect(instance, container) {
        effect(() => {
            // @Tips: 第一次加载
            if (!instance.isMounted) {
                // 1.调用渲染函数,获取组件虚拟节点树,绑定`this`为代理对象,实现`render`函数中访问组件状态
                const subTree = instance.render.call(instance.proxy, h);
                // 2.继续`patch`,递归挂载组件
                patch(null, subTree, container, instance);
                // 3.组件实例绑定`el`用于后续`patch`精准更新
                instance.vnode.el = subTree.el;
                // 4.存放旧虚拟节点树,后续`patch`调用
                instance.subTree = subTree;
                // 5.标识已挂载
                instance.isMounted = true;
            }
            // @Tips: 更新
            else {
                // 1.获取到新的虚拟节点树
                const subTree = instance.render.call(instance.proxy, h);
                // 2.获取旧的虚拟节点树
                const prevSubTree = instance.subTree;
                // 3.`patch`更新页面
                patch(prevSubTree, subTree, container, instance);
                // 4.对比完后新树变旧树
                instance.subTree = subTree;
            }
        });
    }
    function processElement(n1, n2, container, parentComponent) {
        if (!n1) {
            // 1.挂载元素
            mountElement(n2, container, parentComponent);
        }
        else {
            // 2.更新元素
            patchElement(n1, n2);
        }
    }
    function mountElement(vnode, container, parentComponent) {
        // 1.创建真实元素,并挂载到`vnode`上,方便访问
        const el = (vnode.el = hostCreateElement(vnode.type));
        // 2.挂载属性
        const { props } = vnode;
        for (const key in props) {
            const val = props[key];
            // 通过自定义渲染器处理属性
            hostPatchProp(el, key, null, val);
        }
        // 3.处理子组件
        const { children, shapeFlag } = vnode;
        // 3.1 文本类,直接设置内容
        if (shapeFlag & 4 /* TEXT_CHILDREN */) {
            el.textContent = children;
        }
        // 3.2 数组,则证明是元素或者组件
        else if (shapeFlag & 8 /* ARRAY_CHILDREN */) {
            mountChildren(vnode, el, parentComponent);
        }
        hostInsert(el, container);
    }
    function patchElement(n1, n2) {
        // 1.从旧节点中获取之前的`DOM`并在新节点中赋值,新节点下次就是旧的了
        const el = (n2.el = n1.el);
        console.log('旧虚拟节点:', n1);
        console.log('新虚拟节点:', n2);
        // TODO 更新数据,节点信息
        // 1.更新属性
        const oldProps = n1.props || {};
        const newProps = n2.props || {};
        patchProps(el, oldProps, newProps);
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            // 1.比对新`vnode`更新属性
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                if (prevProp !== nextProp) {
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }
            // 2.比对旧`vnode`判断是否有删除属性
            if (keys(oldProps).length) {
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    // 挂载全部子组件
    function mountChildren(vnode, el, parentComponent) {
        vnode.children.forEach(item => {
            patch(null, item, el, parentComponent);
        });
    }
    return {
        createApp: createAppAPI(render)
    };
}

function renderSlot(slots, key, props) {
    const slot = slots[key];
    // 到时候加上开发环境的判定
    if (!slot || typeof slot !== 'function') {
        // 没有对应插槽的时候,返回空,`patch`的时候,就不知道类型,就啥也没做了
        console.warn('There is no current slot');
    }
    if (slot && typeof slot === 'function') {
        return createVNode(Fragment, {}, slot(props));
    }
    return {};
}

/**
 * @description 向子孙组件注入状态
 */
function provide(key, value) {
    // 1.获取当前组件实例
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        // 2.获取组件`provides`
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent.provides;
        // 3.通过原型链查找,达到链式查询的功能,初始化的时候绑定原型
        // 创建组件实例的时候,默认是指向父级的,这个时候如果需要创建`provide`,则会绑定一次原型
        if (provides === parentProvides) {
            // 创建一个空对象并将对象__proto__指向目标对象
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
/**
 * @description 获取祖先组件提供的状态
 */
function inject(key, defaultValue) {
    // 1.获取当前组件实例
    const currentInstance = getCurrentInstance();
    // 2.`value`在祖先组件的`provides`上面
    if (currentInstance) {
        const praentProvides = currentInstance.parent.provides;
        // 判断是否存在当前`key`,如果没有,则判断是否采用默认值
        if (key in praentProvides) {
            return praentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === 'function') {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function createElement(type) {
    return document.createElement(type);
}
function createTextNode(text) {
    return document.createTextNode(text);
}
function patchProp(el, key, prevProp, nextProp) {
    // 2.1 事件
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, nextProp);
    }
    // 2.2 属性
    else {
        if (!nextProp) {
            el.removeAttribute(key, nextProp);
        }
        else {
            el.setAttribute(key, nextProp);
        }
    }
}
function insert(el, parent) {
    parent.append(el);
}
const renderer = createRenderer({
    createElement,
    createTextNode,
    patchProp,
    insert
});
function createApp(...args) {
    return renderer.createApp(...args);
}

exports.createApp = createApp;
exports.createRenderer = createRenderer;
exports.createTextVnode = createTextVnode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.provide = provide;
exports.ref = ref;
exports.renderSlot = renderSlot;
