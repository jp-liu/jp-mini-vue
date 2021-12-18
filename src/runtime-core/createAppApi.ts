import { createVNode } from './vnode'

export function createAppAPI(render) {
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
