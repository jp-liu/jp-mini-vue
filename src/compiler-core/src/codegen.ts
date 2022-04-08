import { NodeTypes } from "./ast";
import { NodeUnion, RootNode } from "./parse";

interface GenerateOptions {}
interface GenerateContext {
  code: string,
  push(source: string): void
}

export function generate(ast: RootNode, options: GenerateOptions = {}) {
  const context = createCodegenContext()
  const { push } = context
  
  const args = ['_ctx', '_cache'];
  const signature = args.join(', ');
  const funName = 'render';
  push('return ')
  push(`function ${funName}(${signature}){`)
  push('return ')
  genNode(ast.codegenNode!, context)
  push('}')
  return {
    code: context.code,
  }
}

function genNode(node: NodeUnion, context: GenerateContext) {
  const { push } = context
  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      // return genInterpolation(node);
      return ''
      case NodeTypes.ELEMENT:
        // return genElement(node);
        return ''
    case NodeTypes.TEXT:
      return push(`'${node.content}'`);
  }
}

function createCodegenContext(): GenerateContext {
  const context = {
    code: '',
    push(source: string) {
      context.code += source;
    }
  }
  return context
}

