// 微任务锁,避免重复添加任务
let isFlushPending: boolean = false

// 创建一个微任务
const p = Promise.resolve()

// 组件更新任务队列
const queue: any[] = []

export function nextTick(fn) {
  fn ? p.then(fn) : p
}

export function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job)
  }

  queueFlush()
}
function queueFlush() {
  if (isFlushPending) return
  // 生成一个微任务之后,当执行时,组件同步任务已经计算完毕
  // 然后更新一次组件即可,更新队列
  isFlushPending = true

  nextTick(flushJobs)
}

function flushJobs() {
  isFlushPending = false
  let job
  while ((job = queue.shift())) {
    console.log(job?.component)
    job && job()
  }
}
