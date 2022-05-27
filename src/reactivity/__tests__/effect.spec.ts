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

  it('should handle multiple effects', () => {
    let dummy1, dummy2
    const counter = reactive({ num: 0 })
    effect(() => (dummy1 = counter.num))
    effect(() => (dummy2 = counter.num))

    expect(dummy1).toBe(0)
    expect(dummy2).toBe(0)
    counter.num++
    expect(dummy1).toBe(1)
    expect(dummy2).toBe(1)
  })

  it('run time debounce', () => {
    const info: any = {}
    const user = reactive({
      name: '赵无双',
      age: 10
    })

    const fn = jest.fn(() => {
      info.name = user.name
      info.age = user.age
    })

    effect(fn)
    expect(fn).toHaveBeenCalledTimes(1)
    user.name = '娃哈哈'
    user.age = 11
    expect(fn).toHaveBeenCalledTimes(3)
    expect(info.name).toBe('娃哈哈')
    expect(info.age).toBe(11)
  })

  it('should observe function call chains', () => {
    let dummy
    const counter = reactive({ num: 0 })
    effect(() => (dummy = getNum()))

    function getNum() {
      return counter.num
    }

    expect(dummy).toBe(0)
    counter.num = 2
    expect(dummy).toBe(2)
  })

  it('nested effect', () => {
    let dummy1, dummy2
    const obj = reactive({ num1: 1, num2: 2 })

    const fnSpy2 = jest.fn(() => {
      dummy2 = obj.num2
    })

    const fnSpy1 = jest.fn(() => {
      effect(fnSpy2)
      dummy1 = obj.num1
    })

    effect(fnSpy1)
    expect(dummy1).toBe(1)
    expect(dummy2).toBe(2)
    expect(fnSpy1).toHaveBeenCalledTimes(1)
    expect(fnSpy2).toHaveBeenCalledTimes(1)

    // TODO 待解决,嵌套
    obj.num1 = 2
    expect(fnSpy1).toHaveBeenCalledTimes(2)
    expect(fnSpy2).toHaveBeenCalledTimes(2)
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

  it('scheduler', () => {
    // 1.effect 可以指定第二个参数,包括 scheduler 函数
    // 2.初次调用 effect 还是会直接调用 fn,后续的响应触发,交由 scheduler 执行
    let dummy
    let run: any
    let runner: any
    const scheduler = jest.fn(() => {
      run = runner
    })

    const foo = reactive({ bar: 1 })
    runner = effect(
      () => {
        dummy = foo.bar
        return 'test'
      },
      { scheduler }
    )

    expect(scheduler).not.toHaveBeenCalled()
    expect(dummy).toBe(1)
    foo.bar++
    expect(scheduler).toHaveBeenCalledTimes(1)
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
