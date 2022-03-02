import { effect } from '../effect'
import { reactive } from '../reactive'
import { isRef, proxyRefs, ref, unRef } from '../ref'

describe('ref', () => {
  it('happy path', () => {
    const a = ref(1)
    expect(a.value).toBe(1)
  })

  it('should be reactive', () => {
    const a = ref(1)
    let dummy
    let calls = 0

    // 调用`effect`的时候需要收集`ref`的依赖
    // 所以:
    //  1.`a.value`需要加入响应式系统,需要`ReactiveEffect`
    effect(() => {
      calls++
      dummy = a.value
    })

    expect(calls).toBe(1)
    expect(dummy).toBe(1)
    a.value = 2
    expect(calls).toBe(2)
    expect(dummy).toBe(2)

    // same value should not trigger
    // 相同的值,不用改触发收集响应式
    a.value = 2
    expect(calls).toBe(2)
    expect(dummy).toBe(2)
  })

  it('should make nested properties reactive', () => {
    const a = ref({
      count: 1
    })

    let dummy
    effect(() => {
      dummy = a.value.count
    })

    expect(dummy).toBe(1)
    a.value.count = 2
    expect(dummy).toBe(2)
  })

  it('isRef', () => {
    const a = ref(1)
    const u = reactive({ a: 1 })
    expect(isRef(a)).toBe(true)
    expect(isRef(1)).toBe(false)
    expect(isRef(u)).toBe(false)
  })

  it('unRef', () => {
    const a = ref(1)
    const u = reactive({ a: 1 })
    expect(unRef(a)).toBe(1)
    expect(unRef(1)).toBe(1)
    expect(unRef(u)).toBe(u)
  })

  it('proxyRef', () => {
    const user = {
      name: 'xiaoping',
      age: ref(10)
    }

    const proxyUser = proxyRefs(user)
    expect(user.age.value).toBe(10)
    expect(proxyUser.age).toBe(10)
    expect(proxyUser.name).toBe('xiaoping')
  })
})
