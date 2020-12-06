/**
 * 封装一些由运行环境决定的逻辑
 */

 /**
  * 当前环境下的Object是否支持__proto__(隐式原型)属性，指向构造函数的prototype(显示原型)对象
  */
export const hasProto = '__proto__' in {}