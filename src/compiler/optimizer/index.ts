/**
 * 优化器
 *
 * 将parserHtml解析出来的AST树遍历，找出其中的静态节点，并打上标记；vue优化之一静态节点patch中不进行diff比较
 *
 * 静态节点：不含任何变量的纯文本节点(一旦第一次被渲染成DOM节点以后，之后不管状态再怎么变化它都不会变了)
 * 静态根节点：包含静态节点的父节点
 * 性能优化：patch过程中不用去对比这些静态节点
 *
 * 优化阶段其实就干了两件事：
 * 在AST中找出所有静态节点并打上标记；
 * 在AST中找出所有静态根节点并打上标记；
 *
 * 优化器的目标:遍历生成的模板AST树和检测纯粹静态的子树，即部分不需要更改的DOM。
 * 把它们变成常量，就不需要了在每次重新渲染时为它们创建新的节点;在修补patch过程中完全跳过它们。
 */

const genStaticKeysCached = cached(genStaticKeys)

export function optimize(root: ?ASTElement, options: CompilerOptions) {
  if (!root) return;
  isStaticKey = genStaticKeysCached(options.staticKeys || "");
  isPlatformReservedTag = options.isReservedTag || no;
  // 标记静态节点
  markStatic(root);
  // 标记静态根节点
  markStaticRoots(root, false);
}

/**
 * 标记静态节点
 * @param node
 * 需从根节点开始，先标记根节点是否为静态节点，然后看根节点如果是元素节点，那么就去向下递归它的子节点
 */
function markStatic(node: ASTNode) {
  node.static = isStatic(node);
  if (node.type === 1) {
    // do not make component slot content static. this avoids
    // 1. components not able to mutate slot nodes
    // 2. static slot content fails for hot-reloading
    if (
      !isPlatformReservedTag(node.tag) &&
      node.tag !== "slot" &&
      node.attrsMap["inline-template"] == null
    ) {
      return;
    }
    for (let i = 0, l = node.children.length; i < l; i++) {
      const child = node.children[i];
      markStatic(child);
      if (!child.static) { // 当前节点的子节点有一个不是静态节点，那就把当前节点也标记为非静态节点
        node.static = false;
      }
    }
    // 标签带有v-if、v-else-if、v-else等指令的节点
    if (node.ifConditions) {
      for (let i = 1, l = node.ifConditions.length; i < l; i++) {
        const block = node.ifConditions[i].block;
        markStatic(block);
        if (!block.static) {
          node.static = false;
        }
      }
    }
  }
}

/**
 * 标记静态根节点
 * @param node
 * @param isInFor
 * 一个节点要想成为静态根节点，它必须满足以下要求：
 * 节点本身必须是静态节点；
 * 必须拥有子节点 children；
 * 子节点不能只是只有一个文本节点；
 * 否则的话，对它的优化成本将大于优化后带来的收益。
 */
function markStaticRoots(node: ASTNode, isInFor: boolean) {
  if (node.type === 1) {
    if (node.static || node.once) {
      node.staticInFor = isInFor;
    }
    // For a node to qualify as a static root, it should have children that
    // are not just static text. Otherwise the cost of hoisting out will
    // outweigh the benefits and it's better off to just always render it fresh.
    if (
      node.static &&
      node.children.length &&
      !(node.children.length === 1 && node.children[0].type === 3)
    ) {
      node.staticRoot = true;
      return;
    } else {
      node.staticRoot = false;
    }
    if (node.children) {
      for (let i = 0, l = node.children.length; i < l; i++) {
        markStaticRoots(node.children[i], isInFor || !!node.for);
      }
    }
    if (node.ifConditions) {
      for (let i = 1, l = node.ifConditions.length; i < l; i++) {
        markStaticRoots(node.ifConditions[i].block, isInFor);
      }
    }
  }
}

/**
 * 判断是否是静态节点
 * @param node
 */
function isStatic(node: ASTNode): boolean {
  // 包含变量的动态文本节点
  if (node.type === 2) {
    // expression
    return false;
  }
  // 不包含变量的纯文本节点
  if (node.type === 3) {
    // text
    return true;
  }
  return !!(
    node.pre ||   // node.pre -> 节点使用了v-pre指令，那就断定它是静态节点
    (!node.hasBindings && // 不能使用动态绑定语法, 即标签上不能有v-、@、:开头的属性；
      !node.if &&
      !node.for && // not v-if or v-for or v-else // 不能使用v-if、v-else、v-for指令
      !isBuiltInTag(node.tag) && // not a built-in // 不能是内置组件，即标签名不能是slot和component
      isPlatformReservedTag(node.tag) && // not a component // 标签名必须是平台保留标签，即不能是组件
      !isDirectChildOfTemplateFor(node) && // 当前节点的父节点不能是带有 v-for 的 template 标签；
      Object.keys(node).every(isStaticKey)) // 节点的所有属性的 key 都必须是静态节点才有的 key，
      // 注：静态节点的key是有限的，它只能是type,tag,attrsList,attrsMap,plain,parent,children,attrs之一；
  );
}

/**
 * 节点的所有属性的 key 都必须是静态节点才有的 key
 * @param keys 
 * 静态节点的key是有限的，它只能是type,tag,attrsList,attrsMap,plain,parent,children,attrs之一
 */
function genStaticKeys (keys: string): Function {
    return makeMap(
      'type,tag,attrsList,attrsMap,plain,parent,children,attrs,start,end,rawAttrsMap' +
      (keys ? ',' + keys : '')
    )
  }
