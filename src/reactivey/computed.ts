import { ReactiveEffect } from './effect'

class ComputedRefImpl {
  private _getter: any

  private _value: any

  private _dirty = true

  private _effect: ReactiveEffect

  constructor(getter) {
    this._getter = getter

    // @tips:
    //  1.使用`effect`,响应式对象变更,会自己触发`getter`,那`_dirty`就没有意义了
    //  2.所以使用`shceduler`,自定义依赖收集之后的操作
    //  3.将`_dirty`设置为`true`,下次调用`get`的时候,就能拿到最新值了
    this._effect = new ReactiveEffect(getter, () => {
      this._dirty = true
    })
  }

  get value() {
    // @desc: 使用开关,避免冲重复调用`getter`,缓存返回值`_value`
    if (this._dirty) {
      this._dirty = false
      return (this._value = this._effect.run())
    }

    return this._value
  }
}

export function computed(getter) {
  return new ComputedRefImpl(getter)
}
