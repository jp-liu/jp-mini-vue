import { hasOwn } from '../shared/index'

/**
 * @description 组件实例属性访问符
 */
const publicPropertiesMap = {
  $el: i => i.vnode.el
}

/**
 * @description 代理组件实例状态
 */
export const PublicInstanceProxyHandlers = {
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
      return publicGetter()
    }
  }
}
