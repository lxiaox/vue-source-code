// set和ref函数代码差不多，可以合并为cerateReactive函数复用

let createReactive = (target, prop, value) => {
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

let ref = (initValue) => createReactive({}, 'value', initValue)

let set = (target, prop, initValue) => createReactive(target, prop, initValue)
