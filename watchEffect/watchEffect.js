// 接异步更新队列的代码，
// 1、将watch函数修改为watchEffect，并且effect可以接受options
//2、可以返回stop函数，调用stop()停止监听

let x, y, z, active

// 异步更新队列
let queue = []
let nextTick = (cb) => Promise.resolve().then(cb)
let flushJob = () => {
  let job
  while (queue.length > 0) {
    job = queue.shift()
    job && job()
  }
}
let queueJob = (dep) => {
  if (!queue.includes(dep)) {
    queue.push(dep)
    nextTick(flushJob) // 这里暂时理解为压入一个任务要执行一次，压入多个任务后面的就会覆盖前面的。
  }
}

// 支持多个依赖收集和通知依赖更新
class Dep {
  constructor() {
    this.deps = new Set()
  }
  depend() {
    if (active) {
      this.deps.add(active)
      active.depsArr.push(this.deps)
    }
  }
  notify() {
    this.deps.forEach((dep) => queueJob(dep))
    this.deps.forEach((dep) => {
      dep.options && dep.options.schedular && dep.options.schedular()
    })
  }
}

// ref函数实现响应式数据
let ref = (initValue) => {
  let value = initValue
  let dep = new Dep()
  return Object.defineProperty({}, 'value', {
    get() {
      dep.depend()
      return value
    },
    set(newValue) {
      value = newValue
      dep.notify()
    },
  })
}

// 监听新增的依赖，更新响应事件
let createEffect = (fn, options = {}) => {
  let effect = (...args) => {
    try {
      active = effect
      return fn(...args)
    } finally {
      active = null
    }
  }
  effect.options = options
  effect.depsArr = []
  return effect
}
let cleanUpEffect = (effect) => {
  const { depsArr } = effect
  depsArr.forEach((deps) => {
    deps.delete(effect)
  })
}
let watchEffect = function (cb) {
  let runner = createEffect(cb)
  runner()
  return () => {
    cleanUpEffect(runner)
  }
}

x = ref(1)
y = ref(2)
z = ref(3)

const stop = watchEffect(() => {
  let str = `x = ${x.value} | y =${y.value} | z =${z.value}`
  document.write(str + '<hr>')
  console.log(str)
})

//过1s xyz修改会打印
setTimeout(() => {
  x.value = 100
  y.value = 200
  z.value = 300
}, 1000)

setTimeout(() => {
  stop()
}, 2000)

// stop之后不会继续监听，下面的xyz修改不会打印。
setTimeout(() => {
  x.value = 1000
  y.value = 2000
  z.value = 3000
}, 3000)
