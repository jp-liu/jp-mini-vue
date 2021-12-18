import { createVNode } from '../vnode'

export function renderSlot(slots, key, props) {
  const slot = slots[key]

  // 到时候加上开发环境的判定
  if (!slot || typeof slot !== 'function') {
    // 没有对应插槽的时候,返回空,`patch`的时候,就不知道类型,就啥也没做了
    console.warn('There is no current slot')
  }

  if (slot && typeof slot === 'function') {
    return createVNode('div', {}, slot(props))
  }
  return {}
}
