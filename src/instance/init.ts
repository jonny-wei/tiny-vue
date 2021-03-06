/**
 * new Vue(options)做了什么事情？
 * 
 * initMixin
 *
 * 给Vue类的原型上绑定_init方法。
 * 同时_init方法的定义也在该函数内部
 */

import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/perf'
import { initLifecycle, callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'
import { extend, mergeOptions, formatComponentName } from '../util/index'
 
let uid = 0;

export function initMixin(Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this;
    // a uid
    vm._uid = uid++;

    let startTag, endTag;
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== "production" && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`;
      endTag = `vue-perf-end:${vm._uid}`;
      mark(startTag);
    }

    // a flag to avoid this being observed
    vm._isVue = true;
    /**
     * merge options
     * 动态选项合并非常慢
     */
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options);
    } else {
      /**
       * mergeOptions(重点)
       * 把用户传递的options选项与当前构造函数的options属性
       * 及其父级构造函数的options属性进行合并,
       * 得到一个新的options选项赋值给$options属性，
       * 并将$options属性挂载到Vue实例上
       */
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      );
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== "production") {
      initProxy(vm);
    } else {
      vm._renderProxy = vm;
    }
    // expose real self
    vm._self = vm;
    initLifecycle(vm); // 初始化生命周期
    initEvents(vm); // 初始化事件
    initRender(vm); // 初始化渲染
    callHook(vm, "beforeCreate"); // 调用生命周期钩子函数
    initInjections(vm); // resolve injections before data/props // 初始化 injections
    initState(vm); // 初始化 props, methods, data, computed, watch
    initProvide(vm); // resolve provide after data/props  // 初始化 provide
    callHook(vm, "created"); // 调用生命周期钩子函数

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== "production" && config.performance && mark) {
      vm._name = formatComponentName(vm, false);
      mark(endTag);
      measure(`vue ${vm._name} init`, startTag, endTag);
    }
    /**
     * 最后，判断用户是否传入了el选项，
     * 如果传入了则调用$mount函数进入模板编译与挂载阶段，
     * 如果没有传入el选项，则不进入下一个生命周期阶段，
     * 需要用户手动执行vm.$mount方法才进入下一个生命周期阶段。
     */
    if (vm.$options.el) {
      vm.$mount(vm.$options.el);
    }
  };
}
