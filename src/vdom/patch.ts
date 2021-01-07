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
 *
 * 创建节点
 * 思路：VNode类可以描述6种类型的节点，而实际上只有3种类型的节点能够被创建并插入到DOM中，
 * 它们分别是：元素节点、文本节点、注释节点。
 * 所以Vue在创建节点的时候会判断在新的VNode中有而旧的oldVNode中没有的这个节点是属于哪种类型的节点，
 * 从而调用不同的方法创建并插入到DOM中。
 * (1)判断是否为元素节点只需判断该VNode节点是否有tag标签即可。
 * 如果有tag属性即认为是元素节点，则调用createElement方法创建元素节点，
 * 通常元素节点还会有子节点，那就递归遍历创建所有子节点，
 * 将所有子节点创建好之后insert插入到当前元素节点里面，
 * 最后把当前元素节点插入到DOM中。
 * (2)判断是否为注释节点，只需判断VNode的isComment属性是否为true即可，
 * 若为true则为注释节点，则调用createComment方法创建注释节点，再插入到DOM中。
 * (3)如果既不是元素节点，也不是注释节点，那就认为是文本节点，则调用createTextNode方法创建文本节点，再插入到DOM中。
 *
 * 删除节点
 * 思路：如果某些节点在新的VNode中没有而在旧的oldVNode中有，那么就需要把这些节点从旧的oldVNode中删除。
 * 删除节点非常简单，只需在要删除节点的父元素上调用removeChild方法即可
 *
 * 更新节点(重点)
 * 静态节点：纯文字，无变量，数据的变化对其无影响，只要这个节点第一次渲染了，那么它以后就永远不会发生变化，称为静态节点
 * 对以下3种情况进行判断并分别处理：
 * (1) 如果VNode和oldVNode均为静态节点
 * 为静态节点的话则直接跳过，无需处理
 * (2) 如果VNode是文本节点
 * 看oldVNode是否也是文本节点，如果是，那就比较两个文本是否不同，
 * 如果不同则把oldVNode里的文本改成跟VNode的文本一样。
 * 如果oldVNode不是文本节点，那么不论它是什么，
 * 直接调用setTextNode方法把它改成文本节点，并且文本内容跟VNode相同。
 * (3) 如果VNode是元素节点
 * 如果VNode是元素节点，则又细分以下两种情况：
 * (3-1) 该节点包含子节点
 * a).新的节点内包含了子节点，旧的节点里也包含了子节点，那就需要递归对比更新子节点(重点)。
 * b).如果旧的节点里不包含子节点，那么这个旧节点有可能是空节点或者是文本节点，
 * 如果旧的节点是空节点就把新的节点里的子节点创建一份然后插入到旧的节点里面，
 * 如果旧的节点是文本节点，则把文本清空，然后把新的节点里的子节点创建一份然后插入到旧的节点里面。
 * (3-2) 该节点不包含子节点
 * 如果该节点不包含子节点，同时它又不是文本节点，那就说明该节点是个空节点，那就好办了，不管旧节点之前里面都有啥，直接清空即可。
 *
 * 更新子节点(难点)
 * newChildren里面的元素与oldChildren里的元素一一进行对比，对比两个子节点数组肯定是要通过循环，
 * 外层循环newChildren数组，内层循环oldChildren数组，
 * 每循环外层newChildren数组里的一个子节点，就去内层oldChildren数组里找看有没有与之相同的子节点
 * (1) 创建子节点
 * 如果newChildren里面的某个子节点在oldChildren里找不到与之相同的子节点，
 * 那么说明newChildren里面的这个子节点是之前没有的，是需要此次新增的节点，那么就创建子节点。
 * 创建子节点，插入到真实DOM中，寻找合适的插入位置：合适的位置是所有未处理节点之前，而并非所有已处理节点之后
 * (2) 删除子节点
 * 如果把newChildren里面的每一个子节点都循环完毕后，发现在oldChildren还有未处理的子节点，
 * 那就说明这些未处理的子节点是需要被废弃的，那么就将这些节点删除。
 * (3) 移动子节点
 * 如果newChildren里面的某个子节点在oldChildren里找到了与之相同的子节点，但是所处的位置不同，
 * 这说明此次变化需要调整该子节点的位置，那就以newChildren里子节点的位置为基准，
 * 调整oldChildren里该节点的位置，使之与在newChildren里的位置相同。
 * 移动节点，移动到哪：所有未处理节点之前就是我们要移动的目的位置
 * (4) 更新节点
 * 如果newChildren里面的某个子节点在oldChildren里找到了与之相同的子节点，并且所处的位置也相同，
 * 那么就更新oldChildren里该节点，使之与newChildren里的该节点相同。
 *
 * 更新子节点的diff算法优化
 * 双层for循环，算法复杂度较大。
 * vue2采用双端比较算法
 * http://hcysun.me/vue-design/zh/renderer-diff.html
 */

