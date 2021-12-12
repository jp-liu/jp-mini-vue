import { extend, isObject } from '../shared'
import { track, trigger } from './effect'
import { reactive, ReactiveFlag, readonly } from './reactive'

const get = createGetter()
const set = createSetter()

const readonlyGet = createGetter(true)
const readonlySet = createSetter(true)

const shallowReadonlyGet = createGetter(true, true)

function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key) {
    if (key === ReactiveFlag.IS_REACTIVE) {
      return !isReadonly
    }
    if (key === ReactiveFlag.IS_READONLY) {
      return isReadonly
    }

    const res = Reflect.get(target, key)

    if (shallow) {
      return res
    }

    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res)
    }

    // 进行依赖追踪
    if (!isReadonly) {
      track(target, key)
    }
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

export const mutableHandlers = {
  get,
  set
}

export const readonlyHandlers = {
  get: readonlyGet,
  set: readonlySet
}

export const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
  get: shallowReadonlyGet
})
