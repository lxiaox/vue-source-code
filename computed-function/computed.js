// 实现计算属性computed（接异步更新队列的代码）

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
    if (active) this.deps.add(active)
  }
  notify() {
    this.deps.forEach((dep) => queueJob(dep))
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
let watch = function (cb) {
  active = cb
  active()
  active = null
}

// 增加计算属性
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

watch(() => {
  document.getElementById('xtext').innerText = `x = ${x.value}`
  document.getElementById('ytext').innerText = `y = x*2 = ${y.value}`
})
document.getElementById('add').addEventListener('click', () => {
  x.value += 1
})
