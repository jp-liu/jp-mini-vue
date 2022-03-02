'use strict'

Object.defineProperty(exports, '__esModule', { value: true })

const Fragment = Symbol('Fragment')
const Text = Symbol('Text')
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
    component: null,
    key: props && props.key,
    shapeFlag: getShapeFlag(type),
    el: null // 真实`DOM`引用,精确的`DOM`更新
  }
  if (typeof children === 'string') {
    // 子组件是文字,则将当前节点标注为,元素+文字
    vnode.shapeFlag |= 4 /* TEXT_CHILDREN */
  } else if (Array.isArray(children)) {
    // 子组件是数组,则有可能是新组件,或者元素子节点为,元素+子元素
    vnode.shapeFlag |= 8 /* ARRAY_CHILDREN */
  }
  // 是否有插槽
  if (
    vnode.shapeFlag & 2 /* STATEFUL_COMPONENT */ &&
    typeof children === 'object'
  ) {
    vnode.shapeFlag |= 16 /* SLOT_CHILDREN */
  }
  return vnode
}
function createTextVnode(text) {
  return createVNode(Text, {}, text)
}
/**
 * @description 获取当前子节点的类型标识符
 * @param type 当前`vnode`的类型
 */
function getShapeFlag(type) {
  return typeof type === 'string' ? 1 /* ELEMENT */ : 2 /* STATEFUL_COMPONENT */
}

function createAppAPI(render) {
  return function createApp(rootComponent) {
    return {
      mount(rootContainer) {
        // 1.将组件或者`Dom`转换成为虚拟节点
        const vnode = createVNode(rootComponent)
        // 2.处理`vnode`
        render(vnode, rootContainer)
      }
    }
  }
}

const extend = Object.assign
const isObject = value => value !== null && typeof value === 'object'
const hasChanged = (value, newValue) => !Object.is(value, newValue)
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key)
const keys = obj => Object.keys(obj)
const isOn = str => /^on[A-Z]/.test(str)
const camelize = str => {
  return str.replace(/-(\w)/g, (_, e) => {
    return e ? e.toUpperCase() : e
  })
}
const capitalize = str => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
const toHanderKey = str => {
  return str ? `on${capitalize(str)}` : ''
}

// eslint-disable-next-line no-use-before-define
let activeEffect
let shouldTrack = false
const targetMap = new WeakMap()
/**
 * @description 被收集的依赖函数类
 */
class ReactiveEffect {
  constructor(fn, shceduler) {
    this.deps = []
    this.active = true
    this._fn = fn
    this.shceduler = shceduler
  }
  run() {
    // 执行`stop`之后,应该避免收集依赖,不开启依赖收集开关
    // 因为退出响应式系统,仍然保留着 fn 函数的执行权力
    if (!this.active) {
      return this._fn()
    }
    // 1.开启开关,允许依赖收集
    shouldTrack = true
    // 2.设置依赖收集的目标
    activeEffect = this
    // 3.执行`fn`,调用内部的`get`的时候,就可以收集`fn`了
    const result = this._fn()
    // 4.关闭依赖收集开关
    shouldTrack = false
    return result
  }
  // 退出响应式系统
  stop() {
    // 是否在响应式系统中
    if (this.active) {
      clearupEffect(this)
      // 如果给了回调,则进行回调
      if (this.onStop) this.onStop()
      this.active = false
    }
  }
}
/**
 * @description 副作用函数,收集依赖
 * @param { Function } fn
 */
function effect(fn, options) {
  // 1.初始化
  const _effect = new ReactiveEffect(
    fn,
    options === null || options === void 0 ? void 0 : options.shceduler
  )
  extend(_effect, options)
  // 2.调用`run`方法,就是调用fn触发内部的`get/set`
  _effect.run()
  // 3.返回`runner`函数
  const runner = _effect.run.bind(activeEffect)
  runner.effect = _effect
  return runner
}
function clearupEffect(effect) {
  effect.deps.forEach(dep => {
    dep.delete(effect)
  })
  effect.deps.length = 0
}
/**
 * @description 调用`get`方法的时候,进行依赖收集
 * @param target 当前追踪对象
 * @param key 当前访问的`key`
 */
