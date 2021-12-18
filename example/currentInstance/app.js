import { h, provide, inject } from '../../lib/jp-liu-mini-vue.esm.js'

const Provider = {
  name: 'Provider',
  setup() {
    provide('foo', 'fooVal')
    provide('bar', 'barVal')
  },
  render() {
    return h('div', {}, [h('p', {}, 'Provider'), h(ProviderTwo)])
  }
}

const ProviderTwo = {
  name: 'ProviderTwo',
  setup() {
    provide('foo', 'fooTwoVal')
    const foo = inject('foo')
    return {
      foo
    }
  },
  render() {
    return h('div', {}, [h('p', {}, 'ProviderTwo' + this.foo), h(Consumer)])
  }
}

const Consumer = {
  name: 'Consumer',
  setup() {
    const foo = inject('foo')
    const bar = inject('wahaha', '娃哈哈')
    const baz = inject('wahaha1', () => '???')

    return {
      foo,
      bar,
      baz
    }
  },
  render() {
    return h(
      'div',
      {},
      `Consumer: - ${this.foo} --> ${this.bar} --> ${this.baz}`
    )
  }
}

export const App = {
  name: 'App',
  setup() {},
  // 暂时没有编译能力,使用手动的 `render` 函数
  render() {
    window.self = this

    return h('div', {}, [h('div', {}, 'apiInject'), h(Provider)])
  }
}
