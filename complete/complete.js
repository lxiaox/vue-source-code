// 包含ref、异步更新队列、watchEffect、watch、computed、set、createReactive、数组方法push的包装 的完整代码：

// 并且增加监听(数组)的原型处理

let x, y, arr, active

// 异步更新队列
let queue = []
const nextTick = (cb) => Promise.resolve().then(cb)
const flushJob = () => {
  let job
  while (queue.length > 0) {
    job = queue.shift()
    job && job()
  }
}
const queueJob = (dep) => {
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

// 获取数组原型
let arrayMethods = Object.create(Array.prototype)

// 代理包装array.push方法
const push = Array.prototype.push
arrayMethods.push = function (...args) {
  push.apply(this, [...args])
  this._dep.notify()
}

// createReactive
const createReactive = (target, prop, value) => {
  target._dep = new Dep()
  // 监听(一个数组)时需要给ref对象添加Array的原型
  if (Array.isArray(target)) {
    target.__proto__ = arrayMethods
  }
  return Object.defineProperty(target, prop, {
    get() {
      target._dep.depend()
      return value
    },
    set(newValue) {
      value = newValue
      target._dep.notify()
    },
  })
}

// ref函数实现响应式数据
const ref = (initValue) => {
  return createReactive({}, 'value', initValue)
}

// set监听对象新增属性、修改数组
const set = (target, prop, initValue) => {
  return createReactive(target, prop, initValue)
}

// watchEffect监听新增的依赖，更新响应事件
const createEffect = (fn, options = {}) => {
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
const cleanUpEffect = (effect) => {
  const { depsArr } = effect
  depsArr.forEach((deps) => {
    deps.delete(effect)
  })
}
const watchEffect = function (cb) {
  let runner = createEffect(cb)
  runner()
  return () => {
    cleanUpEffect(runner)
  }
}

// 实现watch
const watch = (source, cb, options = {}) => {
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
const computed = (cb) => {
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

/*************************** 以下为应用部分 ************************/

// 添加响应式数据
x = ref(1)
y = computed(() => {
  return x.value * 2
})
arr = []
set(arr, 0, 0)

// 监听x响应
watchEffect(() => {
  document.getElementById('xtext').innerText = `x = ${x.value}`
  document.getElementById('ytext').innerText = `y = x*2 = ${y.value}`
})
watch(
  () => x.value,
  (currentValue, oldValue) => {
    console.log('oldValue:', oldValue, 'currentValue:', currentValue)
  },
  { immediate: true }
)
// 监听arr响应
watchEffect(() => {
  document.getElementById('arrtext').innerText = `${arr.join(',')}`
})

// 修改x，触发响应
document.getElementById('addX').addEventListener('click', () => {
  x.value += 1
})
// 修改数组arr，触发响应
let v1 = 1,
  v2 = 1
document.getElementById('editArr').addEventListener('click', () => {
  arr[0] = v1++
})
document.getElementById('pushArr').addEventListener('click', () => {
  arr.push(v2++)
})
