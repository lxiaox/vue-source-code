// 异步更新队列

// 当一个模板中依赖多个变量时，每一个变量修改都会引起一次模板渲染，无疑影响性能，那么就要通过异步更新队列进行优化。

// 接响应式的代码，增加两个ref，修改函数名onXChanged为watch。

/** *
let x, y, z, active
let watch = function (cb) {
  active = cb
  active()
  active = null
}

class Dep {
  constructor() {
    this.deps = new Set()
  }
  depend() {
    if (active) {
      this.deps.add(active)
    }
  }
  notify() {
    this.deps.forEach((dep) => dep())
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

x = ref(1)
y = ref(2)
z = ref(3)

let str
watch(() => {
  let str = `x = ${x.value} | y =${y.value} | z =${z.value}`
  document.write(str + '<hr>')
  console.log(str)
})

x.value = 100
y.value = 100
z.value = 100
// */

// 执行结果：打印了三次，模板渲染了三次。

/**************************** 现在进行优化  ***************************/

// 把响应事件添加到微任务队列，而不是马上执行，所以在deps依赖对象里的notify（通知响应）函数不直接执行，而是收集，收集到一个数组queue中，通过queueJob方法进行收集

let x, y, z, active
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
    nextTick(flushJob) // 这里暂时理解为压入一个任务要执行一次，压入多个任务后面的就会覆盖前面的。
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

x = ref(1)
y = ref(2)
z = ref(3)

// let str
watch(() => {
  let str = `x = ${x.value} | y =${y.value} | z =${z.value}`
  document.write(str + '<hr>')
  console.log(str)
})
// watch(() => {
//   console.log(x.value)
// })
// watch(() => {
//   console.log(y.value)
// })
// watch(() => {
//   console.log(z.value)
// })

x.value = 100
y.value = 200
z.value = 300

// console.log(queue)
// 只有第一个watch的时候，queue队列只有1个任务。因为x y z各有一个dep，都是 [active] 同一个active函数，x y x 修改的时候，各自将active压入queue数组，active相同所以只会压入第一次。
// 有第234个watch的时候，queue有4个任务。
