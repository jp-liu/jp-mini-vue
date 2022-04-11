import { generate } from './codegen'
import { baseParse } from './parse'
import { transform } from './transform'
import { transformElement } from './transforms/transformElement'
import { transformExpress } from './transforms/transformExpress'
import { transformText } from './transforms/transformText'

export function baseCompile(template: string) {
  const ast = baseParse(template)

  transform(ast, {
    nodeTransforms: [transformExpress, transformElement, transformText]
  })

  return generate(ast)
}
