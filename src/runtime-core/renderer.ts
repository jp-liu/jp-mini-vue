import { createComponentInstance, setupComponent } from './component'

export function render(vnode, rootContainer: HTMLElement | string) {
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

function processElement(vnode: any, container: any) {
  // 1.挂载元素
  mountElement(vnode, container)
}
function mountElement(vnode: any, container: any) {
  const el = document.createElement(vnode.type)

  const { children } = vnode
  el.textContent = children

  const { props } = vnode
  for (const key in props) {
    el.setAttribute(key, props[key])
  }

  container.append(el)
}
