import VNode from "../vdom/vnode";
import { arrayMethods } from "./array";
import { hasProto, isObject, hasOwn } from "../util/index";
import Dep from "./dep";

const arrayKeys: Array<string> = Object.getOwnPropertyNames(arrayMethods);

/**
 * Observer 观察者类
 * vue 响应式系统机制，数据驱动，依赖收集
 * 原理：vue2使用Object.defineProperty()对象属性级别的拦截，为每个属性设置getter/setter
 */
export class Observer {
  value: any;
  constructor(value: any) {
    this.value = value; //拿到需要做成响应式的数据(状态)
    // 标记此value已经被搞成响应式了,避免重复操作，值为该value的Observers实例
    def(value, "__ob__", this);
    // 因为defineProrerty是Object原型上的方法,Array无法使用这个方法,所以对象与数组有不同的观测机制
    if (Array.isArray(value)) {
      // Array 类型处理逻辑
      // 使 Array 可观测，原理：定义数组方法拦截器，重写Array原型中改变数组自身内容的方法的7个方法
      hasProto
        ? protoAugment(value, arrayMethods)
        : copyAugment(value, arrayMethods, arrayKeys);
      this.observeArray(value);
    } else {
      // Object 类型处理逻辑
      this.walk(value);
    }
  }
  /**
   * 观测 Object：遍历对象的所有属性为其添加get/set
   * @param obj
   */
  walk(obj: Object) {
    const keys: any = Object.keys(obj);
    for (const key in keys) {
      // 过滤自身以外的属性 即不遍历原型上的属性
      if (Object.prototype.hasOwnProperty.call(keys, key)) {
        defineRreactive(obj, key);
      }
    }
  }
  /**
   * 观测 Array：遍历数组中每一项为其添加响应式
   * @param items
   */
  observeArray(items: Array<any>) {
    for (const item of items) {
      observe(item);
    }
  }
}

/**
 * helpers 提炼出一些处理函数
 */

/**
 * 如果支持__proto__访问prototype原型对象，则拦截
 * 将源对象的 __proto__ 指向目标对象 value.__proto__ = arrayMethods
 * @param target
 * @param src
 */
function protoAugment(target: Array<any>, src: Object): void {
  /* eslint-disable no-proto */
  target.__proto__ = src;
  /* eslint-enable no-proto */
}

/**
 * 如果不支持__proto__访问prototype原型对象，则把拦截器中重写的7个方法循环加入到value上
 * @param target
 * @param src
 * @param keys
 */
function copyAugment(target: Object, src: Object, keys: Array<string>): void {
  for (const key of keys) {
    def(target, key, src[key]);
  }
}

/**
 * 为 value 创建一个 observer 观察者实例
 * 如果实例化成功返回这个新 observer
 * 如果是已经是响应式了，即已经被观测了是 observer 的实例了，则直接返回此实例
 * @param value
 */
export function observe(value: any): Observer | void {
  // 如果value不是非null非function的引用类型(Object,Array,RegExp,Date) 或者 是一个Virtual DOM虚拟节点类型，直接结束程序
  // 排除 null class{} function  VNode
  if (!isObject(value) || value instanceof VNode) {
    return;
  }
  let ob: Observer | void;
  // 如果已经观测了，已经是响应式了，则返回
  if (hasOwn(value, "__ob__") && value.__ob__ instanceof Observer) {
    ob = value.__ob__;
  } else {
    ob = new Observer(value);
  }
  return ob;
}

/**
 * 为某个对象添加一个属性(key:value)
 * @param obj
 * @param key
 * @param val
 * 知识点：for, for...in, for...of, forEach, map对比
 * for:
 * 可遍历数组，字符串；typeof index or key = number, 不可遍历自定义或原型链上的自定义属性
 * for...in:
 * 以原始插入顺序访问对象的可枚举属性，包括从原型继承而来的可枚举属性。
 * 可遍历对象，数组，字符串(所有的), typeof index or key = string, 可遍历自定义或原型链上的自定义属性
 * 根据属性名，数组索引遍历，key，index为string，遍历数组时不一定会按照数组的索引顺序
 * 更适合遍历对象，当不想遍历原型链上的属性时可使用 Object.hasOwnProperty() 过滤自身以外的属性
 * for...of: (常用)
 * ES6 中引入，以替代 for...in 和 forEach() ，并支持新的迭代协议。
 * 可遍历数组，字符串,typeof index or key = number,不可遍历自定义或原型链上的自定义属性。
 * 根据值遍历，弥补for...in不能根据值遍历的不足，ES6语法，兼容性不好
 * 允许遍历 Array（数组）, String（字符串）, Map（映射）, Set（集合）,TypedArray，arguments 对象等等等可迭代的数据结构等。
 * 遍历Map时，可以获得整个键值对对象
 * forEach，map:
 * 只能遍历数组，typeof index or key = number，不可遍历自定义或原型链上的自定义属性
 * 根据index遍历，forEach从头遍历到尾，不能使用break、continue跳出循环体，for 可以;
 * map返回一个新数组,新数组的内容是回调函数的返回值，可以用来克隆数组
 * map参数->map((当前元素,当前索引,当前被调用的数组)=>{})
 *
 * 知识点: 对象的四个特性：value，writable，enumerate，configurable
 * 获取一个对象的属性的四大特性方式：Object.getOwnPropertyDescriptor(obj,key)
 * 修改一个对象的属性的四大特性法方式：Object.defineProperty(obj,key,{})
 * 同时修改多个属性的四大特性的方式: Object.defineProperties(obj,{key:{}})
 */
export function def(obj: Object, key: string, val?: any): void {
  Object.defineProperty(obj, key, {
    value: val, // 值：对象可以通过.语法访问其属性值
    writable: true, // 可写性：控制值value是否可以修改，默认true可修改
    enumerable: false, // 可枚举性：控制是否可以被for...in遍历到，默认true不能被for...in 遍历此属性(key)，但可用.语法访问
    configurable: true, // 可配置性：控制是否可以修改其他特性，是否可以删除属性，修改不可逆，默认true
  });
}

/**
 * defineRreactive
 * 为对象的属性定义响应式（核心）
 * @param obj
 * @param key
 * @param val
 */
export function defineRreactive(obj: Object, key: string, val?: any): void {
  // 如果是不可配置属性，则搞不了响应式，直接结束程序
  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }
  // 参数处理，只传了obj和key，那么val = obj[key]
  if (arguments.length === 2) {
    val = obj[key];
  }
  // obj对象里嵌套对象,递归添加响应式, 深度侦测 Object
  if (typeof val === "object") {
    new Observer(val);
  }
  const dep:Dep = new Dep();
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter(): any {
      // 在get中收集依赖
      dep.depend();
      return val;
    },
    set: function reasctiveSetter(newVal: any): void {
      // 在set中通知依赖
      if (val === newVal) {
        return;
      }
      val = newVal;
      dep.notify();
    },
  });
}


