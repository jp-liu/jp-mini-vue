import { h, renderSlot } from '../../lib/jp-liu-mini-vue.esm.js'

export const Foo = {
  setup(props, { emit }) {},
  render() {
    const foo = h('p', {}, 'slots=>')
    return h('div', { id: 'arr' }, [
      renderSlot(this.$slots, 'default', { age: 12 }),
      renderSlot(this.$slots, 'header'),
      foo,
      renderSlot(this.$slots, 'footer')
    ])
  }
}
