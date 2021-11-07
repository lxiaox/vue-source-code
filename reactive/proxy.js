// 使用Proxy
let ref = (initValue) => {
  let def = new Dep()
  return new Proxy(
    { value: initValue },
    {
      get(target, prop) {
        dep.depend()
        return Reflect.get(target, prop)
      },
      set(target, prop, value) {
        Reflect.set(target, prop, value)
        dep.notify()
      },
    }
  )
}

// 原Object.defineProperty
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