import { isDef, isTrue } from "../../shared/util";
import VNode from "./vnode";

/**
 * 打补丁函数
 * @param backend
 */
export function createPatchFunction(backend: any): void {
  const { nodeOps } = backend;

  /**
   * 创建节点
   * @param vnode
   * @param insertedVnodeQueue
   * @param parentElm
   * @param refElm
   * @param ownerArry
   * @param index
   * VNode 6 种节点类型：文本节点，html元素节点，注释节点，克隆节点，组件节点，函数式组件节点
   * 实际上只有3种类型的节点能够被创建并插入到DOM中，它们分别是：元素节点、文本节点、注释节点
   *
   * 代码中的nodeOps是Vue为了跨平台兼容性，对所有节点操作进行了封装，
   * 例如nodeOps.createTextNode()在浏览器端等同于document.createTextNode()
   */
  function createElm(
    vnode: VNode,
    insertedVnodeQueue: Array<VNode>,
    parentElm: VNode,
    refElm: any,
    ownerArry: any,
    index: Number
  ): void {
    const data = vnode.data;
    const children = vnode.children;
    const tag = vnode.tag;
    // 判断是否为元素节点只需判断该VNode节点是否有tag标签即可
    if (isDef(tag)) {
      vnode.elm = nodeOps.createElement(tag, vnode); // 创建元素节点
      createChildren(vnode, children, insertedVnodeQueue); // 递归遍历创建所有子节点,创建元素节点的子节点
      insert(parentElm, vnode.elm, refElm); // 插入到DOM中
    } else if (isTrue(vnode.isComment)) {
      vnode.elm = nodeOps.createComment(vnode.text); // 创建注释节点
      insert(parentElm, vnode.elm, refElm); // 插入到DOM中
    } else {
      // 既不是元素节点，也不是注释节点，那就认为是文本节点
      vnode.elm = nodeOps.createTextNode(vnode.text); // 创建文本节点
      insert(parentElm, vnode.elm, refElm); // 插入到DOM中
    }
  }

  /**
   * 插入DOM节点
   * @param parent
   * @param elm
   * @param ref
   *
   * 与新创建的组件不同，
   * 重新激活的保持活动的组件不会插入自己
   */
  function insert(parent: VNode, elm: any, ref: VNode) {
    if (isDef(parent)) {
      if (isDef(ref)) {
        if (nodeOps.parentNode(ref) === parent) {
          nodeOps.insertBefore(parent, elm, ref);
        }
      } else {
        nodeOps.appendChild(parent, elm);
      }
    }
  }

  /**
   * 递归遍历创建所有子节点,创建元素节点的子节点
   * @param vnode
   * @param children
   * @param insertedVnodeQueue
   */
  function createChildren(
    vnode: VNode,
    children: Array<VNode>,
    insertedVnodeQueue: Array<VNode>
  ) {
    if (Array.isArray(children)) {
      for (let i = 0; i < children.length; ++i) {
        createElm(
          children[i],
          insertedVnodeQueue,
          null,
          vnode.elm,
          children,
          i
        );
      }
    } else if (isPrimitive(vnode.text)) {
      nodeOps.appendChild(
        vnode.elm,
        nodeOps.createTextNode(String(vnode.text))
      );
    }
  }
}

