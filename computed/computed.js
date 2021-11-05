// 接watchEffect的代码，
// 1实现计算属性 使用get关键字

// 2实现计算属性的缓存
// 作用：减少计算次数，提高性能。

// 例如y是依赖x的计算属性，但是即使x没有发生变化，每次访问y都会重新计算，其实y的结果是没有变化的，没必要重新计算消耗性能。

// 所以就需要缓存：当x没有变化时y不会重新计算，使用原来的值；当x变化了再重新计算值。

// 这里的缓存指的不是想缓存函数那样把原来的值存起来，只是阻止计算就行了。

// 思路：设置一个缓存标识dirty表示脏数据（脏了的数据就需要重新计算），一开始dirty值为true，表示需要重新计算，当y的计算函数执行之后，dirty值置为false，表示不需要计算。当x值发生变化后再将dirty置为true，再次访问y时就需要重新计算。

// x修改后dirty置为true的思路：之前y是没有监听x的，无法关联x的修改，所以将y的计算函数加入x的effect中，通过effect的options的schedular修改。

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
      // else {
      //   console.log('y缓存了')
      // }
      return v
    },
  }
}

x = ref(1)
y = computed(() => {
  // console.log('y重新计算了')
  return x.value * 2
})
// setTimeout(() => {
//   console.log(y.value)
// }, 1000)
// setTimeout(() => {
//   console.log(y.value + 1)
// }, 3000)
// setTimeout(() => {
//   console.log(y.value + 2)
// }, 5000)

watchEffect(() => {
  document.getElementById('xtext').innerText = `x = ${x.value}`
  document.getElementById('ytext').innerText = `y = x*2 = ${y.value}`
})
document.getElementById('add').addEventListener('click', () => {
  x.value += 1
})
