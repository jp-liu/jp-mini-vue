import { NodeTypes } from './ast'
import type { ElementNode, NodeUnion, RootNode } from './parse'
import { TO_DISPLAY_STRING } from './runtime-helper'

type NodeTransform = ((
  node: RootNode | NodeUnion,
  // eslint-disable-next-line no-use-before-define
  context: TransformContext
) => void | (() => void))

export interface TransformContext {
  root: RootNode
  nodeTransforms: NodeTransform[]
  helpers: Set<symbol>
  helper(key: symbol): void
}

interface TransformOptions {
  nodeTransforms?: NodeTransform[]
}

export function transform(root: RootNode, options: TransformOptions = {}) {
  // 1.创建上下文保存关键信息
  const context = createTransformContext(root, options)
  // 2.`DFS`遍历每个节点
  traverseNode(root, context)
  // 3.确定第一个节点
  createRootCodegenNode(root, context)
  // 4.确定当前`AST`中需要的`helpers`
  root.helpers.push(...context.helpers)
}

function createTransformContext(root: RootNode, options: TransformOptions) {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
    helpers: new Set<symbol>(),
    helper(key: symbol) {
      context.helpers.add(key)
    },
  }
  return context
}

function traverseNode(
  node: RootNode | NodeUnion,
  context: TransformContext,
) {
  const { nodeTransforms } = context
  const exitFns: (() => void)[] = []
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i]
    const onExit = transform(node, context)
    onExit && exitFns.push(onExit)
  }

  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING)
      break
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(node, context)
      break
  }
  let i = exitFns.length
  while (i--)
    exitFns[i]()
}

function traverseChildren(node: RootNode | ElementNode, context: TransformContext) {
  const children = node?.children
  if (children) {
    for (let i = 0; i < children.length; i++) {
      const n = children[i]
      traverseNode(n, context)
    }
  }
}

function createRootCodegenNode(root: RootNode) {
  const { children } = root
  const firstChild = children[0]
  if (firstChild) {
    if (firstChild.type === NodeTypes.ELEMENT)
      root.codegenNode = firstChild.codegenNode
    else
      root.codegenNode = firstChild
  }
}
