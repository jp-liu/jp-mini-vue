import { NodeTypes } from '../src/ast'
import { baseParse } from '../src/parse'

describe('parse', () => {
  describe('parse Interpolation,解析小胡子语法', () => {
    test('simple interpolation', () => {
      // 1.判断是否 `{{` 如果是的话,则按照先小胡子语法解析
      // 2.获取语法内部变量名
      const ast = baseParse('{{message}}')

      // 3.抽象语法树,是一个树,根节点是自动生成,所有其他节点都是内部子节点
      const interpolation = ast.children[0]
      expect(interpolation).toStrictEqual({
        type: NodeTypes.INTERPOLATION,
        content: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'message'
        }
      })
    })
  })

  describe('parse element,解析元素节点', () => {
    test('simple div', () => {
      // <div></div>
      const ast = baseParse('<div></div>')
      const element = ast.children[0]
      expect(element).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: 'div'
      })
    })
  })

  describe('parse text,解析文本节点', () => {
    test('simple text', () => {
      // <div></div>
      const ast = baseParse('some text')
      const text = ast.children[0]
      expect(text).toStrictEqual({
        type: NodeTypes.TEXT,
        content: 'some text'
      })
    })

    test('element with interpolation', () => {
      const ast = baseParse('<div>{{ msg }}</div>')
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: 'div',
        children: [
          {
            type: NodeTypes.INTERPOLATION,
            content: {
              type: NodeTypes.SIMPLE_EXPRESSION,
              content: 'msg'
            }
          }
        ]
      })
    })

    // test('element with interpolation and text', () => {
    //   const ast = baseParse('<div>hi,{{ msg }}</div>')
    //   const element = ast.children[0]

    //   expect(element).toStrictEqual({
    //     type: NodeTypes.ELEMENT,
    //     tag: 'div',
    //     children: [
    //       {
    //         type: NodeTypes.TEXT,
    //         content: 'hi,'
    //       },
    //       {
    //         type: NodeTypes.INTERPOLATION,
    //         content: {
    //           type: NodeTypes.SIMPLE_EXPRESSION,
    //           content: 'msg'
    //         }
    //       }
    //     ]
    //   })
    // })
  })
})
