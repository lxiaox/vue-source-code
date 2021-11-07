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
let x = ref(1)
//x.a = 100
set(x, 'a', 100)
