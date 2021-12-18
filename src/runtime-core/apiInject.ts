import { getCurrentInstance } from './component'

/**
 * @description 向子孙组件注入状态
 */
export function provide(key: string, value: any) {
  // 1.获取当前组件实例
  const currentInstance: any = getCurrentInstance()
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
export function inject(key: string, defaultValue) {
  // 1.获取当前组件实例
  const currentInstance: any = getCurrentInstance()

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
