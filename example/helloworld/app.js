import { h } from '../../lib/jp-liu-mini-vue.esm.js'

import { Foo } from './foo.js'

// 实现浏览器控制台调试
window.self = null
export const App = {
  // 暂时没有编译能力,使用手动的 `render` 函数
  render() {
    window.self = this
    // 1.最简单版本
    // return h('div', { id: 'wahaha', class: 'red' }, 'hello mini-vue')

    // 2.实现数组子节点渲染
    // return h('div', { id: 'wahaha', class: 'red' }, [
    //   h('span', { class: 'blue' }, 'hello'),
    //   h('span', { class: 'red' }, 'mini-vue')
    // ])

    // 3.实现访问组件状态
    // return h('div', { id: 'wahaha', class: 'red' }, this.msg)

    // 4.实现元素事件绑定
    // return h(
    //   'div',
    //   {
    //     id: 'wahaha',
    //     class: 'red',
    //     onClick() {
    //       console.log('click')
    //     },
    //     onMousedown() {
    //       console.log('mousedown')
    //     }
    //   },
    //   this.msg
    // )

    // 5.实现子组件渲染,组件`props`的访问渲染
    return h(
      'div',
      {
        id: 'wahaha'
      },
      [h('span', { class: 'blue' }, this.msg), h(Foo, { count: 1 })]
    )
  },

  setup() {
    return { msg: 'mini-vue' }
  }
}
