import { CREATE_ELEMENT_VNODE } from './../runtime-helper';
import type { TransformContext } from './../transform';
import type { RootNode, NodeUnion, ElementNode } from './../parse';
import { createVNodeCall, NodeTypes } from '../ast';

export function transformElement(node: RootNode | NodeUnion, context: TransformContext) {
  return () => {
    if (node.type === NodeTypes.ELEMENT) {
      // 对`Element`进行细致处理的中间层逻辑
      const vnodeTag = `'${node.tag}'`
      // 处理 `props`
      // vnode.props = 处理props
      const vnodeProps = node.props
      const vnodeChildren = node.children

      node.codegenNode = createVNodeCall(vnodeTag, vnodeProps, vnodeChildren, context)
    }
  }
}