function track(target, key) {
  // @desc: 不是收集状态,直接返回
  if (!isTracting()) return
  // console.log(`触发 track -> target: ${target} key:${key}`)
  // 获取当前追踪对象
  let depsMap = targetMap.get(target)
  // 判断是否存在依赖中,没有则添加
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }
  // @desc: 获取当前对象的`key`对应的依赖
  let dep = depsMap.get(key)
  // 没有则添加一个
  if (!dep) {
    dep = new Set()
    depsMap.set(key, dep)
  }
  // @desc: 手动触发`track`,允许其他人加入响应式系统, 如`ref`
  trackEffects(dep)
}
function trackEffects(dep) {
  // @desc: 如果已经添加过了,避免重复添加
  if (!dep.has(activeEffect)) {
    // 将依赖加入对应的`dep`中
    dep.add(activeEffect)
    activeEffect === null || activeEffect === void 0
      ? void 0
      : activeEffect.deps.push(dep)
  }
}
function isTracting() {
  return shouldTrack && activeEffect
}
/**
 * @description 调用`set`方法的时候,触发变更函数
 * @param target 当前追踪对象
 * @param key 当前访问的`key`
 */
function trigger(target, key) {
  // console.log(`触发 trigger -> target: ${target} key:${key}`)
  const depsMap = targetMap.get(target)
  const dep = depsMap.get(key)
  // @desc: 手动触发`trigger`,让其他人也可以加入响应式系统, 如`ref`
  triggerEffects(dep)
}
function triggerEffects(dep) {
  for (const effect of dep) {
    if (effect.shceduler) {
      // 如果用户需要自己拥有操作权,则采用这个方案
      effect.shceduler()
    } else {
      effect.run()
    }
  }
}

const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)
const readonlySet = createSetter(true)
const shallowReadonlyGet = createGetter(true, true)
function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key) {
    if (key === '__v_reactive' /* IS_REACTIVE */) {
      return !isReadonly
    }
    if (key === '__v_readonly' /* IS_READONLY */) {
      return isReadonly
    }
    const res = Reflect.get(target, key)
    if (shallow) {
      return res
    }
    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res)
    }
    // 进行依赖追踪
    if (!isReadonly) {
      track(target, key)
    }
    return res
  }
}
function createSetter(isReadonly = false) {
  return function set(target, key, value) {
    if (isReadonly) {
      // 不能设置,给报错信息
      console.warn(`Cannot be edited key: ${String(key)}, it is readonly`)
      return true
    }
    const res = Reflect.set(target, key, value)
    // 触发更新
    trigger(target, key)
    return res
  }
}
const mutableHandlers = {
  get,
  set
}
const readonlyHandlers = {
  get: readonlyGet,
  set: readonlySet
}
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
  get: shallowReadonlyGet
})

function reactive(raw) {
  return createActiveObject(raw, mutableHandlers)
}
function readonly(raw) {
  return createActiveObject(raw, readonlyHandlers)
}
function shallowReadonly(raw) {
  return createActiveObject(raw, shallowReadonlyHandlers)
}
function createActiveObject(raw, baseHandler) {
  if (!isObject(raw)) {
    console.warn(`target: ${raw} should be object`)
    return
  }
  return new Proxy(raw, baseHandler)
}

class RefImpl {
  constructor(value) {
    this.__v_isRef = true
    this._raw = value
    this._value = convert(value)
    this.dep = new Set()
  }
  get value() {
    // 如何加入响应式,手动`track`,那么需要自己`trigger`
    trackRefValue(this)
    return this._value
  }
  set value(newValue) {
    if (hasChanged(this._raw, newValue)) {
      this._raw = newValue
      this._value = convert(newValue)
      triggerEffects(this.dep)
    }
  }
}
function convert(value) {
  return isObject(value) ? reactive(value) : value
}
function trackRefValue(ref) {
  if (isTracting()) {
    trackEffects(ref.dep)
  }
}
function ref(value) {
  return new RefImpl(value)
}
function isRef(ref) {
  return !!ref.__v_isRef
}
function unRef(ref) {
  return isRef(ref) ? ref.value : ref
}
function proxyRefs(objectWithRef) {
  if (!isObject(objectWithRef)) {
    console.warn('Proxy origin data should be a object')
    return
  }
  return new Proxy(objectWithRef, {
    get(target, key) {
      // get 操作,提供解包后的结果
      return unRef(Reflect.get(target, key))
    },
    set(target, key, value) {
      // 如果新值是ref直接赋值,如果不是,则需要对value赋值
      if (isRef(target[key]) && !isRef(value)) {
        return (target[key].value = value)
      }
      return Reflect.set(target, key, value)
    }
  })
}

