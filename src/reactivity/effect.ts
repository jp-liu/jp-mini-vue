import { extend } from '../shared'

// eslint-disable-next-line no-use-before-define
let activeEffect: ReactiveEffect | undefined
let shouldTrack = false

const targetMap = new WeakMap()

/**
 * @description 被收集的依赖函数类
 */
export class ReactiveEffect {
  active = true // 是否被执行了 `stop` 退出了响应式系统的收集
  deps: any[] = []
  parent: ReactiveEffect | undefined = undefined

  private _fn: () => void
  // 响应式第一次触发后,让用户自己决定后续的 set 操作要做的事情
  public scheduler?: () => void | undefined
  onStop?: () => void

  constructor(fn: () => void, scheduler?: () => void) {
    this._fn = fn
    this.scheduler = scheduler
  }

  run() {
    // 执行`stop`之后,应该避免收集依赖,不开启依赖收集开关
    // 因为退出响应式系统,仍然保留着 fn 函数的执行权力
    if (!this.active)
      return this._fn()

    // 解决嵌套 `effect` 的情况下, `shouldTrack` 和 `activeEffect` 错误和丢失的问题
    // 使用 parent 链,伪造一个栈结构,退出当前执行,`activeEffect`还原之前上一级活跃对象
    // 记录当前活跃类
    let parent: ReactiveEffect | undefined = activeEffect

    // 记录依赖收集开关
    // 记录当前追踪状态,嵌套使用的时,子级退出后,可以保持追踪状态
    const lastShouldTrack = shouldTrack
    while (parent) {
      // 避免重复执行, 如: xx++自增/ xx = xx+ 1
      if (parent === this)
        return
      parent = parent.parent
    }

    try {
      // 0.记录当前活跃副作用函数
      this.parent = activeEffect
      // 1.开启开关,允许依赖收集
      shouldTrack = true
      // 2.设置依赖收集的目标
      activeEffect = this
      // 3.清理无效的依赖收集
      // 这里删除,fn 又收集了,死循环了,所以需要new Set() 存放一个备份,不影响原部分
      cleanupEffect(this)
      // 4.执行`fn`,调用内部的`get`的时候,就可以收集`activeEffect`了
      return this._fn()
    }
    finally {
      activeEffect = this.parent
      shouldTrack = lastShouldTrack
      this.parent = undefined
    }
  }

  // 退出响应式系统
  stop() {
    // 是否在响应式系统中
    if (this.active) {
      cleanupEffect(this)
      // 如果给了回调,则进行回调
      if (this.onStop)
        this.onStop()
      this.active = false
    }
  }
}

/**
 * @description 副作用函数,收集依赖
 * @param { Function } fn
 */
export function effect(
  fn,
  options?: { scheduler?: () => void; onStop?: () => void }
) {
  // 1.初始化
  const _effect = new ReactiveEffect(fn, options?.scheduler)

  extend(_effect, options)

  // 2.调用`run`方法,就是调用fn触发内部的`get/set`
  _effect.run()

  // 3.返回`runner`函数
  const runner: any = _effect.run.bind(_effect)
  runner.effect = _effect
  return runner
}

export function stop(runner) {
  runner.effect.stop()
}

function cleanupEffect(effect: ReactiveEffect) {
  const len = effect.deps.length

  for (let i = len - 1; i >= 0; i--)
    effect.deps[i].delete(effect)

  // effect.deps.forEach((dep) => {
  //   dep.delete(effect)
  // })
  effect.deps.length = 0
}

/**
 * @description 调用`get`方法的时候,进行依赖收集
 * @param target 当前追踪对象
 * @param key 当前访问的`key`
 */
export function track(target, key) {
  // @desc: 不是收集状态,直接返回
  if (!isTracking())
    return

  // console.log(`触发 track -> target: ${target} key:${key}`)

  // 获取当前追踪对象
  let depsMap = targetMap.get(target)
  // 判断是否存在依赖中,没有则添加
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }

  // @desc: 获取当前对象的`key`对应的依赖
  let dep = depsMap.get(key)
  // 没有则添加一个
  if (!dep) {
    dep = new Set()
    depsMap.set(key, dep)
  }

  // @desc: 手动触发`track`,允许其他人加入响应式系统, 如`ref`
  trackEffects(dep)
}

export function trackEffects(dep) {
  // @desc: 如果已经添加过了,避免重复添加
  if (!dep.has(activeEffect)) {
    // 将依赖加入对应的`dep`中
    dep.add(activeEffect)
    activeEffect?.deps.push(dep)
  }
}

export function isTracking() {
  return shouldTrack && activeEffect
}

/**
 * @description 调用`set`方法的时候,触发变更函数
 * @param target 当前追踪对象
 * @param key 当前访问的`key`
 */
export function trigger(target, key) {
  // console.log(`触发 trigger -> target: ${target} key:${key}`)

  const depsMap = targetMap.get(target)
  if (!depsMap)
    return // 无效更新

  let dep = depsMap.get(key)

  if (!dep)
    return

  dep = createDep(dep)

  // @desc: 手动触发`trigger`,让其他人也可以加入响应式系统, 如`ref`
  triggerEffects(dep)
}

export function triggerEffects(dep) {
  for (const effect of dep) {
    if (effect !== activeEffect) {
      if (effect.scheduler) {
        // 如果用户需要自己拥有操作权,则采用这个方案
        effect.scheduler()
      }
      else {
        effect.run()
      }
    }
  }
}

export function createDep(dep?) {
  return new Set(dep)
}
