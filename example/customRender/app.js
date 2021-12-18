export const App = {
  name: 'App',
  setup() {
    console.log('自定义渲染器示例')
    return {
      x: 100,
      y: 100
    }
  },
  render(h) {
    return h('square', { x: this.x, y: this.y })
  }
}
