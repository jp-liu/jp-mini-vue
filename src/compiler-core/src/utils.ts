import { NodeTypes } from "./ast";
import type { NodeUnion, RootNode } from "./parse";

export function isText(node: RootNode | NodeUnion) {
  return node.type === NodeTypes.TEXT || node.type === NodeTypes.INTERPOLATION
}
