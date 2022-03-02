import { shallowReadonly } from '../reactivey/reactive'
import { proxyRefs } from '../reactivey/ref'
import { emit } from './componentEmit'
import { initProps } from './componentProps'
import { initSlots } from './componentSlots'

/**
 * 设置当前组件实例
 */
let currentInstance = null

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
    emit: () => {}
  }

  component.emit = emit

  return component
}

export function setupComponent(instance) {
  // TODO
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
      emit: instance.emit.bind(null, instance)
    })
    // 释放实例
    setCurrentInstance(null)
    handleSetupResult(instance, proxyRefs(setupResult))
  }
}

function handleSetupResult(instance, setupResult: any) {
  // 1.判断是`setup`给的渲染函数,还是各种状态
  if (typeof setupResult === 'object') {
    instance.setupState = setupResult
  }
  // TODO => 渲染函数的情况

  // 2.获取了组件的状态之后,进行最后一步处理
  finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
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

export function getCurrentInstance() {
  return currentInstance
}
