import { ShapeFlag } from '../shared/shapeFlag'

export const Fragment = Symbol('Fragment')
export const Text = Symbol('Text')

/**
 * @description 创建虚拟节点
 * @param type 节点类型
 * @param props 节点属性
 * @param children 子节点
 */
export function createVNode(type, props?, children?) {
  const vnode = {
    type, // 节点类型
    props, // 属性
    children, // 子节点
    component: null, // 组件引用
    key: props && props.key, // diff使用的key
    shapeFlag: getShapeFlag(type), // 虚拟节点类型
    el: null // 真实`DOM`引用,精确的`DOM`更新
  }

  if (typeof children === 'string') {
    // 子组件是文字,则将当前节点标注为,元素+文字
    vnode.shapeFlag |= ShapeFlag.TEXT_CHILDREN
  } else if (Array.isArray(children)) {
    // 子组件是数组,则有可能是新组件,或者元素子节点为,元素+子元素
    vnode.shapeFlag |= ShapeFlag.ARRAY_CHILDREN
  }

  // 是否有插槽
  if (
    vnode.shapeFlag & ShapeFlag.STATEFUL_COMPONENT &&
    typeof children === 'object'
  ) {
    vnode.shapeFlag |= ShapeFlag.SLOT_CHILDREN
  }

  return vnode
}

export function createTextVnode(text: string) {
  return createVNode(Text, {}, text)
}

/**
 * @description 获取当前子节点的类型标识符
 * @param type 当前`vnode`的类型
 */
function getShapeFlag(type: any) {
  return typeof type === 'string'
    ? ShapeFlag.ELEMENT
    : ShapeFlag.STATEFUL_COMPONENT
}
