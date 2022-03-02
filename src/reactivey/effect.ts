import { extend } from '../shared'

// eslint-disable-next-line no-use-before-define
let activeEffect: ReactiveEffect | undefined
let shouldTrack = false

const targetMap = new WeakMap()

/**
 * @description 被收集的依赖函数类
 */
export class ReactiveEffect {
  private _fn: () => void
  // 响应式第一次触发后,让用户自己决定后续的 set 操作要做的事情
  public scheduler?: () => void | undefined
  onStop?: () => void
  deps: any[] = []
  active: boolean = true // 是否被执行了 `stop` 退出了响应式系统的收集

  constructor(fn: () => void, scheduler?: () => void) {
    this._fn = fn
    this.scheduler = scheduler
  }

  run() {
    // 执行`stop`之后,应该避免收集依赖,不开启依赖收集开关
    // 因为退出响应式系统,仍然保留着 fn 函数的执行权力
    if (!this.active) {
      return this._fn()
    }

    // 1.开启开关,允许依赖收集
    shouldTrack = true
    // 2.设置依赖收集的目标
    activeEffect = this
    // 3.执行`fn`,调用内部的`get`的时候,就可以收集`activeEffect`了
    const result = this._fn()
    // 4.关闭依赖收集开关
    shouldTrack = false

    return result
  }

  // 退出响应式系统
  stop() {
    // 是否在响应式系统中
    if (this.active) {
      cleanupEffect(this)
      // 如果给了回调,则进行回调
      if (this.onStop) this.onStop()
      this.active = false
    }
  }
}

/**
 * @description 副作用函数,收集依赖
 * @param { Function } fn
 */
export function effect(fn, options?) {
  // 1.初始化
  const _effect = new ReactiveEffect(fn, options?.scheduler)

  extend(_effect, options)

  // 2.调用`run`方法,就是调用fn触发内部的`get/set`
  _effect.run()

  // 3.返回`runner`函数
  const runner: any = _effect.run.bind(activeEffect)
  runner.effect = _effect
  return runner
}

export function stop(runner) {
  runner.effect.stop()
}

function cleanupEffect(effect: ReactiveEffect) {
  effect.deps.forEach(dep => {
    dep.delete(effect)
  })
  effect.deps.length = 0
}

/**
 * @description 调用`get`方法的时候,进行依赖收集
 * @param target 当前追踪对象
 * @param key 当前访问的`key`
 */
export function track(target, key) {
  // @desc: 不是收集状态,直接返回
  if (!isTracking()) return

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
  const dep = depsMap.get(key)

  // @desc: 手动触发`trigger`,让其他人也可以加入响应式系统, 如`ref`
  triggerEffects(dep)
}

export function triggerEffects(dep) {
  for (const effect of dep) {
    if (effect.scheduler) {
      // 如果用户需要自己拥有操作权,则采用这个方案
      effect.scheduler()
    } else {
      effect.run()
    }
  }
}
