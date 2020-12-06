/**
 * 封装一些判断
 */

 /**
  * 判断是否是一个非null的引用类型数据（Object，Array，RegExp）
  * ES规定的6种简单数据类型(原始类型)：undefined，null, Boolean, Number, String, Symbol
  * 1种复杂数据类型(对象)：Object
  * null === undefined --> true
  * typeof {}/[]/null = 'object';
  * typeof function() {} = 'function';
  * typeof class{} = 'function'
  * typeof适合判断原始类型数据(undefined,String,Number,Boolean,Symbol),对null和Object引用类型数据作用不大
  * 如果是引用类型数据和null，会返回'object'，但函数(特殊的Object)会返回'function'
  * 所有引用类型都是 Object 的实例(除Function外,Array,RegExp,Date等等都是特殊的对象) 都返回'object'
  * instanceof 检测引用类型数据和构造函数都返回true，检测原始值始终返回false
  * @param obj 
  */
export function isObject (obj: any): boolean {
    return obj !== null && typeof obj === 'object'
}

/**
 * 判断对象是否有某属性
 * @param obj 
 * @param key 
 */
export function hasOwn (obj: Object | any[], key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key)
}