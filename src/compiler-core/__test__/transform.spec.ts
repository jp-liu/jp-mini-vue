import { baseParse } from '../src/parse'
import type { ElementNode, TextNode } from '../src/parse'
import { transform } from '../src/transform'
import { NodeTypes } from '../src/ast'

describe('transform for ast', () => {
  test('对文本节点进行处理,加上`mini-vue`', () => {
    const ast = baseParse('<div>hi,{{ message }}</div>')
    const plugin = node => {
      if (node.type === NodeTypes.TEXT) {
        node.content += 'mini-vue'
      }
    }
    transform(ast, {
      nodeTransforms: [plugin]
    })
    const textContent = (ast as any).children[0].children[0].content
    expect(textContent).toBe('hi,mini-vue')
  })
})