/**
 * 删除节点
 * @param el
 */
function removeNode(el) {
  const parent = nodeOps.parentNode(el);
  if (isDef(parent)) {
    nodeOps.removeChild(parent, el);
  }
}

/**
 * 更新节点
 * @param oldVnode
 * @param vnode
 * @param insertedVnodeQueue
 * @param removeOnly
 */
function patchVnode(oldVnode, vnode, insertedVnodeQueue, removeOnly) {
  // vnode与oldVnode是否完全一样？若是，退出程序
  if (oldVnode === vnode) {
    return;
  }
  const elm = (vnode.elm = oldVnode.elm);

  // vnode与oldVnode是否都是静态节点？若是，退出程序
  if (
    isTrue(vnode.isStatic) &&
    isTrue(oldVnode.isStatic) &&
    vnode.key === oldVnode.key &&
    (isTrue(vnode.isCloned) || isTrue(vnode.isOnce))
  ) {
    return;
  }

  const oldCh = oldVnode.children;
  const ch = vnode.children;
  // vnode有text属性？若没有：
  if (isUndef(vnode.text)) {
    // vnode的子节点与oldVnode的子节点是否都存在？
    if (isDef(oldCh) && isDef(ch)) {
      // 若都存在，判断子节点是否相同，不同则更新子节点
      if (oldCh !== ch)
        updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly);
    }
    // 若只有vnode的子节点存在
    else if (isDef(ch)) {
      /**
       * 判断oldVnode是否有文本？
       * 若没有，则把vnode的子节点添加到真实DOM中
       * 若有，则清空Dom中的文本，再把vnode的子节点添加到真实DOM中
       */
      if (isDef(oldVnode.text)) nodeOps.setTextContent(elm, "");
      addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
    }
    // 若只有oldnode的子节点存在
    else if (isDef(oldCh)) {
      // 清空DOM中的子节点
      removeVnodes(elm, oldCh, 0, oldCh.length - 1);
    }
    // 若vnode和oldnode都没有子节点，但是oldnode中有文本
    else if (isDef(oldVnode.text)) {
      // 清空oldnode文本
      nodeOps.setTextContent(elm, "");
    }
    // 上面两个判断一句话概括就是，如果vnode中既没有text，也没有子节点，那么对应的oldnode中有什么就清空什么
  }
  // 若有，vnode的text属性与oldVnode的text属性是否相同？
  else if (oldVnode.text !== vnode.text) {
    // 若不相同：则用vnode的text替换真实DOM的文本
    nodeOps.setTextContent(elm, vnode.text);
  }
}

/**
 * 循环更新子节点
 * @param parentElm
 * @param oldCh
 * @param newCh
 * @param insertedVnodeQueue
 * @param removeOnly
 */
