/**
 * 如何找出新旧两份DOM的差异？
 * 
 * DOM Diff 算法(Virtual DOM 核心--patch “打补丁”)
 * 基于Snabbdom的虚拟DOM补丁算法
 * 
 * 思路
 * 创建节点：newVNode有 oldVNode没有，在旧的oldVNode中创建。
 * 删除节点：newVNode没有 oldVNode有，从旧的oldVNode中删除。
 * 更新节点：newVNode，oldVNode中都有，就以newVNode为准，更新旧的oldVNode。(核心)
 */