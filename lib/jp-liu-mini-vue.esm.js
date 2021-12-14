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

function render(vnode, rootContainer) {
  patch(vnode, rootContainer)
}
function patch(vnode, container) {
  debugger
  // 1.判断类型,进行不同操作
  if (typeof vnode.type === 'string') {
    // 1.1 TODO 元素
    processElement(vnode, container)
  } else {
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
  // 3.挂载组件
  setupRenderEffect(instance, container)
}
function setupRenderEffect(instance, container) {
  // 1.调用渲染函数,获取组件虚拟节点树
  const subTree = instance.render()
  // 2.继续`patch`,递归挂载组件
  patch(subTree, container)
}
function processElement(vnode, container) {
  // 1.挂载元素
  mountElement(vnode, container)
}
function mountElement(vnode, container) {
  const el = document.createElement(vnode.type)
  const { children } = vnode
  el.textContent = children
  const { props } = vnode
  for (const key in props) {
    el.setAttribute(key, props[key])
  }
  container.append(el)
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
    children
  }
  return vnode
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

export { createApp, h }
