import Dep from "./dep";

/**
 * 依赖到底是谁？
 * Watcher 类
 *
 * 之前对object和array数据分别进行了观测，利用Object.defineProperty()为其属性和元素添加响应式机制,使数据变得可观测
 * 知道了数据何时发生了变化以及何时通知依赖更新
 * 明白在get中触发依赖收集，在set中触发依赖更新
 * 为了使代码解耦,提供接口等因素用一个Dep类(依赖管理器)代替依赖数组管理依赖
 * 在依赖管理器中添加依赖，删除依赖，以及通知依赖更新，核心方法就是 update()
 * 剩下的问题就是：我们在get中收集的依赖到底是谁的问题
 * 口语层面我们可以说：“谁用到了这个数据谁就是依赖”，那么在代码层面该如何表示呢？
 *
 * vue为此封装了一个 Watcher 类：
 * 谁用到了数据，谁就是依赖，我们就为谁创建一个Watcher实例
 * 之后数据变化时，我们不直接去通知依赖更新，而是通知依赖对应的Watcher实例，由Watcher实例去通知真正的视图/依赖更新。
 * 在创建Watcher实例的过程中会自动的把自己添加到这个数据对应的依赖管理器中，
 * 以后这个Watcher实例就代表这个依赖，当数据变化时，我们就通知Watcher实例，由Watcher实例再去通知真正的依赖。
 *
 * 以下放的是伪代码(学习目的)
 *
 * 一个解析expression的watcher，用于依赖收集，并在expression更新时触发回调，通知依赖更新
 * 它可以用于$watch() api 和 directives 指令中
 *
 * vue官方api
 * vm.$watch( expOrFn, callback, [options] ) options: {deep?: boolean, immediate?: boolean}
 * 观察 Vue 实例上的一个表达式或者一个函数计算结果的变化。回调函数得到的参数为新值和旧值。
 * 表达式只接受简单的键路径。对于更复杂的表达式，用一个函数取代。
 * 注意：在变更 (不是替换) 对象或数组时，旧值将与新值相同，因为它们的引用指向同一个对象/数组。Vue 不会保留变更之前值的副本。
 * // 键路径
 * vm.$watch('a.b.c', function (newVal, oldVal) {
 *      // 做点什么
 * })
 * vm.$watch 返回一个取消观察函数，用来停止触发回调：
 * var unwatch = vm.$watch('a', cb)
 * unwatch()// 之后取消观察
 * 查看 https://cn.vuejs.org/v2/api/#vm-watch
 * 
 * 简单总结：
 * Watcher先把自己设置到全局唯一的指定位置（window.target），然后读取数据。
 * 因为读取了数据，所以会触发这个数据的getter。
 * 接着，在getter中就会从全局唯一的那个位置读取当前正在读取数据的Watcher，并把这个watcher收集到Dep中去。
 * 收集好之后，当数据发生变化时，会向Dep中的每个Watcher发送通知。
 * 通过这样的方式，Watcher可以主动去订阅任意一个数据的变化。
 * window.target是关键节点，承上启下
 */
export default class Watcher {
  vm: Component; // 组件实例
  cb: Function; // 回调函数
  getter: Function; // getter方法
  value: any; // value
  deps: Array<Dep>; // 依赖收集数组
  constructor(vm: Component, expOrFn: string | Function, cb: Function) {
    this.vm = vm;
    this.cb = cb;
    // getter的解析表达式 a.b.c
    if (typeof expOrFn === "function") {
      this.getter = expOrFn;
    } else {
      this.getter = parsePath(expOrFn);
    }
    this.value = this.get();
  }

  /**
   * 触发依赖收集(Watcher核心)
   */
  get(): any {
    // 首先通过window.target = this把实例自身赋给了全局的一个唯一对象window.target上
    globalThis.target = this;
    const vm = this.vm;
    /**
     * 目的是触发该数据上面的getter，进而触发getter中的dep.depend()收集依赖（在get中收集依赖）
     * 在Dep类中dep.depend()中取到挂载window.target上的值并将其存入依赖数组中
     * 进而就达到了我们的第一个目的：
     * 触发依赖收集
     */
    let value = this.getter.call(vm, vm);
    globalThis.target = undefined; // 释放
    return value;
  }

  /**
   * 为当前指令添加一个依赖
   * @param dep
   */
  addDep(dep: Dep): void {
    dep.addSub(this);
  }

  /**
   * 清除依赖收集
   */
  cleanupDep(): void {
    let i: number = this.deps.length;
    while (i--) {
      const dep = this.deps[i];
      dep.removeSub(this);
    }
  }

  /**
   * 更新依赖(Watcher核心)
   * 触发依赖更新
   * 订阅者接口，当一个依赖变化时调用
   * 
   * 当数据变化时，会触发数据的setter，在setter中调用Dep类的dep.notify()方法，
   * 在dep.notify()方法中，遍历所有依赖(即依赖数组，watcher实例，依赖的到底是谁？ 就是这个watcher实例)，
   * 遍历所有依赖，执行依赖的update()方法，也就是Watcher类中的update()实例方法，(watcher.update())
   * 在update()方法中调用数据变化的更新回调函数，从而更新视图。
   */
  update(): void {
    const oldValue = this.value; // 旧值
    this.value = this.get(); // 新值
    this.cb.call(this.vm, this.value, oldValue); // 触发回调更新视图
    // queueWacher(this) // vue源码的做法是放入一个队列中
  }

  run(): void {}

  evaluate(): void {}

  depend(): void {}

  teardown(): void {}
}

class Component {
  constructor() {}
}

/**
 * 用于解析html标记、组件名称和属性路径的unicode字母。
 */
export const unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/;

/**
 * 解析路径
 * 把一个形如'data.a.b.c'的字符串路径所表示的值，从真实的data对象中取出来
 * data = {a:{b:{c:2}}}
 * parsePath('a.b.c')(data)  // 2
 */
const bailRE = new RegExp(`[^${unicodeRegExp.source}.$_\\d]`);
export function parsePath(path: string): any {
  if (bailRE.test(path)) {
    return;
  }
  const segments = path.split(".");
  return function (obj) {
    for (let i = 0; i < segments.length; i++) {
      if (!obj) return;
      obj = obj[segments[i]];
    }
    return obj;
  };
}
