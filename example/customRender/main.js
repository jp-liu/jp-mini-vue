import { createRenderer } from '../../lib/jp-liu-mini-vue.esm.js'
import { App } from './app.js'

// eslint-disable-next-line no-undef
const game = new PIXI.Application({
  with: 500,
  height: 500
})

// 将画板添加到浏览器
document.body.append(game.view)

const renderer = createRenderer({
  createElement(type) {
    // 自定义的类型,根据自定义类型做不同的工作
    if (type === 'square') {
      // eslint-disable-next-line no-undef
      const square = new PIXI.Graphics()
      square.beginFill(0xff0000) // 开始填充
      square.drawRect(0, 0, 100, 100)
      square.endFill()
      return square
    }
  },
  patchProp(el, key, value) {
    el[key] = value
  },
  insert(el, parent) {
    parent.addChild(el)
  }
})

const app = renderer.createApp(App).mount(game.stage)
