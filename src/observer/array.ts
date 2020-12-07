/**
 * 重写数组原型上的方法
 * 可以改变数组的7个方法
 *
 * 知识点：常用数组方法操作Api
 *
 * 添加
 * push: 将一个或者多个元素添加至数组末尾处，并返回数组长度。
 * unshift: 将一个或多个元素添加到数组到开头，并返回数组长度。
 *
 * 删除
 * pop: 从数组中删除最后一个元素，若对空数组调用 pop 则返回 undefined ，会更改源数组。
 * shift: 删除数组中第一个元素，若空数组返回 undefined ，会更改源数组。
 * delete: 删除数组元素，会让数组中出现 undefined , 很少使用。
 *
 * 替换/删除/指定位置添加
 * splice：一个功能强大的函数，它可以通过删除/替换/添加，的方式修改数组，并返回修改的内容（以数组的格式）
 *          splice(start: 开始位置。,deleteCount:除的数组元素的个数。,
 *          item1, item2, ... 要添加进数组的元素,从start 位置开始。如果不指定，则 splice() 将只删除数组元素。)
 *
 * 复制拷贝
 * slice：由 begin 和 end 决定,浅拷贝源数组，返回一个新的数组对象。animals.slice(2, 4)
 *
 * 合并
 * concat：用于合并两个或多个数组，不会更改现有数组，会返回一个新的数组。
 * [...arr1,...arr2]：不会更改源数组，解构运算符也可以把 Set 转为数组。
 * flat：多维数组合并，返回一个新的数组。{
 *   //合并多维数组
 *   [1,2,[3,[4,[5,6]]]].flat('Infinity'); //=> [1,2,3,4,5,6]
 *   //移除数组空项
 *   let arr = [1, 2, , 5]; let newArr = arr.flat(); console.log(newArr); //=> [1, 2, 5]
 * }
 *
 * 数组迭代（循环）
 * forEach: 遍历数组，对每个元素执行一次函数，不会更改源数组，也不会创建新数组, 单纯的遍历。
 *          不可遍历自定义或原型链上的自定义属性,不能使用break、continue跳出循环体
 * map： 遍历数组，对每个元素执行一次函数，不会更改源数组，会创建一个新数组。
 * filter: 遍历数组，对每个元素执行一次函数，返回满足规则的元素。
 * every: 遍历数组，对每个元素执行一次函数，用于测试组内元素，是否全部满足指定规则。（每个元素都满足指定规则，则返回true）
 * some: 遍历数组，对每个元素执行一次函数，用于判断组内元素至少有一个元素通过了指定规则。(只要有一个或以上满足指定规则，就返回true)
 * reduce: 对数组中的每个元素执行一个由您提供的reducer函数(升序执行)，将其结果汇总为单个返回值。
 *         可以作为一个高阶函数，用于函数的 compose。注意: reduce() 对于空数组是不会执行回调函数的。
 * reducer 函数接收4个参数:
 *          Accumulator (acc) (累计器)
 *          Current Value (cur) (当前值)
 *          Current Index (idx) (当前索引)
 *          Source Array (src) (源数组)
 * for,for...of,for...in之前有归纳
 *
 * 查找定位
 * indexOf：返回在数组中可以找到一个给定元素的第一个索引。如果不存在，则返回-1。
 * lastIndexOf：返回指定元素（也即有效的 JavaScript 值或变量）在数组中的最后一个的索引，如果不存在则返回 -1。从数组的后面向前查找
 * find：返回数组中满足提供的测试函数的第一个元素的值。否则返回 undefined。
 * findIndex: 返回数组中满足提供的测试函数的第一个元素的索引。若没有找到对应元素则返回-1。
 *
 * 排序
 * sort：数组排序，直接修改原数组，如果不带参数，默认按照数组元素的字母排序，如果是数字则按照大小顺序排列。
 * reserve：将数组中元素的位置颠倒，并返回该数组。数组的第一个元素会变成最后一个，数组的最后一个元素变成第一个。该方法会改变原数组。
 *
 * 数组洗牌：array.sort(()=>{return Math.random() - 0.5})
 * 数组去重：Array.from(new Set(arr))
 *
 * 参考：https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array
 */

import { def, Observer } from "./index";

const arrayProto: Object = Array.prototype; // 继承原型对象
export const arrayMethods: Object = Object.create(arrayProto);

const methodsToPatch: Array<string> = [
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
];

/**
 * 为Array.prototype添加属性 重写7大方法
 * 首先创建了继承自Array原型的空对象arrayMethods，
 * 接着在arrayMethods上使用object.defineProperty方法将
 * 这些可以改变数组自身的7个方法遍历，逐个进行封装重写。
 */
methodsToPatch.forEach(function (method: string): void {
  // 获取原型上的方法
  const original = arrayProto[method];
  def(arrayProto, method, function mutator(...args: any[]): Array<any> | void {
    // 改变this指向 拦截
    const result = original.apply(this, args);
    // 获取Observer实例
    const ob: Observer = this.__ob__;
    let inserted: any[]; // 改变数组的元素,待添加响应式的元素
    switch (method) {
      case "push":
      case "unshift":
        inserted = args;
        break;
      case "splice":
        inserted = args.slice(2); // splice()有3个参数，第三个参数就是需要添加的元素，拷贝它
        break;
    }
    if(inserted) ob.observeArray(inserted); // 调用Observer实例的observeArray方法，遍历数组中每一项(inserted)为其添加响应式
    return result
  });
});
