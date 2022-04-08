import { NodeTypes } from "./ast";
import { Interpolation, NodeUnion, RootNode, SimpleExpression, TextNode } from "./parse";
import { helperMapName, TO_DISPLAY_STRING } from "./runtime-helper";

interface GenerateOptions { }
interface GenerateContext {
  code: string,
  push(source: string): void,
  helper(key: symbol): string
}

export function generate(ast: RootNode, options: GenerateOptions = {}) {
  const context = createCodegenContext()
  const { push } = context

  genFunctionPreamble(ast, context);

  const args = ['_ctx', '_cache'];
  const signature = args.join(', ');
  const funName = 'render';

  push(`function ${funName}(${signature}){`)
  push('return ')
  genNode(ast.codegenNode!, context)
  push('}')
  return {
    code: context.code,
  }
}

function genFunctionPreamble(ast: RootNode, context: GenerateContext) {
  const { push } = context
  const VueBinding = 'Vue';
  const aliasHelper = (s: symbol) => `${helperMapName[s]}: _${helperMapName[s]}`;
  if (ast.helpers.length) {
    push(`const { ${ast.helpers.map(aliasHelper).join(', ')} } = ${VueBinding}`);
    push('\n');
  }
  push('return ');
}

function genNode(node: NodeUnion, context: GenerateContext) {
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(node, context);
      break;
    case NodeTypes.ELEMENT:
      // return genElement(node);
      return ''
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context);
      break;
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context)
      break;


  }
}

function createCodegenContext(): GenerateContext {
  const context = {
    code: '',
    push(source: string) {
      context.code += source;
    },
    helper(key: symbol) {
      return helperMapName[key]
    }
  }
  return context
}


function genText(node: TextNode, context: GenerateContext) {
  const { push } = context
  push(`'${node.content}'`);
}


function genInterpolation(node: Interpolation, context: GenerateContext) {
  const { push,helper  } = context
  push(`_${helper(TO_DISPLAY_STRING)}(`);
  genNode(node.content, context);
  push(')');
}

function genExpression(node: SimpleExpression, context: GenerateContext) {
  const { push } = context
  console.log(node);
  
  push(`${node.content}`)
}