/**
 * @tips 1.`emit`的事件,其实触发的还是组件本身,只是方法定义,放在了父组件上
 * @tips 2.为什么要这样呢? 因为组件被创建和挂载,是在父组件递归执行的,可以再这个时候拿到父组件的状态
 * @tips 2.所以,我们通过将组件上发出的事件名,在父组件中获取函数定义,并执行
 */
function emit(instance, event) {
  // 1.处理事件名称
  const handlerName = toHanderKey(camelize(event))
  // 2.获取函数定义,如果存在,则调用
  const { props } = instance
  const handler = props[handlerName]
  if (handler && typeof handler !== 'function') {
    console.warn('Emit event handler should be a function')
    return
  }
  // 3.执行函数
  handler && handler()
}

/**
 * @description 初始化组件的`props`属性内容,包括`attrs`非属性继承特性
 * @param instance 组件实例
 * @param rawProps 组件原始`props`
 */
function initProps(instance, rawProps) {
  instance.props = rawProps || {}
  // TODO attrs
}

function initSlots(instance, children) {
  const { shapeFlag } = instance.vnode
  if (shapeFlag & 16 /* SLOT_CHILDREN */) {
    // 插槽是需要渲染到组件的子节点,作为子节点,我们的实现,两种情况
    //  - 只支持字符串,直接渲染
    //  - 数组,进行每个元素的判定执行后一步
    // 提供的插槽回事一个虚拟节点,所以需要作为数组,进行判定
    normalizeObjectSlots(children, instance.slots)
  }
}
function normalizeObjectSlots(children, slots) {
  for (const slot in children) {
    const value = children[slot] // 对应的函数定义
    // 1.调用`value`获取虚拟节点类型,进行判定
    // 2.保留函数调用,执行插槽时,才能传入参数
    slots[slot] = props => normalizeValue(value(props))
  }
}
function normalizeValue(value) {
  return Array.isArray(value) ? value : [value]
}

/**
 * 设置当前组件实例
 */
let currentInstance = null
function createComponentInstance(vnode, parent) {
  console.log(parent)
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
    next: null,
    emit: () => {}
  }
  component.emit = emit
  return component
}
function setupComponent(instance) {
  // TODO
  // 1.initProps
  initProps(instance, instance.vnode.props)
  // 2.initSlots
  initSlots(instance, instance.vnode.children)
  // 3.初始化组件状态
  setupStateFulComponent(instance)
}
function setupStateFulComponent(instance) {
  // 1.获取组件配置
  const Component = instance.type
  // 2.获取组件的`setup`
  const { setup } = Component
  // 3.获取配置返回状态
  if (setup) {
    // 设置全局实例对象,用于`getCurrentInstance`
    setCurrentInstance(instance)
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit.bind(null, instance)
    })
    // 释放实例
    setCurrentInstance(null)
    handleSetupResult(instance, proxyRefs(setupResult))
  }
}
function handleSetupResult(instance, setupResult) {
  // 1.判断是`setup`给的渲染函数,还是各种状态
  if (typeof setupResult === 'object') {
    instance.setupState = setupResult
  }
  // TODO => 渲染函数的情况
  // 2.获取了组件的状态之后,进行最后一步处理
  finishComponentSetup(instance)
}
function finishComponentSetup(instance) {
  const Component = instance.type
  // 1.判断是否给定`render`渲染函数
  //   - 给了,则用用户的
  //   - 没给,自己根据情况创建 => TODO
  if (Component.render) {
    instance.render = Component.render
  }
  // 到这里, 组件的状态,渲染函数已经全部获取到了,可以进行渲染了
}
function setCurrentInstance(instance) {
  currentInstance = instance
}
function getCurrentInstance() {
  return currentInstance
}

