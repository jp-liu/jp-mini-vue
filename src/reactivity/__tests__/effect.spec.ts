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

    obj.num1 = 2
    expect(fnSpy1).toHaveBeenCalledTimes(2)
    expect(fnSpy2).toHaveBeenCalledTimes(2)
  })

  it('should allow nested effects', () => {
    const nums = reactive({ num1: 0, num2: 1, num3: 2 })
    const dummy: any = {}

    const childSpy = jest.fn(() => (dummy.num1 = nums.num1))
    const childeffect = effect(childSpy)
    const parentSpy = jest.fn(() => {
      dummy.num2 = nums.num2
      childeffect()
      dummy.num3 = nums.num3
    })
    effect(parentSpy)

    expect(dummy).toEqual({ num1: 0, num2: 1, num3: 2 })
    expect(parentSpy).toHaveBeenCalledTimes(1)
    expect(childSpy).toHaveBeenCalledTimes(2)
    // this should only call the childeffect
    nums.num1 = 4
    expect(dummy).toEqual({ num1: 4, num2: 1, num3: 2 })
    expect(parentSpy).toHaveBeenCalledTimes(1)
    expect(childSpy).toHaveBeenCalledTimes(3)
    // this calls the parenteffect, which calls the childeffect once
    nums.num2 = 10
    expect(dummy).toEqual({ num1: 4, num2: 10, num3: 2 })
    expect(parentSpy).toHaveBeenCalledTimes(2)
    expect(childSpy).toHaveBeenCalledTimes(4)
    // this calls the parenteffect, which calls the childeffect once
    nums.num3 = 7
    expect(dummy).toEqual({ num1: 4, num2: 10, num3: 7 })
    expect(parentSpy).toHaveBeenCalledTimes(3)
    expect(childSpy).toHaveBeenCalledTimes(5)
  })

  it('should avoid implicit infinite recursive loops with itself', () => {
    const counter = reactive({ num: 0 })

    const counterSpy = jest.fn(() => counter.num++)
    effect(counterSpy)
    expect(counter.num).toBe(1)
    expect(counterSpy).toHaveBeenCalledTimes(1)
    counter.num = 4
    expect(counter.num).toBe(5)
    expect(counterSpy).toHaveBeenCalledTimes(2)
  })

  it('should observe properties on the prototype chain', () => {
    let dummy
    const counter = reactive({ num: 0 })
    const parentCounter = reactive({ num: 2 })
    Object.setPrototypeOf(counter, parentCounter)
    effect(() => (dummy = counter.num))

    expect(dummy).toBe(0)
    delete counter.num
    expect(dummy).toBe(2)
    parentCounter.num = 4
    expect(dummy).toBe(4)
    counter.num = 3
    expect(dummy).toBe(3)
  })

  it('should observe delete operations', () => {
    let dummy
    const obj = reactive({ prop: 'value' })
    effect(() => (dummy = obj.prop))

    expect(dummy).toBe('value')
    delete obj.prop
    expect(dummy).toBe(undefined)
  })

  it('should observe has operations', () => {
    let dummy
    const obj = reactive({ prop: 'value' })
    effect(() => (dummy = 'prop' in obj))

    expect(dummy).toBe(true)
    delete obj.prop
    expect(dummy).toBe(false)
    obj.prop = 12
    expect(dummy).toBe(true)
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

  it('should discover new branches while running automatically', () => {
    let dummy
    const obj = reactive({ prop: 'value', run: false })

    const conditionalSpy = jest.fn(() => {
      dummy = obj.run ? obj.prop : 'other'
    })
    effect(conditionalSpy)

    expect(dummy).toBe('other')
    expect(conditionalSpy).toHaveBeenCalledTimes(1)
    obj.prop = 'Hi'
    expect(dummy).toBe('other')
    expect(conditionalSpy).toHaveBeenCalledTimes(1)
    obj.run = true
    expect(dummy).toBe('Hi')
    expect(conditionalSpy).toHaveBeenCalledTimes(2)
    obj.prop = 'World'
    expect(dummy).toBe('World')
    expect(conditionalSpy).toHaveBeenCalledTimes(3)
  })

  it('should discover new branches when running manually', () => {
    let dummy
    let run = false
    const obj = reactive({ prop: 'value' })
    const runner = effect(() => {
      dummy = run ? obj.prop : 'other'
    })

    expect(dummy).toBe('other')
    runner()
    expect(dummy).toBe('other')
    run = true
    runner()
    expect(dummy).toBe('value')
    obj.prop = 'World'
    expect(dummy).toBe('World')
  })

  it('should not be triggered by mutating a property, which is used in an inactive branch', () => {
    let dummy
    const obj = reactive({ prop: 'value', run: true })

    const conditionalSpy = jest.fn(() => {
      // 当 run 为 false 的时候, prop 是的副作用收集也就没有用了
      // 所以为了清理内存性能,需要清理掉无用的副作用收集
      dummy = obj.run ? obj.prop : 'other'
    })
    effect(conditionalSpy)

    expect(dummy).toBe('value')
    expect(conditionalSpy).toHaveBeenCalledTimes(1)
    obj.run = false
    expect(dummy).toBe('other')
    expect(conditionalSpy).toHaveBeenCalledTimes(2)
    obj.prop = 'value2'
    expect(dummy).toBe('other')
    expect(conditionalSpy).toHaveBeenCalledTimes(2)
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
