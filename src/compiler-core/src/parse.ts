import { NodeType } from './ast'

export function baseParse(content: string) {
  // 1.创建上下文对象
  const context = createParseContext(content)

  // 2.创建`AST`根节点
  // 3.处理内部内容
  return createRoot(parseChildren(context))
}

/**
 * @description 创建`AST`语法树根节点
 * @param children 子节点
 */
function createRoot(children) {
  return {
    type: NodeType.ROOT,
    children
  }
}

/**
 * @description 创建被解析内容的上下文对象
 * @param content 被解析内容
 */
function createParseContext(content: string) {
  return {
    source: content
  }
}

/**
 * @description 处理语法树分支节点
 * @param context 上下文对象
 */
function parseChildren(context: { source: string }): any {
  // 1.创建`AST`节点数
  const nodes: any = []
  const s = context.source

  let node
  if (s.startsWith('{{')) {
    node = parseInterpolation(context)
  }
  nodes.push(node)
  return nodes
}

/**
 * @description 处理插值语法,也就是小胡子语法
 * @param context 上下文对象
 */
function parseInterpolation(context: { source: string }) {
  // @desc: `{{message}}`掐头去尾各两位,得到变量名
  const openDelimiter = '{{'
  const closeDelimiter = '}}'

  // 1.获取变量结尾下标
  const closeIndex = context.source.indexOf('}}', openDelimiter.length)
  // 2.获取变量名长度
  const variableLen = closeIndex - closeDelimiter.length
  // 3.掐头
  advanceBy(context, openDelimiter.length)
  // 4.截取变量名
  const rawContent = context.source.slice(0, variableLen)
  // 5.去除左右空格
  const content = rawContent.trim()
  // 6.去尾
  advanceBy(context, variableLen + closeDelimiter.length)

  return {
    type: NodeType.INTERPOLATION,
    content: {
      type: NodeType.SIMPLE_EXPRESSION,
      content
    }
  }
}

/**
 * @description 创建游标辅助函数,解析一段记录一段(被解析的已经丢弃)
 * @param context 上下文对象
 * @param numberOfCharacters 已解析进度
 */
function advanceBy(context: { source: string }, numberOfCharacters: number) {
  console.log('推进解析进度', context, numberOfCharacters)
  context.source = context.source.slice(numberOfCharacters)
}
