// vue2是不会对数组每一项都监听，要响应修改需要使用set

// 而对push、pop、shift、unshift、splice、sort、reverse等数组方法则是进行了代理包装，下面以push为例

// 思路：在数组调用push方法的时候要进行一次广播通知依赖更新，也就是调用监听对象的dep.notify()

// 首先改造createActive，把dep加到ref对象的属性上，这样数组调用push方法就可以获取到dep，进行notify

let createReactive = (target, prop, value) => {
  target._dep = new Dep()
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
// 包装push，调用push的时候触发notify

let push = Array.prototype.push

Array.prototype.push = function (...args) {
  push.apply(this, [...args])
  this._dep && this._dep.notify()
}

// 在使用Proxy时可以监听数组每一项，a[i]修改可以监听，也不需要包装push等方法
