'use strict'

Object.defineProperty(exports, '__esModule', { value: true })

function createComponentInstance(vnode) {
  const component = {
    type: vnode.type,
    vnode
  }
  return component
}
function setupComponent(instance) {
  // TODO
  // 1.initProps
  // 2.initSlots
  // 2.初始化组件状态
  setupStateFulComponent(instance)
}
function setupStateFulComponent(instance) {
  // 1.获取组件配置
  const Component = instance.type
  // 2.获取组件的`setup`
  const { setup } = Component
  // 3.获取配置返回状态
  if (setup) {
    const setupResult = setup()
    handleSetupResult(instance, setupResult)
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

/**
 * @description 组件实例属性访问符
 */
const publicPropertiesMap = {
  $el: i => i.vnode.el
}
/**
 * @description 代理组件实例状态
 */
const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    // 1.`setup`返回值对象,就是提供组件使用的状态
    if (key in instance.setupState) {
      return instance.setupState[key]
    }
    // 2.组件实例上的专有属性,$el/$data...
    const publicGetter = publicPropertiesMap[key]
    if (publicGetter) {
      return publicGetter()
    }
  }
}

function render(vnode, rootContainer) {
  patch(vnode, rootContainer)
}
function patch(vnode, container) {
  const { shapeFlag } = vnode
  // 1.判断类型,进行不同操作
  if (shapeFlag & 1 /* ELEMENT */) {
    // 1.1 元素
    processElement(vnode, container)
  } else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
    // 1.2 组件
    processComponent(vnode, container)
  }
}
function processComponent(vnode, container) {
  // 1.挂载组件
  mountComponent(vnode, container)
}
function mountComponent(vnode, container) {
  // 1.创建组件实例
  const instance = createComponentInstance(vnode)
  // 2.初始化组件状态
  setupComponent(instance)
  // 3.获取状态之后,创建组件代理对象,访问组件实例
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers)
  // 4.挂载组件
  setupRenderEffect(instance, container)
}
function setupRenderEffect(instance, container) {
  // 1.调用渲染函数,获取组件虚拟节点树,绑定`this`为代理对象,实现`render`函数中访问组件状态
  const subTree = instance.render.call(instance.proxy)
  // 2.继续`patch`,递归挂载组件
  patch(subTree, container)
  // 3.组件实例绑定`el`用于后续`patch`精准更新
  instance.vnode.el = subTree.el
}
function processElement(vnode, container) {
  // 1.挂载元素
  mountElement(vnode, container)
}
function mountElement(vnode, container) {
  // 1.创建真实元素,并挂载到`vnode`上,方便访问
  const el = (vnode.el = document.createElement(vnode.type))
  // 2.挂载属性
  const { props } = vnode
  for (const key in props) {
    el.setAttribute(key, props[key])
  }
  // 3.处理子组件
  const { children, shapeFlag } = vnode
  // 3.1 文本类,直接设置内容
  if (shapeFlag & 4 /* TEXT_CHILDREN */) {
    el.textContent = children
  }
  // 3.2 数组,则证明是元素或者组件
  else if (shapeFlag & 8 /* ARRAY_CHILDREN */) {
    mountChildren(children, el)
  }
  container.append(el)
}
// 挂载全部子组件
function mountChildren(children, el) {
  children.forEach(item => {
    patch(item, el)
  })
}

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
  }
  debugger
  if (typeof children === 'string') {
    // 子组件是文字,则将当前节点标注为,元素+文字
    vnode.shapeFlag |= 4 /* TEXT_CHILDREN */
  } else if (Array.isArray(children)) {
    // 子组件是数组,则有可能是新组件,或者元素子节点为,元素+子元素
    vnode.shapeFlag |= 8 /* ARRAY_CHILDREN */
  }
  return vnode
}
function getShapeFlag(type) {
  return typeof type === 'string' ? 1 /* ELEMENT */ : 2 /* STATEFUL_COMPONENT */
}

function createApp(rootComponent) {
  return {
    mount(rootContainer) {
      // 1.将组件或者`Dom`转换成为虚拟节点
      const vnode = createVNode(rootComponent)
      // 2.处理`vnode`
      render(vnode, rootContainer)
    }
  }
}

function h(type, props, children) {
  return createVNode(type, props, children)
}

exports.createApp = createApp
exports.h = h
