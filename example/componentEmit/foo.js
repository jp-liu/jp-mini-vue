import { h } from '../../lib/jp-liu-mini-vue.esm.js'

export const Foo = {
  setup(props, { emit }) {
    // 通过`setup`的第二个参数,获取`emit`
    const emitAdd = () => {
      console.log('emitAdd')
      emit('add')
      emit('add-foo')
    }

    return {
      emitAdd
    }
  },
  render() {
    const btn = h(
      'button',
      {
        onClick: this.emitAdd
      },
      'emitAdd'
    )
    return h('div', { id: 'arr' }, [btn])
  }
}
