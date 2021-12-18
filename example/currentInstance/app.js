import { h, getCurrentInstance } from '../../lib/jp-liu-mini-vue.esm.js'

import { Foo } from './foo.js'

// 实现浏览器控制台调试
window.self = null
export const App = {
  name: 'App',
  // 暂时没有编译能力,使用手动的 `render` 函数
  render() {
    window.self = this

    return h('div', {}, [h(Foo)])
  },

  setup() {
    const instance = getCurrentInstance()
    console.log('App:', instance)

    return { msg: 'mini-vue' }
  }
}
