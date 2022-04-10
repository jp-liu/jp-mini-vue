import type { TransformContext } from './../transform';
import type { RootNode, NodeUnion, CompoundNode, TextNode, Interpolation } from './../parse';
import { NodeTypes } from '../ast';
import { isText } from '../utils';


export function transformText(node: RootNode | NodeUnion, context: TransformContext) {
  return () => {
    if (node.type === NodeTypes.ELEMENT) {
      const { children } = node

      let compoundNode: CompoundNode | undefined
      for (let i = 0; i < children.length; i++) {
        const child = children[i]

        if (isText(child)) {
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j] as TextNode | Interpolation
            if (isText(next)) {
              if (!compoundNode) {
                compoundNode = children[i] = {
                  type: NodeTypes.COMPOUND_EXPRESSION,
                  children: [child as TextNode | Interpolation]
                }
              }
              compoundNode.children.push(' + ')
              compoundNode.children.push(next)
              children.splice(j, 1)
              j--
            } else {
              compoundNode = undefined
              break
            }
          }
        }
      }
    }
  }
}
