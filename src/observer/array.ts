/**
 * 重写数组原型上的方法
 * 可以改变数组的7个方法
 */

const arrayProto: Object = Array.prototype
export const arrayMethods: Object = Object.create(arrayProto)

const methodsToPatch: Array<string> = [
    'push',
    'pop',
    'shift',
    'unshift',
    'splice',
    'sort',
    'reverse'

]