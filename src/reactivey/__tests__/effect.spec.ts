import { effect, stop } from '../effect'
import { reactive } from '../reactive'

describe('effect', () => {
  it('happy path', () => {
    const user = reactive({
      age: 10
    })

    let nextAge
    effect(() => {
      nextAge = user.age + 1
    })

    expect(nextAge).toBe(11)

    user.age++
    expect(nextAge).toBe(12)
  })

  it('nested reactive effect', () => {
    let dummy
    const obj = reactive({ foo: { bar: 1 } })

    const efc = jest.fn(() => {
      dummy = obj.foo.bar
    })
    effect(efc)

    expect(efc).toHaveBeenCalledTimes(1)
    expect(dummy).toBe(1)
    obj.foo.bar = 2
    expect(efc).toHaveBeenCalledTimes(2)
    expect(dummy).toBe(2)
  })

  it('should be return runner fn for call effect', () => {
    let foo = 10
    const runner = effect(() => {
      foo++
      return 'test return'
    })
    expect(foo).toBe(11)
    expect(runner()).toBe('test return')
    expect(foo).toBe(12)
  })

  it('shceduler', () => {
    // 1.effect 可以指定第二个参数,包括 shceduler 函数
    // 2.初次调用 effect 还是会直接调用 fn,后续的响应触发,交由 shceduler 执行
    let dummy
    let run: any
    const shceduler = jest.fn(() => {
      run = runner
    })

    const foo = reactive({ bar: 1 })
    const runner = effect(
      () => {
        dummy = foo.bar
        return 'test'
      },
      { shceduler }
    )

    expect(shceduler).not.toHaveBeenCalled()
    expect(dummy).toBe(1)
    foo.bar++
    expect(shceduler).toHaveBeenCalledTimes(1)
    expect(dummy).toBe(1)
    expect(run()).toBe('test')
    expect(dummy).toBe(2)
  })

  it('stop', () => {
    // 1.允许通过调用`stop`方法,关闭副作用
    let dummy
    const obj = reactive({ foo: 1 })
    const runner = effect(() => {
      // 调用`effect`的`fn`,内部有响应式数据被`get`
      // 那么,这个`fn`将会作为依赖被收集,当执行`stop`之后
      // 应该禁止收集这个`fn`函数作为依赖
      // 所以设置变量`shouldTrack`,我们只有在`run`方法中控制是否收集
      // 不是`effect`调用的,get,没有收集必要,`stop`之后,也没必要收集
      dummy = obj.foo
    })
    obj.foo = 2
    expect(dummy).toBe(2)
    stop(runner)
    // obj.foo = 3
    // 1.已经`stop`,再次调用`get`不应该收集依赖,也就是不能收集`fn`
    obj.foo++ // obj.foo = obj.foo + 1 => get and set
    expect(dummy).toBe(2)

    // 2.但是关闭了副作用,仍要保留手动执行函数的权利
    runner()
    expect(dummy).toBe(3)
  })

  it('onStop', () => {
    // 1.停止副作用给与用户回执的方法
    const obj = reactive({ foo: 1 })
    const onStop = jest.fn()
    let dummy
    const runner = effect(
      () => {
        dummy = obj.foo
      },
      {
        onStop
      }
    )

    expect(dummy).toBe(1)
    stop(runner)
    expect(onStop).toHaveBeenCalledTimes(1)
  })
})
