# jp-mini-vue

> 实现一个 `mini-vue` 帮助自己理解 `vue3`,纯粹自己学习,希望大家也可以学到一些东西, 欢迎指正哦~

看看 `vue` 的架构实现 Package Dependencies

```
                                    +---------------------+
                                    |                     |
                                    |  @vue/compiler-sfc  |
                                    |                     |
                                    +-----+--------+------+
                                          |        |
                                          v        v
                      +---------------------+    +----------------------+
                      |                     |    |                      |
        +------------>|  @vue/compiler-dom  +--->|  @vue/compiler-core  |
        |             |                     |    |                      |
   +----+----+        +---------------------+    +----------------------+
   |         |
   |   vue   |
   |         |
   +----+----+        +---------------------+    +----------------------+    +-------------------+
        |             |                     |    |                      |    |                   |
        +------------>|  @vue/runtime-dom   +--->|  @vue/runtime-core   +--->|  @vue/reactivity  |
                      |                     |    |                      |    |                   |
                      +---------------------+    +----------------------+    +-------------------+
```

目前简版实现

```
                      +---------------------+
                      |                     |
        +------------>|  ./src/compiler     +  自己目前仅实现解析简单部分
        |             |                     |
   +----+----+        +---------------------+
   |   入口   |
  ./src/index.ts
   |         |
   +----+----+        +---------------------+    +----------------------+    +-------------------+
        |             |                     |    |                      |    |                   |
        +------------>| ./src/runtime-dom   +--->| ./src/runtime-core   +--->| ./src/reactivity  |
                      |                     |    |                      |    |                   |
                      +---------------------+    +----------------------+    +-------------------+
```

目前基本实现的模块有

1. 响应式系统: **[reactivity](./src/reactivey/reactive.ts)**

   对应笔记: [响应式系统](https://github.com/jp-liu/study-every-day/blob/main/src/vue/mini-vue/reactivity/index.md)

2. 核心运行时: **[runtime-core](./src/runtime-core/index.ts)**
   对应笔记: [核心运行时](https://github.com/jp-liu/study-every-day/blob/main/src/vue/mini-vue/runtime-core/index.md)

3. 浏览器 Dom 运行时: **[runtime-dom](./src/runtime-dom/index.ts)**

   这个是提供了浏览器的原生`API`

   ```ts
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
   // 暴露 `DOM` 的操作 `API` 的渲染器
   export function createApp(...args) {
     return renderer.createApp(...args)
   }
   ```

本版本的实现,目前就包括以上三个部分,项目打包入口

**[入口文件](./src/index.ts)**

后续方向,添加 `TS` 类型系统
