import { isString } from '../../shared'
import { NodeTypes } from './ast'
import type { CompoundNode, ElementNode, Interpolation, NodeUnion, RootNode, SimpleExpression, TextNode } from './parse'
import { CREATE_ELEMENT_VNODE, TO_DISPLAY_STRING, helperMapName } from './runtime-helper'

// interface GenerateOptions { }
interface GenerateContext {
  code: string
  push(source: string): void
  helper(key: symbol): string
}

export function generate(ast: RootNode) {
  const context = createGenerateContext()
  const { push } = context

  genFunctionPreamble(ast, context)

  const args = ['_ctx', '_cache']
  const signature = args.join(', ')
  const funName = 'render'

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

  const VueBinding = 'Vue'
  const aliasHelper = (s: symbol) => `${helperMapName[s]}: _${helperMapName[s]}`
  if (ast.helpers.length) {
    push(`const { ${ast.helpers.map(aliasHelper).join(', ')} } = ${VueBinding}`)
    push('\n')
  }
  push('return ')
}

function genNode(node: NodeUnion, context: GenerateContext) {
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(node, context)
      break
    case NodeTypes.ELEMENT:
      genElement(node, context)
      break
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context)
      break
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context)
      break
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context)
      break
  }
}

function createGenerateContext(): GenerateContext {
  const context = {
    code: '',
    push(source: string) {
      context.code += source
    },
    helper(key: symbol) {
      return helperMapName[key]
    },
  }
  return context
}

function genText(node: TextNode, context: GenerateContext) {
  const { push } = context
  push(`'${node.content}'`)
}

function genInterpolation(node: Interpolation, context: GenerateContext) {
  const { push, helper } = context
  push(`_${helper(TO_DISPLAY_STRING)}(`)
  genNode(node.content, context)
  push(')')
}

function genExpression(node: SimpleExpression, context: GenerateContext) {
  const { push } = context

  push(`${node.content}`)
}

function genElement(node: ElementNode, context: GenerateContext) {
  const { push, helper } = context
  const { tag, props, children } = node

  push(`_${helper(CREATE_ELEMENT_VNODE)}(`)
  genNodeList(genNullable([tag, props, children]), context)
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    genNode(child, context)
  }
  push(')')
}

function genCompoundExpression(node: CompoundNode, context: GenerateContext) {
  const { push } = context
  const { children } = node
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (isString(child))
      push(child as string)
    else
      genNode(child as NodeUnion, context)
  }
}

function genNullable(args: any[]) {
  return args.map(arg => arg || 'null')
}

function genNodeList(nodes: any[], context: GenerateContext) {
  const { push } = context
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (isString(node))
      push(node)
    else
      genNode(node, context)

    if (i !== nodes.length - 1)
      push(', ')
  }
}
