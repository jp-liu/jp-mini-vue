import { computed } from '../computed'
import { effect } from '../effect'
import { reactive } from '../reactive'

describe('computed', () => {
  it('happy path', () => {
    const user = reactive({ age: 1 })

    const age = computed(() => user.age)

    expect(age.value).toBe(1)
  })

  it('should compute lazily', () => {
    // 如果没有依赖收集,那么就没有`dep`,也就会报错
    // TODO: 后需要要做这个边界处理
    const value = reactive({ foo: 1 })
    const getter = jest.fn(() => value.foo)
    const cValue = computed(getter)

    // lazy
    expect(getter).not.toHaveBeenCalled()

    // 获取之后,才会执行
    expect(cValue.value).toBe(1)
    expect(getter).toHaveBeenCalledTimes(1)

    // 反复读取,不会重复调用
    cValue.value
    expect(getter).toHaveBeenCalledTimes(1)

    // 值改变无需触发,但是下次读取,触发,获取最新值
    // 响应式对象,变更`trigger`时需要知道是得到依赖对象,进行触发
    // 也就是需要`effect`
    value.foo = 2
    expect(getter).toHaveBeenCalledTimes(1)

    // 重新读取,要获取最新值,调用一次函数
    cValue.value
    expect(getter).toHaveBeenCalledTimes(2)

    cValue.value
    expect(getter).toHaveBeenCalledTimes(2)
  })

  it('should trigger effect', () => {
    const value = reactive({})
    const cValue = computed(() => value.foo)
    let dummy
    effect(() => {
      dummy = cValue.value
    })
    expect(dummy).toBe(undefined)
    value.foo = 1
    expect(dummy).toBe(1)
  })

  it('should work when chained', () => {
    const value = reactive({ foo: 0 })
    const c1 = computed(() => value.foo)
    const c2 = computed(() => c1.value + 1)
    expect(c2.value).toBe(1)
    expect(c1.value).toBe(0)
    value.foo++
    expect(c2.value).toBe(2)
    expect(c1.value).toBe(1)
  })

  it('should trigger effect when chained', () => {
    const value = reactive({ foo: 0 })
    const getter1 = jest.fn(() => value.foo)
    const getter2 = jest.fn(() => {
      return c1.value + 1
    })
    const c1 = computed(getter1)
    const c2 = computed(getter2)

    let dummy
    effect(() => {
      dummy = c2.value
    })
    expect(dummy).toBe(1)
    expect(getter1).toHaveBeenCalledTimes(1)
    expect(getter2).toHaveBeenCalledTimes(1)
    value.foo++
    expect(dummy).toBe(2)
    // should not result in duplicate calls
    expect(getter1).toHaveBeenCalledTimes(2)
    expect(getter2).toHaveBeenCalledTimes(2)
  })

  it('should trigger effect when chained (mixed invocations)', () => {
    const value = reactive({ foo: 0 })
    const getter1 = jest.fn(() => value.foo)
    const getter2 = jest.fn(() => {
      return c1.value + 1
    })
    const c1 = computed(getter1)
    const c2 = computed(getter2)

    let dummy
    effect(() => {
      dummy = c1.value + c2.value
    })
    expect(dummy).toBe(1)

    expect(getter1).toHaveBeenCalledTimes(1)
    expect(getter2).toHaveBeenCalledTimes(1)
    value.foo++
    expect(dummy).toBe(3)
    // should not result in duplicate calls
    expect(getter1).toHaveBeenCalledTimes(2)
    expect(getter2).toHaveBeenCalledTimes(2)
  })

  it('should no longer update when stopped', () => {
    const value = reactive({})
    const cValue = computed(() => value.foo)
    let dummy
    effect(() => {
      dummy = cValue.value
    })
    expect(dummy).toBe(undefined)
    value.foo = 1
    expect(dummy).toBe(1)
    cValue.effect.stop()
    value.foo = 2
    expect(dummy).toBe(1)
  })
})
