import { isReactive, reactive, isProxy } from '../reactive'

describe('reactive', () => {
  it('happy path', () => {
    const original = { foo: 1 }
    const observed = reactive(original)

    expect(original).not.toBe(observed)
    expect(observed.foo).toBe(1)

    expect(isReactive(observed)).toBe(true)
    expect(isReactive(original)).toBe(false)

    expect(isProxy(observed)).toBe(true)
  })

  it('nested reactive', () => {
    const observed = reactive({ foo: { bar: { baz: [{ bao: 1 }] } } })
    expect(isReactive(observed)).toBe(true)
    expect(isReactive(observed.foo)).toBe(true)
    expect(isReactive(observed.foo.bar)).toBe(true)
    expect(isReactive(observed.foo.bar.baz)).toBe(true)
    expect(isReactive(observed.foo.bar.baz[0])).toBe(true)
  })
})
