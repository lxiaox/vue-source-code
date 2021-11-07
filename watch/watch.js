// 接conmputed的代码，实现watch

// 1 可以监听一个函数
// 2 第2个参数接受callback函数，响应时调用callback，将新旧两个value作为callback的参数。
// 3 第3个参数接收options{immeduate}表示立即执行一遍callback

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
    nextTick(flushJob)
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

// watchEffect监听新增的依赖，更新响应事件
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

// 实现watch
let watch = (source, cb, options = {}) => {
  // source：监听函数 或者 数组、对象属性
  const { immediate } = options
  const getV = () => {
    return source() // 执行source，加入依赖中
  }
  let oldV
  const runner = createEffect(getV, {
    schedular: () => {
      let newV = getV()
      if (newV !== oldV) {
        cb(newV, oldV)
        oldV = newV
      }
    },
  })
  runner()

  // 这里设定的是：立即执行的时候看作oldV不存在

  if (immediate) {
    let newV = getV()
    cb(newV, oldV)
    oldV = newV
  } else {
    oldV = getV()
  }
}

// 增加computed计算属性
let computed = (cb) => {
  let v
  let dirty = true
  const runner = createEffect(cb, {
    schedular() {
      if (!dirty) {
        dirty = true
      }
    },
  })
  return {
    get value() {
      if (dirty) {
        v = runner()
        dirty = false
      }
      return v
    },
  }
}

x = ref(1)

watchEffect(() => {
  document.getElementById('xtext').innerText = `x = ${x.value}`
})
document.getElementById('add').addEventListener('click', () => {
  x.value += 1
})

watch(
  () => x.value,
  (currentValue, oldValue) => {
    console.log('oldValue:', oldValue, 'currentValue:', currentValue)
  },
  { immediate: true }
)
