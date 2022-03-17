import { NodeUnion, RootNode } from './parse'

type TransformContext = ReturnType<typeof createTransformContext>

interface TransformOptions {
  nodeTransforms?: ((
    node: RootNode | NodeUnion,
    context: TransformContext
  ) => void)[]
}

export function transform(root: RootNode, options: TransformOptions = {}) {
  // 1.创建上下文保存关键信息
  const context = createTransformContext(root, options)
  // 2.`DFS`遍历每个节点
  traverseNode(root, context)
}

function createTransformContext(root: RootNode, options: TransformOptions) {
  const context = {
    root,
    nodeTransform: options.nodeTransforms || []
  }
  return context
}

function traverseNode(
  node: RootNode | NodeUnion,
  context: TransformContext
): void {
  const { nodeTransform } = context
  nodeTransform.forEach(fn => fn(node, context))

  traverseChildren(node, context)
}

function traverseChildren(node: any, context: TransformContext) {
  const children = node?.children
  if (children) {
    for (let i = 0; i < children.length; i++) {
      const n = children[i]
      traverseNode(n, context)
    }
  }
}
