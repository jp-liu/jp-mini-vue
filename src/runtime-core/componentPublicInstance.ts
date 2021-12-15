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
