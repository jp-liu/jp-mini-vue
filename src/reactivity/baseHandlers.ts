import { extend, hasOwn, isObject, isSymbol } from '../shared'
import { track, trigger } from './effect'
import { ReactiveFlag, reactive, readonly } from './reactive'

const builtInSymbols = new Set(
  Object.getOwnPropertyNames(Symbol)
    .map(key => Symbol[key])
    .filter(isSymbol)
)

const get = createGetter()
const set = createSetter()

const readonlyGet = createGetter(true)
const readonlySet = createSetter(true)

const shallowReadonlyGet = createGetter(true, true)

function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key) {
    if (key === ReactiveFlag.IS_REACTIVE)
      return !isReadonly

    if (key === ReactiveFlag.IS_READONLY)
      return isReadonly

    const res = Reflect.get(target, key)

    if (shallow)
      return res

    if (isObject(res))
      return isReadonly ? readonly(res) : reactive(res)

    // 进行依赖追踪
    if (!isReadonly)
      track(target, key)

    return res
  }
}

function createSetter(isReadonly = false) {
  return function set(target, key, value) {
    if (isReadonly) {
      // 不能设置,给报错信息
      console.warn(`Cannot be edited key: ${String(key)}, it is readonly`)
      return true
    }

    const res = Reflect.set(target, key, value)

    // 触发更新
    trigger(target, key)
    return res
  }
}

function deleteProperty(target, key) {
  const hasKey = hasOwn(target, key)
  // 记录旧值,触发更新的时候可以触发 watch 用
  // const oldValue = target[key]
  const result = Reflect.deleteProperty(target, key)
  if (result && hasKey)
    trigger(target, key)

  return result
}

function has(target, key) {
  const result = Reflect.has(target, key)

  // 不是符号类型的 key, 或者不是系统自带符号类型.系统自带的key的调用无需处理
  if (!isSymbol(key) || !builtInSymbols.has(key))
    track(target, key)

  return result
}

export const mutableHandlers = {
  get,
  set,
  deleteProperty,
  has
}

export const readonlyHandlers = {
  get: readonlyGet,
  set: readonlySet,
  deleteProperty(target, key) {
    console.warn(
      `Delete operation on key "${String(key)}" failed: target is readonly.`,
      target
    )
    return true
  }
}

export const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
  get: shallowReadonlyGet
})
