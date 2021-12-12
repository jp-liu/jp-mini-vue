import { isReadonly, readonly, shallowReadonly, isProxy } from '../reactive'

describe('readonly', () => {
  it('happy path', () => {
    const original = { foo: 1, bar: { baz: 2 } }
    const wrapped = readonly(original)

    expect(wrapped).not.toBe(original)
    expect(wrapped.foo).toBe(1)
    expect(isReadonly(wrapped)).toBe(true)
    expect(isReadonly(original)).toBe(false)
    expect(isProxy(wrapped)).toBe(true)
  })

  it('should warn when set readonly object', () => {
    // 通过jest.fn,模拟warn,让jest知道是该调用那个函数
    console.warn = jest.fn()

    const user = readonly({ foo: 2 })
    user.foo = 3
    expect(console.warn).toHaveBeenCalled()
  })

  it('nested reactive', () => {
    const observed = readonly({ foo: { bar: { baz: [{ bao: 1 }] } } })
    expect(isReadonly(observed)).toBe(true)
    expect(isReadonly(observed.foo)).toBe(true)
    expect(isReadonly(observed.foo.bar)).toBe(true)
    expect(isReadonly(observed.foo.bar.baz)).toBe(true)
    expect(isReadonly(observed.foo.bar.baz[0])).toBe(true)
  })

  it('should not handler nested non-readonly properties readonly', () => {
    const props = shallowReadonly({ n: { foo: 1 } })
    expect(isReadonly(props)).toBe(true)
    expect(isReadonly(props.n)).toBe(false)
  })
})
