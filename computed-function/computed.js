let x, y, active
let watch = function (cb) {
  active = cb
  active()
  active = null
}
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
// let str
watch(() => {
  document.getElementById('xtext').innerText = `x = ${x.value}`
  document.getElementById('ytext').innerText = `y = x*2 = ${y.value}`
})
document.getElementById('add').addEventListener('click', () => {
  x.value += 1
})
