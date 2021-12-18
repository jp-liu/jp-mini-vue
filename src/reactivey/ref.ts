import { hasChanged, isObject } from '../shared'
import {
  isTracting,
  ReactiveEffect,
  trackEffects,
  triggerEffects
} from './effect'
import { reactive } from './reactive'

class RefImpl {
  private _value: any

  private _raw: any

  public dep: Set<ReactiveEffect>

  public __v_isRef = true

  constructor(value) {
    this._raw = value
    this._value = convert(value)
    this.dep = new Set()
  }

  get value() {
    // 如何加入响应式,手动`track`,那么需要自己`trigger`
    trackRefValue(this)
    return this._value
  }

  set value(newValue) {
    if (hasChanged(this._raw, newValue)) {
      this._raw = newValue
      this._value = convert(newValue)
      triggerEffects(this.dep)
    }
  }
}

function convert(value) {
  return isObject(value) ? reactive(value) : value
}

function trackRefValue(ref) {
  if (isTracting()) {
    trackEffects(ref.dep)
  }
}

export function ref(value) {
  return new RefImpl(value)
}

export function isRef(ref) {
  return !!ref.__v_isRef
}

export function unRef(ref) {
  return isRef(ref) ? ref.value : ref
}

export function proxyRefs(objectWithRef) {
  return new Proxy(objectWithRef, {
    get(target, key) {
      // get 操作,提供解包后的结果
      return unRef(Reflect.get(target, key))
    },
    set(target, key, value) {
      // 如果新值是ref直接赋值,如果不是,则需要对value赋值
      if (isRef(target[key]) && !isRef(value)) {
        return (target[key].value = value)
      }
      return Reflect.set(target, key, value)
    }
  })
}
