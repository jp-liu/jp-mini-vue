import { createRenderer } from '../runtime-core'
import { isOn } from '../shared'

function createElement(type) {
  return document.createElement(type)
}
function createTextNode(text: string) {
  return document.createTextNode(text)
}

function patchProp(el, key, prevProp, nextProp) {
  // 2.1 事件
  if (isOn(key)) {
    const event = key.slice(2).toLowerCase()
    el.addEventListener(event, nextProp)
  }
  // 2.2 属性
  else {
    if (!nextProp) {
      el.removeAttribute(key, nextProp)
    } else {
      el.setAttribute(key, nextProp)
    }
  }
}

function insert(el, parent) {
  parent.append(el)
}

const renderer: any = createRenderer({
  createElement,
  createTextNode,
  patchProp,
  insert
})

export * from '../runtime-core'
export function createApp(...args) {
  return renderer.createApp(...args)
}
