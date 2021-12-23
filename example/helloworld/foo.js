import { createTextVnode, h } from '../../lib/jp-liu-mini-vue.esm.js'

export const Foo = {
  setup(props) {
    console.log(props)
    props.count++
    return {}
  },
  render() {
    return h('div', { id: 'arr' }, [
      createTextVnode('foo:' + this.count),
      createTextVnode('happy path')
    ])
  }
}