/**
 * @description 组件实例属性访问符
 */
const publicPropertiesMap = {
  $el: i => i.vnode.el,
  $slots: i => i.slots,
  $props: i => i.props
}
/**
 * @description 代理组件实例状态
 */
const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    const { setupState, props } = instance
    // 1.`setup`返回值对象,就是提供组件使用的状态
    if (hasOwn(setupState, key)) {
      return setupState[key]
    }
    // 3.`props`传递对象
    if (hasOwn(props, key)) {
      return props[key]
    }
    // 2.组件实例上的专有属性,$el/$data...
    const publicGetter = publicPropertiesMap[key]
    if (publicGetter) {
      return publicGetter(instance)
    }
  }
}

function shouldUpdateComponent(n1, n2) {
  const { props: prevProps } = n1
  const { props: nextProps } = n2
  for (const prop in nextProps) {
    if (nextProps[prop] !== prevProps[prop]) {
      return true
    }
  }
  return false
}

// 微任务锁,避免重复添加任务
let isFlushPending = false
// 创建一个微任务
const p = Promise.resolve()
// 组件更新任务队列
const queue = []
function nextTick(fn) {
  fn ? p.then(fn) : p
}
function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job)
  }
  queueFlush()
}
function queueFlush() {
  if (isFlushPending) return
  // 生成一个微任务之后,当执行时,组件同步任务已经计算完毕
  // 然后更新一次组件即可,更新队列
  isFlushPending = true
  nextTick(flushJobs)
}
function flushJobs() {
  isFlushPending = false
  let job
  while ((job = queue.shift())) {
    job && job()
  }
}

/**
 * @description 通过外部定义创建渲染器,达到渲染不同平台元素
 * @param options 元素节点处理提供的接口
 */
