import { createComponentInstance, setupComponent } from './component'

export function render(vnode, rootContainer: HTMLElement | string) {
  patch(vnode, rootContainer)
}

function patch(vnode, container) {
  // 1.判断类型,进行不同操作
  // 1.1 组件
  processComponent(vnode, container)

  // 1.2 TODO 元素
}

function processComponent(vnode: any, container: any) {
  // 1.挂载组件
  mountComponent(vnode, container)
}

function mountComponent(vnode: any, container: any) {
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
