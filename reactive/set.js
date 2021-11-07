// 使用Object.defineProperty不能监听一个ref对象新增的属性，所以需要vue.set方法实现。

let set = (target, prop, initValue) => {
  let value = initValue
  let dep = new Dep()
  return Object.defineProperty(target, prop, {
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

// 使用：

// 监听对象的新增属性
let x = ref(1)
//x.a = 100
set(x, 'a', 'aaa') // 添加监听，注意：这里是不会出发Object.defineProperty里面的set的，也就不会通知依赖更新。这里调用set()进而createReactive()进而调用Object.defineProperty(),在里面定义get、set。
x.a = 'a1' // 后面修改属性就可以触发依赖更新了

// 监听修改数组，实现数组各项的监听
let a = [1]
set(a, 1, 10) // 监听a[1]不触发依赖更新
//或
let a = set([0], 1, 10)

a[1] = 100 // 修改a[1]，触发依赖更新
