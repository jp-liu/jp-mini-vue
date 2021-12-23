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
 * @param options 元素节点处理提供的接口
 */
export function createRenderer(options) {
  // 提供自定义渲染接口
  // 起别名
  const {
    createElement: hostCreateElement,
    createTextNode: hostCreateText,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText
  } = options

  function render(vnode, rootContainer: HTMLElement) {
    patch(null, vnode, rootContainer, null, null)
  }

  function patch(n1, n2, container, parentComponent, anchor) {
    const { type, shapeFlag } = n2

    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor)
        break
      case Text:
        processText(n1, n2, container, anchor)
        break

      default:
        // 1.判断类型,进行不同操作
        if (shapeFlag & ShapeFlag.ELEMENT) {
          // 1.1 元素
          processElement(n1, n2, container, parentComponent, anchor)
        } else if (shapeFlag & ShapeFlag.STATEFUL_COMPONENT) {
          // 1.2 组件
          processComponent(n1, n2, container, parentComponent, anchor)
        }
        break
    }
  }

  function processFragment(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    mountChildren(n2.children, container, parentComponent, anchor)
  }

  function processText(n1, n2: any, container: any, anchor) {
    const el = (n2.el = hostCreateText(n2.children))
    hostInsert(el, container, anchor)
  }

  function processComponent(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    // 1.挂载组件
    mountComponent(n2, container, parentComponent, anchor)
  }

  function mountComponent(n2: any, container: any, parentComponent, anchor) {
    // 1.创建组件实例
    const instance = createComponentInstance(n2, parentComponent)

    // 2.初始化组件状态
    setupComponent(instance)

    // 3.获取状态之后,创建组件代理对象,访问组件实例
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers)

    // 4.挂载组件
    setupRenderEffect(instance, container, anchor)
  }

  function setupRenderEffect(instance, container, anchor) {
    effect(() => {
      // @Tips: 第一次加载
      if (!instance.isMounted) {
        // 1.调用渲染函数,获取组件虚拟节点树,绑定`this`为代理对象,实现`render`函数中访问组件状态
        const subTree = instance.render.call(instance.proxy, h)

        // 2.继续`patch`,递归挂载组件
        patch(null, subTree, container, instance, anchor)

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
        patch(prevSubTree, subTree, container, instance, anchor)

        // 4.对比完后新树变旧树
        instance.subTree = subTree
      }
    })
  }

  function processElement(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    if (!n1) {
      // 1.挂载元素
      mountElement(n2, container, parentComponent, anchor)
    } else {
      // 2.更新元素
      patchElement(n1, n2, parentComponent, anchor)
    }
  }

  function mountElement(vnode: any, container: any, parentComponent, anchor) {
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
      mountChildren(vnode.children, el, parentComponent, anchor)
    }

    hostInsert(el, container, anchor)
  }

  function patchElement(n1, n2, parentComponent, anchor) {
    // 1.从旧节点中获取之前的`DOM`并在新节点中赋值,新节点下次就是旧的了
    const el = (n2.el = n1.el)
    console.log('旧虚拟节点:', n1)
    console.log('新虚拟节点:', n2)
    // 2.深度优先,先处理子节点
    patchChildren(n1, n2, el, parentComponent, anchor)

    // 3.更新属性
    const oldProps = n1.props || {}
    const newProps = n2.props || {}
    patchProps(el, oldProps, newProps)
  }

  function patchChildren(n1, n2, container, parentComponent, anchor) {
    // 1.获取旧节点的类型和子节点
    const { shapeFlag: prevShapeFlag, children: prevChildren } = n1
    // 2.获取新节点的类型和子节点
    const { shapeFlag: nextShapeFlag, children: nextChildren } = n2

    /**
     * 新旧节点类型枚举
     *  1.  新: 文本  ==> 旧: 文本  ==> 更新文本内容
     *                   旧: 数组  ==> 卸载节点替换为文本
     *
     *  2.  新: 数组  ==> 旧: 文本  ==> 清空文本挂载新节点
     *                   旧: 数组  ==> 双端对比算法
     *
     * 只有最后一种情况存在双端对比算法,上面情况都是比较好处理的情况
     */
    // 1.新节点是文本节点, => 替换文本 || 写在节点
    if (nextShapeFlag & ShapeFlag.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlag.ARRAY_CHILDREN) {
        unmountChildren(n1.children)
      }
      if (prevChildren !== nextChildren) {
        hostSetElementText(container, nextChildren)
      }
    }
    // 2.新节点是数组节点, => 挂载新节点 || 双端对比
    else {
      if (prevShapeFlag & ShapeFlag.TEXT_CHILDREN) {
        hostSetElementText(container, '')
        mountChildren(nextChildren, container, parentComponent, anchor)
      } else {
        // 双端对比
        patchKeyedChildren(
          prevChildren,
          nextChildren,
          container,
          parentComponent,
          anchor
        )
      }
    }
  }

  function patchKeyedChildren(
    c1: any[],
    c2: any[],
    container,
    parentComponent,
    anchor
  ) {
    // 设置对比游标
    const l2 = c2.length
    let i = 0
    let e1 = c1.length - 1
    let e2 = c2.length - 1

    function isSameNodeVNodeType(c1, c2) {
      return c1.type === c2.type && c1.key === c2.key
    }

    // (a b)
    // (a b) c
    // 从左侧向右开始对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]
      // 判断是否同一个节点,进行比较
      if (isSameNodeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, anchor)
      } else {
        break
      }
      i++
    }

    //   (b c)
    // e (b c)
    // 从右侧向左开始对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      // 判断是否同一个节点,进行比较
      if (isSameNodeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, anchor)
      } else {
        break
      }
      e1--
      e2--
    }

    // 新的比老得多
    if (i > e1) {
      // 后面新增
      // (a b)     i:2  e1:1  e2:2
      // (a b) c
      // 前面新增
      //   (a b)   i:0  e1:-1  e2:0
      // c (a b)
      if (i <= e2) {
        // 前面新增,需要提供锚点,为 a,
        // e2 + 1 < l2 说明 e2 在向左推进,右侧全部相同,取 e2 右侧第一个
        const nextPos = e2 + 1
        const anchor = nextPos < l2 ? c2[nextPos].el : null
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor)
          i++
        }
      }
    }
    // 老的比新的多
    // (a b) c d    i:2  e1:3  e2:1
    // (a b)
    //  c d (a b)   i:0  e1:1  e2:-1
    //      (a b)
    else if (i > e2) {
      while (i <= e1) {
        hostRemove(c1[i].el)
        i++
      }
    }
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
  function mountChildren(children: any, el: any, parentComponent, anchor) {
    children.forEach(item => {
      patch(null, item, el, parentComponent, anchor)
    })
  }

  // 卸载全部子节点
  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      hostRemove(children[i].el)
    }
  }

  return {
    createApp: createAppAPI(render)
  }
}
