import { h } from '../../lib/jp-liu-mini-vue.esm.js'

export const App = {
  // 暂时没有编译能力,使用手动的 `render` 函数
  render() {
    // return h('div', { id: 'wahaha', class: 'red' }, 'hello mini-vue')
    return h('div', { id: 'wahaha', class: 'red' }, [
      h('span', { class: 'blue' }, 'hello'),
      h('span', { class: 'red' }, 'mini-vue')
    ])
  },

  setup() {
    return { msg: 'mini-vue' }
  }
}
