// 数据响应式

// 从0到1，手动实现简易响应式，记录思路和过程

/**  需求：比如，现在有2个变量x=1，y=x*100，需要做到当x变化时，y自动变化并log(y)。 */

// 首先把x叫做监测变量，把y随x改变做的响应变动称为y的响应事件

// 分析：需要x变化时y进行响应，很容易想到可以在Object.defineProperty的set函数进行。那么x就要定义为一个对象。

// let x,y
// x = Object.defineProperty({}, "value", {
//   get() {
//     return value;
//   },
//   set(newValue) {
//     value = newValue;
//     y = value * 100;
//     console.log("y: " + y);
//   },
// });
// x.value = 1;

/************************  增加需求：定义其他监测变量。 ********************/

// 把赋值的这段代码重复多次不可取，可以将之封装成一个代理引用函数ref进行复用，还可以让ref接受初始值。

// let y
// let ref = (initValue) => {
//   let value = initValue
//   return Object.defineProperty({}, 'value', {
//     get() {
//       return value
//     },
//     set(newValue) {
//       value = newValue
//       y = value * 100
//       console.log('y：' + y)
//     },
//   })
// }
// let x = ref(1)
// x.value = 2
// let a = ref(10)
// a.value = 20

/************************  增加需求：改变响应事件。 ***********************/

// 把响应事件的内容直接写在ref函数里，显得代码结构不清晰，修改时也比较麻烦，难以维护，所以将响应事件的代码提取出来，封装一个函数active()，在ref里只需要调用active()。

// active() 可以是 y = x*100这段代码，也可以是z = x+100这段代码，所以可以封装一个onXChanged函数，将不同的响应事件赋给active。

// let x, y, z, active
// let onXChanged = function (cb) {
//   active = cb
//   active() // 初始调用一次
// }

// let ref = (initValue) => {
//   let value = initValue
//   return Object.defineProperty({}, 'value', {
//     get() {
//       return value
//     },
//     set(newValue) {
//       value = newValue
//       active()
//     },
//   })
// }

// x = ref(1)

// // 添加y的响应事件
// onXChanged(() => {
//   y = x.value * 100
//   console.log('y: ' + y)
// })
// x.value = 2

// // 改成z的响应事件
// onXChanged(() => {
//   z = x.value + 100
//   console.log('z: ' + z)
// })
// x.value = 3

/**********************  增加需求：同时响应多个事件。 ********************/

// 把不同响应事件的内容都放在一个函数，逻辑太混乱，显然不可取。
// 应该把1个响应事件作为1个单独的函数，再把这些函数都收集起来，作为一个dep数组。

// 怎么操作呢？之前是通过onXChanged方法添加或改变响应事件active的，现在依然可以，只是要把active历史都收集起来。

// 在哪里收集呢？这里就发现每一次调用onXChanged，就修改一次active，并且都会访问一次x.value，也就是说会触发x的get函数，所以可以在get函数里收集，给dep数组push一下这个新的active函数就可以了。

// 同样的在set里面响应，就遍历这个dep数组去调用每一个响应函数就可以了。

// 在ref函数里给dep数组push新的active和遍历调用，不如将dep数组变成一个dep对象，自带增加active 和 遍历调用的方法，到时候在ref函数里只要直接调用def对象提供的方法，更直观清晰。

// 怎么实现dep对象呢？可以使用class，有值、有方法属性。还可以去重。

let x, y, z, active
let onXChanged = function (cb) {
  active = cb
  active()
  active = null // 因为每访问一次x就会收集一次active，所以收集过了的就置为空。
}

class Dep {
  constructor() {
    this.deps = new Set() // 去重
  }
  depend() {
    if (active) this.deps.add(active) // 依赖收集
  }
  notify() {
    this.deps.forEach((dep) => dep()) // 通知响应
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

// 添加y的响应事件
onXChanged(() => {
  y = x.value * 100
  console.log('y = ' + y)
})
// 添加z的响应事件
onXChanged(() => {
  z = x.value + 100
  console.log('z = ' + z)
})
// 添加改变DOM的响应事件
onXChanged(() => {
  document.write(`x = ${x.value}<hr>`)
})
onXChanged(() => {
  document.write(`x + 100 = ${x.value + 100}<hr>`)
})

x.value = 2
x.value = 3
