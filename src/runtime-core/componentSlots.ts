import { ShapeFlag } from '../shared/shapeFlag'

export function initSlots(instance, children) {
  const { shapeFlag } = instance.vnode

  if (shapeFlag & ShapeFlag.SLOT_CHILDREN) {
    // 插槽是需要渲染到组件的子节点,作为子节点,我们的实现,两种情况
    //  - 只支持字符串,直接渲染
    //  - 数组,进行每个元素的判定执行后一步
    // 提供的插槽是一个虚拟节点,所以需要作为数组,进行判定
    normalizeObjectSlots(children, instance.slots)
  }
}

function normalizeObjectSlots(children, slots) {
  for (const slot in children) {
    const value = children[slot] // 对应的函数定义
    // 1.调用`value`获取虚拟节点类型,进行判定
    // 2.保留函数调用,执行插槽时,才能传入参数
    slots[slot] = props => normalizeValue(value(props))
  }
}

function normalizeValue(value) {
  return Array.isArray(value) ? value : [value]
}
