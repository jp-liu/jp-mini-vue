import { isOn } from '../shared/index'
import { ShapeFlag } from '../shared/shapeFlag'
import { createComponentInstance, setupComponent } from './component'
import { PublicInstanceProxyHandlers } from './componentPublicInstance'

export function render(vnode, rootContainer: HTMLElement | string) {
  patch(vnode, rootContainer)
}

function patch(vnode, container) {
  const { shapeFlag } = vnode
  // 1.判断类型,进行不同操作
  if (shapeFlag & ShapeFlag.ELEMENT) {
    // 1.1 元素
    processElement(vnode, container)
  } else if (shapeFlag & ShapeFlag.STATEFUL_COMPONENT) {
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

  // 3.获取状态之后,创建组件代理对象,访问组件实例
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers)

  // 4.挂载组件
  setupRenderEffect(instance, container)
}

function setupRenderEffect(instance, container) {
  // 1.调用渲染函数,获取组件虚拟节点树,绑定`this`为代理对象,实现`render`函数中访问组件状态
  const subTree = instance.render.call(instance.proxy)

  // 2.继续`patch`,递归挂载组件
  patch(subTree, container)

  // 3.组件实例绑定`el`用于后续`patch`精准更新
  instance.vnode.el = subTree.el
}

function processElement(vnode: any, container: any) {
  // 1.挂载元素
  mountElement(vnode, container)
}

function mountElement(vnode: any, container: any) {
  // 1.创建真实元素,并挂载到`vnode`上,方便访问
  const el = (vnode.el = document.createElement(vnode.type))

  // 2.挂载属性
  const { props } = vnode

  for (const key in props) {
    const val = props[key]
    // 2.1 事件
    if (isOn(key)) {
      const event = key.slice(2).toLowerCase()
      el.addEventListener(event, val)
    }
    // 2.2 属性
    else {
      el.setAttribute(key, props[key])
    }
  }

  // 3.处理子组件
  const { children, shapeFlag } = vnode
  // 3.1 文本类,直接设置内容
  if (shapeFlag & ShapeFlag.TEXT_CHILDREN) {
    el.textContent = children
  }
  // 3.2 数组,则证明是元素或者组件
  else if (shapeFlag & ShapeFlag.ARRAY_CHILDREN) {
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
