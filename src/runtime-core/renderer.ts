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

  // 提供给外部的启动渲染方法
  function render(vnode, rootContainer: HTMLElement) {
    // 渲染器入口，从这里开始递归处理节点
    patch(null, vnode, rootContainer, null, null)
  }

  /**
   * @description 比较新旧节点,进行创建和修改操作
   * @param n1 旧节点
   * @param n2 新节点
   * @param container 节点容器
   * @param parentComponent 父组件
   * @param anchor 节点插入的锚点
   */
  function patch(n1, n2, container, parentComponent, anchor) {
    const { type, shapeFlag } = n2

    switch (type) {
      // 分段节点(不需要容器的无根节点)
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor)
        break
      // 文本节点
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
    // 不需要父容器的切片,也就是再不用创建一个容器包裹当前内容,
    // 直接将内容添加到当前的容器内,就可以了
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
     *                    旧: 数组  ==> 卸载节点替换为文本
     *
     *  2.  新: 数组  ==> 旧: 文本  ==> 清空文本挂载新节点
     *                    旧: 数组  ==> 双端对比算法
     *
     * 只有最后一种情况存在双端对比算法,上面情况都是比较好处理的情况
     */
    // 1.新节点是文本节点, => 卸载节点 || 替换文本
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

    // 创建辅助函数,判断两个节点是否同一个节点
    // 同一个节点就可以进行递归比较了,不是同一个,则不是删除就是创建
    function isSameNodeVNodeType(c1, c2) {
      return c1.type === c2.type && c1.key === c2.key
    }

    // (a b)
    // (a b) c
    // 1.从左侧向右开始对比
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
    // 2.从右侧向左开始对比
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

    // 3.新的比老得多
    // 3.1 后面新增
    // (a b)
    // (a b) c
    // i:2  e1:1  e2:2
    // 3.2 前面新增
    //   (a b)
    // c (a b)
    // i:0  e1:-1  e2:0
    if (i > e1) {
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

    // 4.老的比新的多
    // (a b) c d
    // (a b)
    // i:2  e1:3  e2:1
    //  c d (a b)
    //      (a b)
    // i:0  e1:1  e2:-1
    else if (i > e2) {
      while (i <= e1) {
        hostRemove(c1[i].el)
        i++
      }
    }

    // 5.中间乱序部分
    // [i ... e1 + 1]: a b [c d e] f g
    // [i ... e2 + 1]: a b [e d c h] f g
    // i = 2, e1 = 4, e2 = 5
    else {
      // 重新记录两组节点的起点
      const s1 = i // prev starting index
      const s2 = i // next starting index

      // 5.1 创建新节点的索引映射表
      //     便于旧节点遍历时,判断是否存在于新节点
      const keyTonewIndexMap = new Map()
      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i]
        if (nextChild.key != null) {
          keyTonewIndexMap.set(nextChild.key, i)
        }
      }

      // 5.2 遍历旧节点,判断在新节点中是否存在,做特定处理
      let patched = 0 // 旧节点已处理个数
      const toBePatched = e2 - s2 + 1 // 新节点需要处理总数量

      // 创建新节点对旧节点位置映射,用于判断节点是否需要移动
      // 并且使用最长递增子序列,优化移动逻辑,没有移动的节点,下标是连续的
      // a,b,(c,d,e),f,g
      // a,b,(e,c,d),f,g
      // c d 无需移动，移动 e 即可
      // 节点是否移动,移动就需要计算最长递增子序列,如果没移动,则直接不需要计算了
      let moved = false
      let maxNewIndexSoFar = 0 //
      const newIndexToOldIndexMap = new Array(toBePatched)
      // 初始化 0,表示旧在新中都不存在
      for (let i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0

      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i]

        // 当新节点对比完了,剩下的都需要卸载
        // [i ... e1 + 1]: a b [c d h] f g
        // [i ... e2 + 1]: a b [d c] f g
        // d c 处理之后, h 是多的,需要卸载,无需后续比较,优化
        // patched >= toBePatched 说明处理节点数超过新节点数量,剩余的都是旧的多余的
        if (patched >= toBePatched) {
          hostRemove(prevChild.el)
          continue
        }

        // 获取旧节点在新节点的位置
        let newIndex
        if (prevChild.key != null) {
          newIndex = keyTonewIndexMap.get(prevChild.key)
        } else {
          for (let j = s2; j <= e2; j++) {
            if (isSameNodeVNodeType(c1[i], c2[j])) {
              newIndex = j
              break
            }
          }
        }

        // newIndex 不存在,则说明旧节点在新节点中不存在
        if (newIndex === undefined) {
          hostRemove(c1[i].el)
        } else {
          // 是否移动位置
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex
          } else {
            moved = true
          }

          // 记录旧节点在新节点的下标映射,这里说明新旧节点都存在,需要进行递归比较
          // newIndex - s2 起点从0开始,但是要知道是新节点的第几个
          // i + 1 i有可能为0,不能为0,0表示没有映射关系,新节点中没有这个旧节点
          newIndexToOldIndexMap[newIndex - s2] = i + 1

          patch(prevChild, c2[newIndex], container, parentComponent, null)
          // 对比一个节点,新`VNode`中旧少一个需要对比的
          patched++
        }
      }

      // 获取最长递增子序列
      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : []
      let j = increasingNewIndexSequence.length - 1
      for (let i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = i + s2
        const nextChild = c2[nextIndex]
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null

        // 0 表示在旧节点遍历的时候,没找到,是需要新创建的
        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, parentComponent, anchor)
        }
        // 不为 0 则表示旧节点在新节点中存在, 判断是否需要移动位置
        else if (moved) {
          // 不在最长递增子序列中,说明,为了大局,他需要被移动
          // a,b,(c,d,e),f,g
          // a,b,(e,c,d),f,g
          // 最长子序列其实也就是连续的稳定的没动的节点,这里是 c d 他俩的兄弟关系没动,只需要移动 e
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            console.log('移动位置')
            hostInsert(nextChild.el, container, anchor)
          } else {
            j--
          }
        }
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

// https://en.wikipedia.org/wiki/Longest_increasing_subsequence
function getSequence(arr: number[]): number[] {
  const p = arr.slice()
  const result = [0]
  let i, j, u, v, c
  const len = arr.length
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      j = result[result.length - 1]
      if (arr[j] < arrI) {
        p[i] = j
        result.push(i)
        continue
      }
      u = 0
      v = result.length - 1
      while (u < v) {
        c = (u + v) >> 1
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        result[u] = i
      }
    }
  }
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}
