import { h } from '../../lib/jp-liu-mini-vue.esm.js'

import { Foo } from './foo.js'

// 实现浏览器控制台调试
window.self = null
export const App = {
  // 暂时没有编译能力,使用手动的 `render` 函数
  render() {
    window.self = this
    // 1.实现子组件渲染,组件`props`的访问渲染
    return h(
      'div',
      {
        id: 'wahaha'
      },
      [
        h('span', { class: 'blue' }, this.msg),
        h(Foo, {
          onAdd() {
            console.log('onAdd', '娃哈哈')
          },
          onAddFoo() {
            console.log('onAddFoo', '娃哈哈')
          }
        })
      ]
    )
  },

  setup() {
    return { msg: 'mini-vue' }
  }
}
