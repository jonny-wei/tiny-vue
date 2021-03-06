/**
 * vue实例的存亡
 * 
 * vue 生命周期
 * 
 * vue从创建到销毁的过程称为Vue实例的生命周期(这期间会发生诸如数据观测，模板编译，组件挂载的事情)
 * 在Vue实例生命周期的不同阶段Vue提供了不同的钩子函数，以方便用户在不同的生命周期阶段做一些额外的事情。
 * 
 * Vue实例的生命周期大致可分为4个阶段：
 * 初始化阶段：为Vue实例上初始化一些属性，事件以及响应式数据；(brforeCreate,created)
 * 模板编译阶段：将模板编译成渲染函数；
 * 挂载阶段：将实例挂载到指定的DOM上，即将模板渲染到真实DOM中；(beforeMount,mounted)(已挂载：beforeUpdate，updated)
 * 销毁阶段：将实例自身从父组件中删除，并取消依赖追踪及事件监听器；(boeforeDestory,destoryed)
 */

import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)

export default Vue
