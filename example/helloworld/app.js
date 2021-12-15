import { h } from '../../lib/jp-liu-mini-vue.esm.js'

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
    return h('div', { id: 'wahaha', class: 'red' }, this.msg)
  },

  setup() {
    return { msg: 'mini-vue' }
  }
}