function updateChildren(
  parentElm,
  oldCh,
  newCh,
  insertedVnodeQueue,
  removeOnly
) {
  let oldStartIdx = 0; // oldChildren开始索引
  let oldEndIdx = oldCh.length - 1; // oldChildren结束索引
  let oldStartVnode = oldCh[0]; // oldChildren中所有未处理节点中的第一个
  let oldEndVnode = oldCh[oldEndIdx]; // oldChildren中所有未处理节点中的最后一个

  let newStartIdx = 0; // newChildren开始索引
  let newEndIdx = newCh.length - 1; // newChildren结束索引
  let newStartVnode = newCh[0]; // newChildren中所有未处理节点中的第一个
  let newEndVnode = newCh[newEndIdx]; // newChildren中所有未处理节点中的最后一个

  let oldKeyToIdx, idxInOld, vnodeToMove, refElm;

  // removeOnly is a special flag used only by <transition-group>
  // to ensure removed elements stay in correct relative positions
  // during leaving transitions
  const canMove = !removeOnly;

  if (process.env.NODE_ENV !== "production") {
    checkDuplicateKeys(newCh);
  }

  // 以"新前"、"新后"、"旧前"、"旧后"的方式开始比对节点
  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (isUndef(oldStartVnode)) {
      oldStartVnode = oldCh[++oldStartIdx]; // 如果oldStartVnode不存在，则直接跳过，比对下一个
    } else if (isUndef(oldEndVnode)) {
      oldEndVnode = oldCh[--oldEndIdx];
    } else if (sameVnode(oldStartVnode, newStartVnode)) {
      // 如果新前与旧前节点相同，就把两个节点进行patch更新
      patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
      oldStartVnode = oldCh[++oldStartIdx];
      newStartVnode = newCh[++newStartIdx];
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      // 如果新后与旧后节点相同，就把两个节点进行patch更新
      patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
      oldEndVnode = oldCh[--oldEndIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldStartVnode, newEndVnode)) {
      // Vnode moved right
      // 如果新后与旧前节点相同，先把两个节点进行patch更新，然后把旧前节点移动到oldChilren中所有未处理节点之后
      patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
      canMove &&
        nodeOps.insertBefore(
          parentElm,
          oldStartVnode.elm,
          nodeOps.nextSibling(oldEndVnode.elm)
        );
      oldStartVnode = oldCh[++oldStartIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldEndVnode, newStartVnode)) {
      // Vnode moved left
      // 如果新前与旧后节点相同，先把两个节点进行patch更新，然后把旧后节点移动到oldChilren中所有未处理节点之前
      patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
      canMove &&
        nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
      oldEndVnode = oldCh[--oldEndIdx];
      newStartVnode = newCh[++newStartIdx];
    } else {
      // 如果不属于以上四种情况，就进行常规的循环比对patch
      if (isUndef(oldKeyToIdx))
        oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
      idxInOld = isDef(newStartVnode.key)
        ? oldKeyToIdx[newStartVnode.key]
        : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx);
      // 如果在oldChildren里找不到当前循环的newChildren里的子节点
      if (isUndef(idxInOld)) {
        // New element
        // 新增节点并插入到合适位置
        createElm(
          newStartVnode,
          insertedVnodeQueue,
          parentElm,
          oldStartVnode.elm,
          false,
          newCh,
          newStartIdx
        );
      } else {
        // 如果在oldChildren里找到了当前循环的newChildren里的子节点
        vnodeToMove = oldCh[idxInOld];
        // 如果两个节点相同
        if (sameVnode(vnodeToMove, newStartVnode)) {
          // 调用patchVnode更新节点
          patchVnode(vnodeToMove, newStartVnode, insertedVnodeQueue);
          oldCh[idxInOld] = undefined;
          // canmove表示是否需要移动节点，如果为true表示需要移动，则移动节点，如果为false则不用移动
          canMove &&
            nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm);
        } else {
          // same key but different element. treat as new element
          createElm(
            newStartVnode,
            insertedVnodeQueue,
            parentElm,
            oldStartVnode.elm,
            false,
            newCh,
            newStartIdx
          );
        }
      }
      newStartVnode = newCh[++newStartIdx];
    }
  }
  if (oldStartIdx > oldEndIdx) {
    /**
     * 如果oldChildren比newChildren先循环完毕，
     * 那么newChildren里面剩余的节点都是需要新增的节点，
     * 把[newStartIdx, newEndIdx]之间的所有节点都插入到DOM中
     */
    refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm;
    addVnodes(
      parentElm,
      refElm,
      newCh,
      newStartIdx,
      newEndIdx,
      insertedVnodeQueue
    );
  } else if (newStartIdx > newEndIdx) {
    /**
     * 如果newChildren比oldChildren先循环完毕，
     * 那么oldChildren里面剩余的节点都是需要删除的节点，
     * 把[oldStartIdx, oldEndIdx]之间的所有节点都删除
     */
    removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
  }
}
