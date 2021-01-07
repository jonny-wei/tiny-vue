/**
 * parseText(文本解析器/辅助parseHtml)
 *
 * 文本解析器的作用就是将HTML解析器解析得到的文本内容进行二次解析，
 * 解析文本内容中是否包含变量，如果包含变量，则将变量提取出来进行加工，为后续生产render函数做准备
 * 
 * 当HTML解析器解析到文本内容时会调用4个钩子函数中的chars函数来创建文本型的AST节点
 * 在chars函数中会根据文本内容是否包含变量再细分为创建含有变量的AST节点和不包含变量的AST节点
 * 当Vue用HTML解析器解析出文本时，再将解析出来的文本内容传给文本解析器，
 * 最后由文本解析器解析该段文本里面是否包含变量以及如果包含变量时再解析expression和tokens
 *
 * 文本解析器内部就干了三件事
 * （1）判断传入的文本是否包含变量
 * （2）构造expression
 * （3）构造tokens
 *
 * 返回值
 * expression：把文本中的变量和非变量提取出来，然后把变量用_s()包裹，最后按照文本里的顺序把它们用+连接起来。
 * tokens：是个数组，数组内容也是文本中的变量和非变量，不一样的是把变量构造成{'@binding': xxx}。
 */
import { parseFilters } from "./filter-parser";

const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;
const regexEscapeRE = /[-.*+?^${}()|[\]\/\\]/g;

const buildRegex = cached((delimiters) => {
  const open = delimiters[0].replace(regexEscapeRE, "\\$&");
  const close = delimiters[1].replace(regexEscapeRE, "\\$&");
  return new RegExp(open + "((?:.|\\n)+?)" + close, "g");
});

type TextParseResult = {
  expression: string;
  tokens: Array<string | { "@binding": string }>;
};

export function parseText(
  text: string,
  delimiters?: [string, string]
): TextParseResult | void {
  /**
   * tagRE
   * 检查文本中是否包含变量的正则表达式，即用来检测文本内是否有{{}}
   * delimiters参数的作用
   * 没有传入delimiters参数，则是检测文本是否包含{{}}，如果传入了值，就会检测文本是否包含传入的值。
   * 即，buildRegex用户可以自定义文本内包含变量所使用的符号
   */
  const tagRE = delimiters ? buildRegex(delimiters) : defaultTagRE;
  if (!tagRE.test(text)) {
    return;
  }
  const tokens = [];
  const rawTokens = [];
  /**
   * let lastIndex = tagRE.lastIndex = 0
   * 上面这行代码等同于下面这两行代码:
   * tagRE.lastIndex = 0
   * let lastIndex = tagRE.lastIndex
   */
  let lastIndex = (tagRE.lastIndex = 0);
  let match, index, tokenValue;
  /**
   * exec( )方法是在一个字符串中执行匹配检索，
   * 如果它没有找到任何匹配就返回null，
   * 如果它找到了一个匹配就返回一个数组
   * 匹配结果的第一个元素是字符串中第一个完整的带有包裹的变量，
   * 第二个元素是第一个被包裹的变量名，
   * 第三个元素是第一个变量在字符串中的起始位置
   */
  while ((match = tagRE.exec(text))) {
    index = match.index;
    /**
     * push text token
     * 当index>lastIndex时，表示变量前面有纯文本，
     * 那么就把这段纯文本截取出来，存入rawTokens中，
     * 同时再调用JSON.stringify给这段文本包裹上双引号，存入tokens中
     */
    if (index > lastIndex) {
      // 先把'{{'前面的文本放入tokens中
      rawTokens.push((tokenValue = text.slice(lastIndex, index)));
      tokens.push(JSON.stringify(tokenValue));
    }
    // tag token
    // 取出'{{ }}'中间的变量exp
    const exp = parseFilters(match[1].trim());
    // 把变量exp改成_s(exp)形式也放入tokens中
    tokens.push(`_s(${exp})`);
    rawTokens.push({ "@binding": exp });
    // 设置lastIndex 以保证下一轮循环时，只从'}}'后面再开始匹配正则
    lastIndex = index + match[0].length;
  }
  // 当剩下的text不再被正则匹配上时，表示所有变量已经处理完毕
  // 此时如果lastIndex < text.length，表示在最后一个变量后面还有文本
  // 最后将后面的文本再加入到tokens中
  if (lastIndex < text.length) {
    rawTokens.push((tokenValue = text.slice(lastIndex)));
    tokens.push(JSON.stringify(tokenValue));
  }

  // 最后把数组tokens中的所有元素用'+'拼接起来
  return {
    expression: tokens.join("+"),
    tokens: rawTokens,
  };
}
