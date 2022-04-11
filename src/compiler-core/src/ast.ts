import type { ElementProps, NodeChildren, NodeUnion } from './parse'
import { CREATE_ELEMENT_VNODE } from './runtime-helper'
import type { TransformContext } from './transform'

export const enum NodeTypes {
  ROOT,
  INTERPOLATION,
  SIMPLE_EXPRESSION,
  ELEMENT,
  TEXT,
  COMPOUND_EXPRESSION,
}

export function createVNodeCall(tag: string,
  props: ElementProps | null,
  children: NodeChildren,
  context: TransformContext,
): NodeUnion {
  context.helper(CREATE_ELEMENT_VNODE)

  return {
    type: NodeTypes.ELEMENT,
    tag,
    props,
    children,
  }
}
