import { createRenderer } from '../runtime-core'
import { isOn } from '../shared'

function createElement(type: string) {
  return document.createElement(type)
}

function createTextNode(text: string) {
  return document.createTextNode(text)
}

function setElementText(el: HTMLElement, text) {
  el.textContent = text
}

function patchProp(el: HTMLElement, key: string, prevProp, nextProp) {
  // 2.1 事件
  if (isOn(key)) {
    const event = key.slice(2).toLowerCase()
    el.addEventListener(event, nextProp)
  }
  // 2.2 属性
  else {
    if (!nextProp) {
      el.removeAttribute(key)
    } else {
      el.setAttribute(key, nextProp)
    }
  }
}

function insert(
  child: HTMLElement,
  parent: HTMLElement,
  anchor: Node | null = null
) {
  parent.insertBefore(child, anchor)
}

function remove(el: HTMLElement) {
  const parent = el.parentNode
  if (parent) {
    parent.removeChild(el)
  }
}

const renderer: any = createRenderer({
  createElement,
  setElementText,
  createTextNode,
  patchProp,
  insert,
  remove
})

export * from '../runtime-core'
export function createApp(...args) {
  return renderer.createApp(...args)
}
