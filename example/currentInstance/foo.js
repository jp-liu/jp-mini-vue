import { h, getCurrentInstance } from '../../lib/jp-liu-mini-vue.esm.js'

export const Foo = {
  name: 'Foo',
  setup() {
    const instance = getCurrentInstance()
    console.log('Foo:', instance)
  },
  render() {
    const foo = h('p', {}, 'slots=>')
    return h('div', { id: 'arr' }, [foo])
  }
}
