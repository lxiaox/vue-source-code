// 接watchEffect的代码，
// 1实现计算属性 2实现计算属性的缓存

let x, y, active

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

// 增加computed计算属性
let computed = (cb) => {
  let v
  return {
    get value() {
      v = cb()
      return v
    },
  }
}

x = ref(1)
y = computed(() => {
  return x.value * 2
})

watchEffect(() => {
  document.getElementById('xtext').innerText = `x = ${x.value}`
  document.getElementById('ytext').innerText = `y = x*2 = ${y.value}`
})
document.getElementById('add').addEventListener('click', () => {
  x.value += 1
})
