import { baseCompile } from './compiler-core/src'
import * as runtimeDom from './runtime-dom'
import { registerRuntimeComplier } from './runtime-dom'

function compileToFunction(template: string) {
  const { code } = baseCompile(template)

  const render = new Function('Vue', code)
  return render(runtimeDom)
}

registerRuntimeComplier(compileToFunction)

export * from './runtime-dom'
