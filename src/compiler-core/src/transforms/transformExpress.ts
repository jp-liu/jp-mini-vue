import { RootNode, NodeUnion, SimpleExpression } from './../parse';
import { NodeTypes } from "../ast";

export function transformExpress(node: RootNode | NodeUnion) {
  if (node.type === NodeTypes.INTERPOLATION) {
    node.content = processExpression(node.content);
  }
}

function processExpression(node: SimpleExpression): SimpleExpression {
  node.content = `_ctx.${node.content}`
  return node
}

