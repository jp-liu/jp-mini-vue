import { computed } from '../computed'
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
})
