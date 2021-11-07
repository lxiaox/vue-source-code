// set和ref函数代码差不多，可以合并为cerateReactive函数复用

// 这里只考虑ref(基本类型)的情况

//使用Object.defineProperty
const createReactive = (target, prop, value) => {
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

const ref = (initValue) => createReactive({}, 'value', initValue)

const set = (target, prop, initValue) => createReactive(target, prop, initValue)

let obj = ref(0)
set(obj, a, 'aaa') // 给对象增加属性，需要用set，不然无法监听

let arr = []
set([], 0, 0) // 修改数组增加，也需要set，不然无法监听

/******************************* 使用proxy *******************************/
/******************************* 使用proxy *******************************/
/******************************* 使用proxy *******************************/

const createReactive = (target) => {
  return new Proxy(target, {
    get(target, prop) {
      return Reflect.get(target, prop)
    },
    set(target, prop, value) {
      Reflect.set(target, prop, value)
    },
  })
}

// ref

// proxy的ref方法要改造一下，不能像createReactive({}, 'value', initValue)这样传一个空{}，把属性和值穿进去，这样子是增加不了value属性的

// const ref = (initValue) => createReactive({}, 'value', initValue)
// let a = ref(0)  // a: Proxy{}

// 因为使用Object.property是调用Object.property()，它使用ref或者set会直接调用，增加对象属性

// 但是Proxy是一个构造函数，它是使用new Proxy()返回一个实例，但是new的时候是不会添加属性进去的。只能通过obj.a='a'这种方式增加属性。

// 同样的，Proxy也不需要vue.$set，使用vue.$set(obj,a,'a')也没办法增加属性

// 正确ref
const ref = (initValue) => {
  return createReactive({ value: initValue })
}

let a = ref(0)
a.name = 'aaa' // 对象可以直接添加属性，可以监听

// set

// ❌ Proxy不需要set，它本身可以监听每一项

// 修改数组直接使用 arr[0] = 0
