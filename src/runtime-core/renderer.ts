import { createAppAPI } from './createAppApi'
import { ShapeFlag } from '../shared/shapeFlag'
import { Fragment, Text } from './vnode'
import { createComponentInstance, setupComponent } from './component'
import { PublicInstanceProxyHandlers } from './componentPublicInstance'
import { h } from '.'
import { effect } from '../reactivey/effect'
import { keys } from '../shared'

/**
 * @description 通过外部定义创建渲染器,达到渲染不同平台元素
 * @param options 元素处理接口
 */
export function createRenderer(options) {
  // 提供自定义渲染接口
  // 起别名
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    createTextNode: hostCreateTextNode
  } = options

  function render(vnode, rootContainer: HTMLElement) {
    patch(null, vnode, rootContainer, null)
  }

  function patch(n1, n2, container, parentComponent) {
    const { type, shapeFlag } = n2

    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent)
        break
      case Text:
        processText(n1, n2, container)
        break

      default:
        // 1.判断类型,进行不同操作
        if (shapeFlag & ShapeFlag.ELEMENT) {
          // 1.1 元素
          processElement(n1, n2, container, parentComponent)
        } else if (shapeFlag & ShapeFlag.STATEFUL_COMPONENT) {
          // 1.2 组件
          processComponent(n1, n2, container, parentComponent)
        }
        break
    }
  }

  function processFragment(n1, n2: any, container: any, parentComponent) {
    mountChildren(n2, container, parentComponent)
  }

  function processText(n1, n2: any, container: any) {
    const el = (n2.el = hostCreateTextNode(n2.children))
    hostInsert(el, container)
  }

  function processComponent(n1, n2: any, container: any, parentComponent) {
    // 1.挂载组件
    mountComponent(n2, container, parentComponent)
  }

  function mountComponent(n2: any, container: any, parentComponent) {
    // 1.创建组件实例
    const instance = createComponentInstance(n2, parentComponent)

    // 2.初始化组件状态
    setupComponent(instance)

    // 3.获取状态之后,创建组件代理对象,访问组件实例
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers)

    // 4.挂载组件
    setupRenderEffect(instance, container)
  }

  function setupRenderEffect(instance, container) {
    effect(() => {
      // @Tips: 第一次加载
      if (!instance.isMounted) {
        // 1.调用渲染函数,获取组件虚拟节点树,绑定`this`为代理对象,实现`render`函数中访问组件状态
        const subTree = instance.render.call(instance.proxy, h)

        // 2.继续`patch`,递归挂载组件
        patch(null, subTree, container, instance)

        // 3.组件实例绑定`el`用于后续`patch`精准更新
        instance.vnode.el = subTree.el

        // 4.存放旧虚拟节点树,后续`patch`调用
        instance.subTree = subTree

        // 5.标识已挂载
        instance.isMounted = true
      }
      // @Tips: 更新
      else {
        // 1.获取到新的虚拟节点树
        const subTree = instance.render.call(instance.proxy, h)

        // 2.获取旧的虚拟节点树
        const prevSubTree = instance.subTree

        // 3.`patch`更新页面
        patch(prevSubTree, subTree, container, instance)

        // 4.对比完后新树变旧树
        instance.subTree = subTree
      }
    })
  }

  function processElement(n1, n2: any, container: any, parentComponent) {
    if (!n1) {
      // 1.挂载元素
      mountElement(n2, container, parentComponent)
    } else {
      // 2.更新元素
      patchElement(n1, n2)
    }
  }

  function mountElement(vnode: any, container: any, parentComponent) {
    // 1.创建真实元素,并挂载到`vnode`上,方便访问
    const el = (vnode.el = hostCreateElement(vnode.type))

    // 2.挂载属性
    const { props } = vnode

    for (const key in props) {
      const val = props[key]
      // 通过自定义渲染器处理属性
      hostPatchProp(el, key, null, val)
    }

    // 3.处理子组件
    const { children, shapeFlag } = vnode
    // 3.1 文本类,直接设置内容
    if (shapeFlag & ShapeFlag.TEXT_CHILDREN) {
      el.textContent = children
    }
    // 3.2 数组,则证明是元素或者组件
    else if (shapeFlag & ShapeFlag.ARRAY_CHILDREN) {
      mountChildren(vnode, el, parentComponent)
    }

    hostInsert(el, container)
  }

  function patchElement(n1, n2) {
    // 1.从旧节点中获取之前的`DOM`并在新节点中赋值,新节点下次就是旧的了
    const el = (n2.el = n1.el)
    console.log('旧虚拟节点:', n1)
    console.log('新虚拟节点:', n2)
    // TODO 更新数据,节点信息

    // 1.更新属性
    const oldProps = n1.props || {}
    const newProps = n2.props || {}
    patchProps(el, oldProps, newProps)
  }

  function patchProps(el, oldProps, newProps) {
    if (oldProps !== newProps) {
      // 1.比对新`vnode`更新属性
      for (const key in newProps) {
        const prevProp = oldProps[key]
        const nextProp = newProps[key]

        if (prevProp !== nextProp) {
          hostPatchProp(el, key, prevProp, nextProp)
        }
      }

      // 2.比对旧`vnode`判断是否有删除属性
      if (keys(oldProps).length) {
        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null)
          }
        }
      }
    }
  }

  // 挂载全部子组件
  function mountChildren(vnode: any, el: any, parentComponent) {
    vnode.children.forEach(item => {
      patch(null, item, el, parentComponent)
    })
  }

  return {
    createApp: createAppAPI(render)
  }
}
