/**
 * 如何管理依赖？
 * 依赖管理器 Dep 类
 * 
 * 将数据变成可观测之后,就知道了数据什么时候变化，数据被获取时触发get，数据发生变化时触发set
 * 在get中收集依赖，谁依赖了这个数据(即谁用到了这个数据)我们就把谁放入这个依赖数组(数据可能在多个地方被依赖)中
 * 在set中通知依赖更新
 * 单单用一个数组来存放依赖的话，功能好像有点欠缺并且代码过于耦合
 * 我们应该为每一个数据都建立一个依赖管理器，把这个数据所有的依赖都管理起来
 */
export default class Dep {
  static target: any = globalThis.target; // 取 Watcher 存放的依赖者
  subs: Array<any>;
  constructor() {
    this.subs = [];
  }
  // 添加依赖
  addSub(sub: any): void {
    this.subs.push(sub);
  }
  depend(): void {
    if (Dep.target) {
      Dep.target.addDep(this);
    }
  }
  // 删除依赖
  removeSub(sub: any): void {
    remove(this.subs, sub);
  }
  // 通知依赖更新
  notify(){
      const subs: Array<any> = this.subs.slice(); // 不改变原数组，浅拷贝
      for (const sub of subs) { // 遍历Watcher订阅者(subs依赖者实例数组)
        sub.update() // watcher实例上的依赖 watcher.update()
      }
  }
}

/**
 * 删除依赖
 * @param subs
 * @param sub
 */
export function remove(subs: Array<any>, sub: any): Array<any> | void {
  if (subs.length > 0) {
    const index = subs.indexOf(sub);
    if (index > -1) {
      return subs.splice(index, 1);
    }
  }
}
