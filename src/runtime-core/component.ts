import { shallowReadonly } from '../reactivity/reactive'
import { proxyRefs } from '../reactivity/ref'
import { emit } from './componentEmit'
import { initProps } from './componentProps'
import { PublicInstanceProxyHandlers } from './componentPublicInstance'
import { initSlots } from './componentSlots'

/**
 * 设置当前组件实例
 */
let currentInstance = null

/**
 * 注入编译器
 */
let compiler
export function registerRuntimeComplier(_compiler) {
  compiler = _compiler
}

export function createComponentInstance(vnode, parent) {
  const component: any = {
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
    emit: () => {},
  }

  component.emit = emit

  return component
}

export function setupComponent(instance) {
  // 1.initProps
  initProps(instance, instance.vnode.props)
  // 2.initSlots
  initSlots(instance, instance.vnode.children)
  // 3.初始化组件状态
  setupStateFulComponent(instance)
}

function setupStateFulComponent(instance: any) {
  // 1.获取组件配置
  const Component = instance.type

  // 2.获取组件的`setup`
  const { setup } = Component

  // 3.获取配置返回状态
  if (setup) {
    // 设置全局实例对象,用于`getCurrentInstance`
    setCurrentInstance(instance)
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit.bind(null, instance),
    })
    // 释放实例
    setCurrentInstance(null)
    handleSetupResult(instance, proxyRefs(setupResult))
  }

  // 4.状态处理之后,创建组件代理对象,访问组件实例的状态信息
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers)
}

function handleSetupResult(instance, setupResult: any) {
  // 1.判断是`setup`给的渲染函数,还是各种状态
  if (typeof setupResult === 'object')
    instance.setupState = setupResult

  // TODO => 渲染函数的情况

  // 2.获取了组件的状态之后,进行最后一步处理
  finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
  const Component = instance.type

  // 1.判断是否给定`render`渲染函数
  //   - 给了,则用用户的
  //   - 没给,自己根据情况创建 => TODO
  if (Component.render)
    instance.render = Component.render
  else if (compiler && Component.template)
    instance.render = compiler(Component.template)

  // 到这里, 组件的状态,渲染函数已经全部获取到了,可以进行渲染了
}

function setCurrentInstance(instance) {
  currentInstance = instance
}

export function getCurrentInstance() {
  return currentInstance
}
