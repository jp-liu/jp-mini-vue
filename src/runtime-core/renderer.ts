import { createComponentInstance, setupComponent } from './component'

export function render(vnode, rootContainer: HTMLElement | string) {
  patch(vnode, rootContainer)
}

function patch(vnode, container) {
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
  // 1.创建真实元素
  const el = document.createElement(vnode.type)

  // 2.挂载属性
  const { props } = vnode
  for (const key in props) {
    el.setAttribute(key, props[key])
  }

  // 3.处理子组件
  const { children } = vnode
  // 3.1 文本类,直接设置内容
  if (typeof children === 'string') {
    el.textContent = children
  }
  // 3.2 数组,则证明是元素或者组件
  else if (Array.isArray(children)) {
    mountChildren(children, el)
  }

  container.append(el)
}

// 挂载全部子组件
function mountChildren(children: any[], el: any) {
  children.forEach(item => {
    patch(item, el)
  })
}
