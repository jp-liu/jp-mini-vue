import { h } from '../../lib/jp-liu-mini-vue.esm.js'

import { Foo } from './foo.js'

// 实现浏览器控制台调试
window.self = null
export const App = {
  // 暂时没有编译能力,使用手动的 `render` 函数
  render() {
    window.self = this
    const app = h('div', {}, 'App')
    const foo1 = h(
      Foo,
      {},
      {
        default: () => h('p', {}, 'children')
      }
    )
    const foo2 = h(
      Foo,
      {},
      {
        default: ({ age }) => h('p', {}, 'default' + age),
        header: () => h('p', {}, 'header'),
        footer: () => h('p', {}, 'footer')
      }
    )

    return h('div', {}, [app, foo1, foo2])
  },

  setup() {
    return { msg: 'mini-vue' }
  }
}