function createRenderer(options) {
  // 提供自定义渲染接口
  // 起别名
  const {
    createElement: hostCreateElement,
    createTextNode: hostCreateText,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText
  } = options
  // 提供给外部的启动渲染方法
  function render(vnode, rootContainer) {
    // 渲染器入口，从这里开始递归处理节点
    patch(null, vnode, rootContainer, null, null)
  }
  /**
   * @description 比较新旧节点,进行创建和修改操作
   * @param n1 旧节点
   * @param n2 新节点
   * @param container 节点容器
   * @param parentComponent 父组件
   * @param anchor 节点插入的锚点
   */
  function patch(n1, n2, container, parentComponent, anchor) {
    const { type, shapeFlag } = n2
    switch (type) {
      // 分段节点(不需要容器的无根节点)
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor)
        break
      // 文本节点
      case Text:
        processText(n1, n2, container, anchor)
        break
      default:
        // 1.判断类型,进行不同操作
        if (shapeFlag & 1 /* ELEMENT */) {
          // 1.1 元素
          processElement(n1, n2, container, parentComponent, anchor)
        } else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
          // 1.2 组件
          processComponent(n1, n2, container, parentComponent, anchor)
        }
        break
    }
  }
  function processFragment(n1, n2, container, parentComponent, anchor) {
    // 不需要父容器的切片,也就是再不用创建一个容器包裹当前内容,
    // 直接将内容添加到当前的容器内,就可以了
    mountChildren(n2.children, container, parentComponent, anchor)
  }
  function processText(n1, n2, container, anchor) {
    const el = (n2.el = hostCreateText(n2.children))
    hostInsert(el, container, anchor)
  }
  function processComponent(n1, n2, container, parentComponent, anchor) {
    if (!n1) {
      // 1.挂载组件
      mountComponent(n2, container, parentComponent, anchor)
    } else {
      // 2.更新组件
      updateComponent(n1, n2)
    }
  }
  function mountComponent(n2, container, parentComponent, anchor) {
    // 1.创建组件实例,保存于虚拟节点,用于后续`diff`获取组件实例
    const instance = (n2.component = createComponentInstance(
      n2,
      parentComponent
    ))
    // 2.初始化组件状态
    setupComponent(instance)
    // 3.获取状态之后,创建组件代理对象,访问组件实例
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers)
    // 4.挂载组件
    setupRenderEffect(instance, container, anchor)
  }
  function updateComponent(n1, n2) {
    debugger
    // 1.获取组件实例
    const instance = (n2.component = n1.component)
    if (shouldUpdateComponent(n1, n2)) {
      // 2.组件更新时保留对应信息
      instance.next = n2
      // 3.更新组件, 需要调用组件的`render`生成新的虚拟节点进行`diff`
      instance.update()
    } else {
      // 4.当父组件仅更新自己内容,没有影响子组件的时候,无需触发组件更新逻辑,子组件自身处理更新逻辑即可
      n2.el = n1.el
      n2.vnode = n2
    }
  }
  function setupRenderEffect(instance, container, anchor) {
    function componentUpdateFn() {
      // @Tips: 第一次加载
      if (!instance.isMounted) {
        // 1.调用渲染函数,获取组件虚拟节点树,绑定`this`为代理对象,实现`render`函数中访问组件状态
        const subTree = instance.render.call(instance.proxy, h)
        // 2.继续`patch`,递归挂载组件
        patch(null, subTree, container, instance, anchor)
        // 3.组件实例绑定`el`用于后续`patch`精准更新
        instance.vnode.el = subTree.el
        // 4.存放旧虚拟节点树,后续`patch`调用
        instance.subTree = subTree
        // 5.标识已挂载
        instance.isMounted = true
      }
      // @Tips: 更新
      else {
        // 0.组件更新逻辑
        debugger
        const { next: nextVNode, vnode: prevVNode } = instance
        if (nextVNode) {
          nextVNode.el = prevVNode.el
          updateComponentPreRender(instance, nextVNode)
        }
        // 1.获取到新的虚拟节点树
        const subTree = instance.render.call(instance.proxy, h)
        // 2.获取旧的虚拟节点树
        const prevSubTree = instance.subTree
        // 3.`patch`更新页面
        patch(prevSubTree, subTree, container, instance, anchor)
        // 4.对比完后新树变旧树
        instance.subTree = subTree
      }
    }
    // 保留组件更新函数,用于组件更新`diff`
    debugger
    instance.update = effect(componentUpdateFn, {
      // 同步执行`effect`太耗费性能,比如 for 循环一个 ref 100, 1000, 10000 次,什么逻辑都有可能出现
      // 一个组件内有太多响应式数据了,所以我们需要将组件更新函数,放到异步队列中,当同步内容计算完毕之后,
      // 在一次性将所有变更渲染到视图中,避免重复更新
      // 面试题:
      // nextTick的原理,以及缘由,因为组件更新为异步,所以在同步代码计算完毕之后,视图和组件实例还没同步,
      // 在一次 tick 也就是微任务之后,才会同步完成,所以要操作最新的视图和实例,需要 `nextTick`
      shceduler: () => {
        console.log('update -- scheduler')
        queueJob(instance.update)
      }
    })
  }
  function processElement(n1, n2, container, parentComponent, anchor) {
    if (!n1) {
      // 1.挂载元素
      mountElement(n2, container, parentComponent, anchor)
    } else {
      // 2.更新元素
      patchElement(n1, n2, parentComponent, anchor)
    }
  }
  function mountElement(vnode, container, parentComponent, anchor) {
    // 1.创建真实元素,并挂载到`vnode`上,方便访问
    const el = (vnode.el = hostCreateElement(vnode.type))
    // 2.挂载属性
    const { props } = vnode
    for (const key in props) {
      const val = props[key]
      // 通过自定义渲染器处理属性
      hostPatchProp(el, key, null, val)
    }
    // 3.处理子组件
    const { children, shapeFlag } = vnode
    // 3.1 文本类,直接设置内容
    if (shapeFlag & 4 /* TEXT_CHILDREN */) {
      el.textContent = children
    }
    // 3.2 数组,则证明是元素或者组件
    else if (shapeFlag & 8 /* ARRAY_CHILDREN */) {
      mountChildren(vnode.children, el, parentComponent, anchor)
    }
    hostInsert(el, container, anchor)
  }
  function patchElement(n1, n2, parentComponent, anchor) {
    // 1.从旧节点中获取之前的`DOM`并在新节点中赋值,新节点下次就是旧的了
    const el = (n2.el = n1.el)
    console.log('旧虚拟节点:', n1)
    console.log('新虚拟节点:', n2)
    // 2.深度优先,先处理子节点
    patchChildren(n1, n2, el, parentComponent, anchor)
    // 3.更新属性
    const oldProps = n1.props || {}
    const newProps = n2.props || {}
    patchProps(el, oldProps, newProps)
  }
  function patchChildren(n1, n2, container, parentComponent, anchor) {
    // 1.获取旧节点的类型和子节点
    const { shapeFlag: prevShapeFlag, children: prevChildren } = n1
    // 2.获取新节点的类型和子节点
    const { shapeFlag: nextShapeFlag, children: nextChildren } = n2
    /**
     * 新旧节点类型枚举
     *  1.  新: 文本  ==> 旧: 文本  ==> 更新文本内容
     *                   旧: 数组  ==> 卸载节点替换为文本
     *
     *  2.  新: 数组  ==> 旧: 文本  ==> 清空文本挂载新节点
     *                   旧: 数组  ==> 双端对比算法
     *
     * 只有最后一种情况存在双端对比算法,上面情况都是比较好处理的情况
     */
    // 1.新节点是文本节点, => 卸载节点 || 替换文本
    if (nextShapeFlag & 4 /* TEXT_CHILDREN */) {
      if (prevShapeFlag & 8 /* ARRAY_CHILDREN */) {
        unmountChildren(n1.children)
      }
      if (prevChildren !== nextChildren) {
        hostSetElementText(container, nextChildren)
      }
    }
    // 2.新节点是数组节点, => 挂载新节点 || 双端对比
    else {
      if (prevShapeFlag & 4 /* TEXT_CHILDREN */) {
        hostSetElementText(container, '')
        mountChildren(nextChildren, container, parentComponent, anchor)
      } else {
        // 双端对比
        patchKeyedChildren(
          prevChildren,
          nextChildren,
          container,
          parentComponent,
          anchor
        )
      }
    }
  }
  function patchKeyedChildren(c1, c2, container, parentComponent, anchor) {
    // 设置对比游标
    const l2 = c2.length
    let i = 0
    let e1 = c1.length - 1
    let e2 = c2.length - 1
    // 创建辅助函数,判断两个节点是否同一个节点
    // 同一个节点就可以进行递归比较了,不是同一个,则不是删除就是创建
    function isSameNodeVNodeType(c1, c2) {
      return c1.type === c2.type && c1.key === c2.key
    }
    // (a b)
    // (a b) c
    // 1.从左侧向右开始对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]
      // 判断是否同一个节点,进行比较
      if (isSameNodeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, anchor)
      } else {
        break
      }
      i++
    }
    //   (b c)
    // e (b c)
    // 2.从右侧向左开始对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      // 判断是否同一个节点,进行比较
      if (isSameNodeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, anchor)
      } else {
        break
      }
      e1--
      e2--
    }
    // 3.新的比老得多
    // 3.1 后面新增
    // (a b)
    // (a b) c
    // i:2  e1:1  e2:2
    // 3.2 前面新增
    //   (a b)
    // c (a b)
    // i:0  e1:-1  e2:0
    if (i > e1) {
      if (i <= e2) {
        // 前面新增,需要提供锚点,为 a,
        // e2 + 1 < l2 说明 e2 在向左推进,右侧全部相同,取 e2 右侧第一个
        const nextPos = e2 + 1
        const anchor = nextPos < l2 ? c2[nextPos].el : null
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor)
          i++
        }
      }
    }
    // 4.老的比新的多
    // (a b) c d
    // (a b)
    // i:2  e1:3  e2:1
    //  c d (a b)
    //      (a b)
    // i:0  e1:1  e2:-1
    else if (i > e2) {
      while (i <= e1) {
        hostRemove(c1[i].el)
        i++
      }
    }
    // 5.中间乱序部分
    // [i ... e1 + 1]: a b [c d e] f g
    // [i ... e2 + 1]: a b [e d c h] f g
    // i = 2, e1 = 4, e2 = 5
    else {
      // 重新记录两组节点的起点
      const s1 = i // prev starting index
      const s2 = i // next starting index
      // 5.1 创建新节点的索引映射表
      //     便于旧节点遍历时,判断是否存在于新节点
      const keyToNewIndexMap = new Map()
      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i]
        if (nextChild.key != null) {
          keyToNewIndexMap.set(nextChild.key, i)
        }
      }
      // 5.2 遍历旧节点,判断在新节点中是否存在,做特定处理
      let patched = 0 // 旧节点已处理个数
      const toBePatched = e2 - s2 + 1 // 新节点需要处理总数量
      // 创建新节点对旧节点位置映射,用于判断节点是否需要移动
      // 并且使用最长递增子序列,优化移动逻辑,没有移动的节点,下标是连续的
      // a,b,(c,d,e),f,g
      // a,b,(e,c,d),f,g
      // c d 无需移动，移动 e 即可
      // 节点是否移动,移动就需要计算最长递增子序列,如果没移动,则直接不需要计算了
      let moved = false
      let maxNewIndexSoFar = 0 //
      const newIndexToOldIndexMap = new Array(toBePatched)
      // 初始化 0,表示旧在新中都不存在
      for (let i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0
      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i]
        // 当新节点对比完了,剩下的都需要卸载
        // [i ... e1 + 1]: a b [c d h] f g
        // [i ... e2 + 1]: a b [d c] f g
        // d c 处理之后, h 是多的,需要卸载,无需后续比较,优化
        // patched >= toBePatched 说明处理节点数超过新节点数量,剩余的都是旧的多余的
        if (patched >= toBePatched) {
          hostRemove(prevChild.el)
          continue
        }
        // 获取旧节点在新节点的位置
        let newIndex
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key)
        } else {
          for (let j = s2; j <= e2; j++) {
            if (isSameNodeVNodeType(c1[i], c2[j])) {
              newIndex = j
              break
            }
          }
        }
        // newIndex 不存在,则说明旧节点在新节点中不存在
        if (newIndex === undefined) {
          hostRemove(c1[i].el)
        } else {
          // 是否移动位置
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex
          } else {
            moved = true
          }
          // 记录旧节点在新节点的下标映射,这里说明新旧节点都存在,需要进行递归比较
          // newIndex - s2 起点从0开始,但是要知道是新节点的第几个
          // i + 1 i有可能为0,不能为0,0表示没有映射关系,新节点中没有这个旧节点
          newIndexToOldIndexMap[newIndex - s2] = i + 1
          patch(prevChild, c2[newIndex], container, parentComponent, null)
          // 对比一个节点,新`VNode`中旧少一个需要对比的
          patched++
        }
      }
      // 获取最长递增子序列
      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : []
      let j = increasingNewIndexSequence.length - 1
      for (let i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = i + s2
        const nextChild = c2[nextIndex]
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null
        // 0 表示在旧节点遍历的时候,没找到,是需要新创建的
        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, parentComponent, anchor)
        }
        // 不为 0 则表示旧节点在新节点中存在, 判断是否需要移动位置
        else if (moved) {
          // 不在最长递增子序列中,说明,为了大局,他需要被移动
          // a,b,(c,d,e),f,g
          // a,b,(e,c,d),f,g
          // 最长子序列其实也就是连续的稳定的没动的节点,这里是 c d 他俩的兄弟关系没动,只需要移动 e
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            console.log('移动位置')
            hostInsert(nextChild.el, container, anchor)
          } else {
            j--
          }
        }
      }
    }
  }
  function patchProps(el, oldProps, newProps) {
    if (oldProps !== newProps) {
      // 1.比对新`vnode`更新属性
      for (const key in newProps) {
        const prevProp = oldProps[key]
        const nextProp = newProps[key]
        if (prevProp !== nextProp) {
          hostPatchProp(el, key, prevProp, nextProp)
        }
      }
      // 2.比对旧`vnode`判断是否有删除属性
      if (keys(oldProps).length) {
        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null)
          }
        }
      }
    }
  }
  // 挂载全部子组件
  function mountChildren(children, el, parentComponent, anchor) {
    children.forEach(item => {
      patch(null, item, el, parentComponent, anchor)
    })
  }
  // 卸载全部子节点
  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      hostRemove(children[i].el)
    }
  }
  return {
    createApp: createAppAPI(render)
  }
}
function updateComponentPreRender(instance, nextVNode) {
  // 1.更新虚拟节点为新节点
  instance.vnode = nextVNode
  // 2.获取最新的props
  instance.props = nextVNode.props
  // 3.重置`next`
  instance.next = null
}
// https://en.wikipedia.org/wiki/Longest_increasing_subsequence
function getSequence(arr) {
  const p = arr.slice()
  const result = [0]
  let i, j, u, v, c
  const len = arr.length
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      j = result[result.length - 1]
      if (arr[j] < arrI) {
        p[i] = j
        result.push(i)
        continue
      }
      u = 0
      v = result.length - 1
      while (u < v) {
        c = (u + v) >> 1
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        result[u] = i
      }
    }
  }
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}

