import { NodeTypes } from './ast'

/**
 * @description 开始和结束标签枚举
 */
const enum TagType {
  Start,
  End
}

/**
 * @description 上下文对象
 */
export interface ParseContext {
  source: string
}

/**
 * @description `AST`根节点
 */
export interface RootNode {
  type: NodeTypes
  // eslint-disable-next-line no-use-before-define
  children: NodeChildren
}

/**
 * @description 元素节点
 */
export interface ElementNode {
  type: NodeTypes.ELEMENT
  tag: string
  // eslint-disable-next-line no-use-before-define
  children: NodeChildren
}

/**
 * @description 插值语法节点
 */
export interface Interpolation {
  type: NodeTypes.INTERPOLATION
  content: {
    type: NodeTypes.SIMPLE_EXPRESSION
    content: string
  }
}

/**
 * @description 文本节点
 */
export interface TextNode {
  type: NodeTypes.TEXT
  content: string
}

/**
 * @description 节点类型的联合
 */
export type NodeUnion = ElementNode | TextNode | Interpolation

/**
 * @description 节点类型组成的数组
 */
type NodeChildren = NodeUnion[]

/**
 * @description 解析字符串,获取`AST`抽象语法树
 * @param content 字符串内容
 */
export function baseParse(content: string) {
  // 1.创建上下文对象
  const context = createParseContext(content)

  // 2.创建`AST`根节点
  // 3.处理内部内容
  return createRoot(parseChildren(context, []))
}

/**
 * @description 创建`AST`语法树根节点
 * @param children 子节点
 */
function createRoot(children): RootNode {
  return {
    type: NodeTypes.ROOT,
    children
  }
}

/**
 * @description 创建被解析内容的上下文对象
 * @param content 被解析内容
 */
function createParseContext(content: string): ParseContext {
  return {
    source: content
  }
}

/**
 * @description 处理语法树分支节点
 * @param context 上下文对象
 * @param ancestors 节点栈,维护当前元素节点的父子关系,主要看结尾标签是否能闭合
 */
function parseChildren(
  context: ParseContext,
  ancestors: ElementNode[]
): NodeChildren {
  // 1.创建`AST`节点树子节点数组
  const nodes: NodeChildren = []

  while (!isEnd(context, ancestors)) {
    debugger
    const s = context.source
    let node // 树子节点
    // 2.解析小胡子语法
    if (s.startsWith('{{')) {
      node = parseInterpolation(context)
    }
    // 3.解析元素标签
    else if (s[0] === '<') {
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors)
      }
    }
    // 4.解析文本节点
    if (!node) {
      node = parseText(context)
    }
    nodes.push(node)
  }

  return nodes
}

/**
 * @description 是否处理完毕当前循环
 */
function isEnd(context: ParseContext, ancestors: ElementNode[]): boolean {
  const s = context.source

  // 2.节点栈,判断是否闭合
  if (s.startsWith('</')) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const tag = ancestors[i].tag
      if (tag === s.slice(2, 2 + tag.length)) {
        return true
      }
    }
  }

  // 1.当所有字符串代码都解析完毕,`s`则为空
  return !s
}

/**
 * @description 创建游标辅助函数,解析一段记录一段(被解析的已经丢弃)
 * @param context 上下文对象
 * @param numberOfCharacters 已解析进度
 */
function advanceBy(context: ParseContext, numberOfCharacters: number) {
  console.log('推进解析进度', context, numberOfCharacters)
  context.source = context.source.slice(numberOfCharacters)
}

/**
 * @description 处理插值语法,也就是小胡子语法
 * @param context 上下文对象
 */
function parseInterpolation(context: ParseContext): Interpolation {
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
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content
    }
  }
}

/**
 * @description 解析元素
 * @param context 上下文对象
 */
function parseElement(
  context: ParseContext,
  ancestors: ElementNode[]
): ElementNode {
  // 1.解析开始标签,获取标签节点信息
  const element = parseTag(context, TagType.Start)

  // 2.解析标签内部内容,获取标签子节点,维护父子节点关系
  ancestors.push(element)
  element.children = parseChildren(context, ancestors)
  ancestors.pop()

  // 3.需要判断是否有结束标签
  if (
    context.source.startsWith('</') &&
    element.tag === context.source.slice(2, 2 + element.tag.length)
  ) {
    // 3.1 处理结束标签,无需节点信息了
    parseTag(context, TagType.End)
  } else {
    // 3.2 没有结束标签
    throw new Error(`缺少结束标签:${element.tag}`)
  }
  return element
}

/**
 * @description 处理标签
 * @param context 上下文对象
 */
function parseTag(context: ParseContext, tagType: TagType): ElementNode | any {
  // 1.使用正则匹配标签 `<div || </div`
  const match = /^<\/?([a-z]*)/i.exec(context.source) as RegExpExecArray
  // 2.获取标签名
  const tag = match[1]
  // 3.已经解析 `<div`
  advanceBy(context, match[0].length)
  // 4.标记已经解析 `>`
  advanceBy(context, 1)

  if (tagType === TagType.End) return

  return {
    type: NodeTypes.ELEMENT,
    tag,
    children: []
  }
}

/**
 * @description 解析文本节点
 * @param context 上下文对象
 */
function parseText(context: ParseContext): TextNode {
  // 1.默认截取全部文字
  let endIndex = context.source.length
  // 2.是否遇到其他标签或者插值语法
  const endTokens = ['<', '{{']
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i])
    // 2.1 判断是先出现的插值语法还是标签
    if (index > -1 && endIndex > index) {
      endIndex = index
    }
  }

  const content = parseTextData(context, endIndex)

  return {
    type: NodeTypes.TEXT,
    content
  }
}

/**
 * @description 处理指定数目的代码
 * @param context 上下文对象
 * @param length 已解析多少代码
 */
function parseTextData(context: ParseContext, length: number) {
  const content = context.source.slice(0, length)
  advanceBy(context, length)
  return content
}
