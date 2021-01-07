/**
 * 模板解析器
 *
 * 将一堆模板字符串(包括指令、class、style等数据)用正则等方式解析成抽象语法树AST
 * 
 */

/**
 * parse
 * @param template 待转换模板字符串
 * @param options 转换时的选项
 * start，end，chars，comment四个钩子函数作为参数传递给parseHtml解析器函数
 * 当解析器解析出不同的内容时调用不同的钩子函数从而生成不同的AST。
 *
 * parseHtml
 * 模板编译阶段主线函数parse会将HTML模板字符串转化成AST，
 * 而parseHTML是用来解析模板字符串的，把模板字符串中不同的内容解析出来之后，
 * 那么谁来把提取出来的内容生成对应的AST呢？答案就是这4个钩子函数。
 * start，end，chars，comment四个钩子函数作为参数传递给parseHtml解析器函数
 * 当解析器解析出不同的内容时调用不同的钩子函数从而生成不同的AST。
 * 一边解析不同的内容一边调用对应的钩子函数生成对应的AST节点，最终完成将整个模板字符串转化成AST,这就是HTML解析器(parseHtml)所要做的工作。
 */
export function parse(
  template: string,
  options: CompilerOptions
): ASTElement | void {
  parseHtml(template, {
    warn,
    expectHTML: options.expectHTML,
    isUnaryTag: options.isUnaryTag,
    canBeLeftOpenTag: options.canBeLeftOpenTag,
    shouldDecodeNewlines: options.shouldDecodeNewlines,
    shouldDecodeNewlinesForHref: options.shouldDecodeNewlinesForHref,
    shouldKeepComment: options.comments,
    outputSourceRange: options.outputSourceRange,
    /**
     * 当解析到开始标签时，调用该函数
     * @param tag 标签名
     * @param attrs 属性
     * @param unary 是否自闭合
     * @param start
     * @param end
     */
    start(tag, attrs, unary, start, end) {
      let element: ASTElement = createASTElement(tag, attrs, currentParent);
      stack.push(element);
    },
    // 当解析到结束标签时，调用该函数
    end(tag, start, end) {
      const element = stack[stack.length - 1];
      stack.length -= 1;
      closeElement(element);
    },
    // 当解析到文本时，调用该函数
    chars(text: string, start: number, end: number) {
      // 判断文本是不是一个带变量expression的动态文本
      // 如果是动态文本，则创建动态文本类型的AST节点
      if (!inVPre && text !== " " && (res = parseText(text, delimiters))) {
        let element = {
          type: 2,
          expression: res.expression,
          tokens: res.tokens,
          text,
        };
      } else if (
        // 如果不是动态文本，则创建纯静态文本类型的AST节点
        text !== " " ||
        !children.length ||
        children[children.length - 1].text !== " "
      ) {
        let element = {
          type: 3,
          text,
        };
      }
    },
    // 当解析到注释时，调用该函数
    // 创建一个注释类型的AST节点
    comment(text: string, start, end) {
      const element = {
        type: 3,
        text,
        isComment: true,
      };
    },
  });
  return root;
}

/**
 * 创建AST树节点
 * @param tag
 * @param attrs
 * @param parent
 */
export function createASTElement(
  tag: string,
  attrs: Array<ASTAttr>,
  parent: ASTElement | void
): ASTElement {
  return {
    type: 1,
    tag,
    attrsList: attrs,
    attrsMap: makeAttrsMap(attrs),
    rawAttrsMap: {},
    parent,
    children: [],
  };
}
