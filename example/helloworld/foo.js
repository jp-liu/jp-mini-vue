import { h } from '../../lib/jp-liu-mini-vue.esm.js'

export const Foo = {
  setup(props) {
    console.log(props)
    props.count++
  },
  render() {
    return h('div', { id: 'arr' }, 'foo:' + this.count)
  }
}
