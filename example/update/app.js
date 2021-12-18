import { ref } from '../../lib/jp-liu-mini-vue.esm.js'

export const App = {
  name: 'App',
  setup() {
    const count = ref(0)

    const increment = () => {
      count.value++
    }

    const props = ref({
      foo: 'foo',
      bar: 'bar'
    })
    const newBtnClick = () => {
      props.value.foo = 'new-foo'
    }
    const nullBtnClick = () => {
      props.value.foo = null
    }
    const delBtnClick = () => {
      props.value = {
        foo: 'foo'
      }
    }

    return {
      count,
      props,
      increment,
      newBtnClick,
      nullBtnClick,
      delBtnClick
    }
  },
  render(h) {
    const btn1 = h(
      'button',
      {
        onClick: this.increment
      },
      'count+1'
    )
    const btn2 = h(
      'button',
      {
        onClick: this.newBtnClick
      },
      '变更属性为新值'
    )
    const btn3 = h(
      'button',
      {
        onClick: this.nullBtnClick
      },
      '变更属性为 undefined | null'
    )
    const btn4 = h(
      'button',
      {
        onClick: this.delBtnClick
      },
      '删除旧属性'
    )

    const view = h('div', {}, `更新视图${this.count}`)
    return h('div', { id: 'root', foo: this.props.foo, bar: this.props.bar }, [
      view,
      btn1,
      btn2,
      btn3,
      btn4
    ])
  }
}