function renderSlot(slots, key, props) {
  const slot = slots[key]
  // 到时候加上开发环境的判定
  if (!slot || typeof slot !== 'function') {
    // 没有对应插槽的时候,返回空,`patch`的时候,就不知道类型,就啥也没做了
    console.warn('There is no current slot')
  }
  if (slot && typeof slot === 'function') {
    return createVNode(Fragment, {}, slot(props))
  }
  return {}
}

/**
 * @description 向子孙组件注入状态
 */
function provide(key, value) {
  // 1.获取当前组件实例
  const currentInstance = getCurrentInstance()
  if (currentInstance) {
    // 2.获取组件`provides`
    let { provides } = currentInstance
    const parentProvides = currentInstance.parent.provides
    // 3.通过原型链查找,达到链式查询的功能,初始化的时候绑定原型
    // 创建组件实例的时候,默认是指向父级的,这个时候如果需要创建`provide`,则会绑定一次原型
    if (provides === parentProvides) {
      // 创建一个空对象并将对象__proto__指向目标对象
      provides = currentInstance.provides = Object.create(parentProvides)
    }
    provides[key] = value
  }
}
/**
 * @description 获取祖先组件提供的状态
 */
function inject(key, defaultValue) {
  // 1.获取当前组件实例
  const currentInstance = getCurrentInstance()
  // 2.`value`在祖先组件的`provides`上面
  if (currentInstance) {
    const praentProvides = currentInstance.parent.provides
    // 判断是否存在当前`key`,如果没有,则判断是否采用默认值
    if (key in praentProvides) {
      return praentProvides[key]
    } else if (defaultValue) {
      if (typeof defaultValue === 'function') {
        return defaultValue()
      }
      return defaultValue
    }
  }
}

