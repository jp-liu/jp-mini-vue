import { camelize, toHandlerKey } from '../shared/index'

/**
 * @tips 1.`emit`的事件,其实触发的还是组件本身,只是方法定义,放在了父组件上
 * @tips 2.为什么要这样呢? 因为组件被创建和挂载,是在父组件递归执行的,可以再这个时候拿到父组件的状态
 * @tips 2.所以,我们通过将组件上发出的事件名,在父组件中获取函数定义,并执行
 */
export function emit(instance, event) {
  // 1.处理事件名称
  const handlerName = toHandlerKey(camelize(event))

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
