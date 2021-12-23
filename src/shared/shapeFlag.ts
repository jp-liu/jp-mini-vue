/**
 * 虚拟节点类型标识符
 * 每一个二进制位,代表一种类型
 */
export const enum ShapeFlag {
  ELEMENT = 1, // 0001 元素
  STATEFUL_COMPONENT = 1 << 1, // 0010 组件
  TEXT_CHILDREN = 1 << 2, // 0100 子节点是文本
  ARRAY_CHILDREN = 1 << 3, // 1000 子节点是数组
  SLOT_CHILDREN = 1 << 4 // 1 0000 组件使用了插槽
}