function h(type, props, children) {
  return createVNode(type, props, children)
}

function createElement(type) {
  return document.createElement(type)
}
function createTextNode(text) {
  return document.createTextNode(text)
}
function setElementText(el, text) {
  el.textContent = text
}
function patchProp(el, key, prevProp, nextProp) {
  // 2.1 事件
  if (isOn(key)) {
    const event = key.slice(2).toLowerCase()
    el.addEventListener(event, nextProp)
  }
  // 2.2 属性
  else {
    if (!nextProp) {
      el.removeAttribute(key)
    } else {
      el.setAttribute(key, nextProp)
    }
  }
}
function insert(child, parent, anchor = null) {
  parent.insertBefore(child, anchor)
}
function remove(el) {
  const parent = el.parentNode
  if (parent) {
    parent.removeChild(el)
  }
}
const renderer = createRenderer({
  createElement,
  setElementText,
  createTextNode,
  patchProp,
  insert,
  remove
})
// 暴露 `DOM` 的操作 `API` 的渲染器
function createApp(...args) {
  return renderer.createApp(...args)
}

exports.createApp = createApp
exports.createRenderer = createRenderer
exports.createTextVnode = createTextVnode
exports.getCurrentInstance = getCurrentInstance
exports.h = h
exports.inject = inject
exports.nextTick = nextTick
exports.provide = provide
exports.reactive = reactive
exports.ref = ref
exports.renderSlot = renderSlot
