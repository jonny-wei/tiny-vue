/**
 * 如何根据AST生成render函数？
 *
 * 代码生成器
 *
 * parserHtml将模板解析成AST语法树，经过optimizer标记静态节点与静态根节点进行优化，
 * 最后通过 codegen 代码生成器将 优化后的 AST 语法树 转成 render函数字符串。
 *
 * 生成render函数的过程其实就是一个递归的过程，从顶向下依次递归AST中的每一个节点，
 * 根据不同的AST节点类型创建不同的VNode类型
 *
 * 生成render函数就好办了
 * Vue只要调用了render函数，就可以把模板转换成对应的虚拟DOM，进行patch，进而渲染DOM
 *
 * render 函数哪里来？
 * (1) 可能是用户手写的render函数
 * 在Vue组件选项中手写一个render选项，其值对应一个函数，那这个函数就是render函数,供组件挂载的时候调用。
 * (2) 根据模板内容生成一个render函数(代码生成器),供组件挂载的时候调用。
 *
 * 代码生成其实就是根据模板对应的抽象语法树AST生成一个函数供组件挂载时调用，
 * 通过调用这个函数就可以得到模板对应的虚拟DOM
 */

/**
 * 生成器
 * 核心是 genElement
 * @param ast 优化后的ast
 * @param options
 */
export function generate(
  ast: ASTElement | void,
  options: CompilerOptions
): CodegenResult {
  const state = new CodegenState(options);
  /**
   * 判断ast是否为空
   * 不为空则调用genElement(ast, state)函数创建VNode
   * 为空为空则创建一个空的元素型div的VNode
   */
  const code = ast ? genElement(ast, state) : '_c("div")';
  /**
   * 结果用with(this){return ${code}}包裹返回
   */
  return {
    render: `with(this){return ${code}}`,
    staticRenderFns: state.staticRenderFns,
  };
}

/**
 * 创建VNode元素
 * @param el
 * @param state
 * 根据当前 AST 元素节点属性的不同从而执行不同的代码生成函数
 * 真正创建出来的VNode无非就三种，分别是元素节点，文本节点，注释节点。
 */
export function genElement(el: ASTElement, state: CodegenState): string {
  if (el.parent) {
    el.pre = el.pre || el.parent.pre;
  }

  if (el.staticRoot && !el.staticProcessed) {
    return genStatic(el, state);
  } else if (el.once && !el.onceProcessed) {
    return genOnce(el, state);
  } else if (el.for && !el.forProcessed) {
    return genFor(el, state);
  } else if (el.if && !el.ifProcessed) {
    return genIf(el, state);
  } else if (el.tag === "template" && !el.slotTarget && !state.pre) {
    return genChildren(el, state) || "void 0";
  } else if (el.tag === "slot") {
    return genSlot(el, state);
  } else {
    // component or element
    let code;
    if (el.component) {
      code = genComponent(el.component, el, state);
    } else {
      let data;
      if (!el.plain || (el.pre && state.maybeComponent(el))) {
        data = genData(el, state);
      }

      const children = el.inlineTemplate ? null : genChildren(el, state, true);
      code = `_c('${el.tag}'${
        data ? `,${data}` : "" // data
      }${
        children ? `,${children}` : "" // children
      })`;
    }
    // module transforms
    for (let i = 0; i < state.transforms.length; i++) {
      code = state.transforms[i](el, code);
    }
    return code;
  }
}
