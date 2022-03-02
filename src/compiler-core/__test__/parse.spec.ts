import { NodeType } from '../src/ast'
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
        type: NodeType.INTERPOLATION,
        content: {
          type: NodeType.SIMPLE_EXPRESSION,
          content: 'message'
        }
      })
    })
  })
})
