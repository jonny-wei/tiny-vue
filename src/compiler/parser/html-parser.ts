/**
 * 如何将template模板变成AST语法树？
 * 
 * parseHtml(HTML解析器/主解析器)
 * 
 * 一边解析不同的内容一边调用对应的钩子函数生成对应的AST节点，最终完成将整个模板字符串转化成AST
 *
 * 解析文本
 * 解析html注释
 * 解析条件注释
 * 解析DOCTYPE
 * 解析开始标签
 * 解析结束标签
 *
 * HTML解析器是如何解析各种不同类型的内容并且调用钩子函数创建不同类型的AST节点
 * 但是创建的AST节点都是单独创建且分散的，而真正的DOM节点都是有层级关系的
 * (1)何来保证AST节点的层级关系与真正的DOM节点相同呢？？
 * Vue在HTML解析器的开头定义了一个栈stack，这个栈的作用就是用来维护AST节点层级的。
 * (2)stack栈如何维护AST节点层级？？
 * HTML解析器在从前向后解析模板字符串时，
 * 每当遇到开始标签时就会调用start钩子函数，
 * 那么在start钩子函数内部我们可以将解析得到的开始标签推入栈中，
 * 而每当遇到结束标签时就会调用end钩子函数，
 * 那么我们也可以在end钩子函数内部将解析得到的结束标签所对应的开始标签从栈中弹出
 *
 * stack的两个作用
 * (1) 维护AST数节点层级关系
 * (2) 检测模板字符串中是否有未正确闭合的标签
 */
export function parseHTML(html, options) {
  let stack = []; // 维护AST节点层级的栈
  let expectHTML = options.expectHTML;
  let isUnaryTag$$1 = options.isUnaryTag || no;
  let canBeLeftOpenTag$$1 = options.canBeLeftOpenTag || no; //用来检测一个标签是否是可以省略闭合标签的非自闭合标签
  let index = 0; // 解析游标，标识当前从何处开始解析模板字符串
  let last;  // 存储剩余还未解析的模板字符串
  let lastTag; // 存储着位于 stack 栈顶的元素

  // 开启一个 while 循环，循环结束的条件是 html 为空，即 html 被 parse 完毕
  while (html) {
    last = html;
    // 确保即将 parse 的内容不是在纯文本标签里 (script,style,textarea)
    if (!lastTag || !isPlainTextElement(lastTag)) {
      let textEnd = html.indexOf("<");
      /**
       * 如果html字符串是以'<'开头,则有以下几种可能
       * 开始标签:<div>
       * 结束标签:</div>
       * 注释:<!-- 我是注释 -->
       * 条件注释:<!-- [if !IE] --> <!-- [endif] -->
       * DOCTYPE:<!DOCTYPE html>
       * 需要一一去匹配尝试
       */
      if (textEnd === 0) {
        /**
         * 解析html注释
         * options.shouldKeepComment：我们平常在模板中可以在<template></template>标签上配置comments选项来决定在渲染模板时是否保留注释
         * advance函数：是用来移动解析游标的，解析完一部分就把游标向后移动一部分，确保不会重复解析
         */
        if (comment.test(html)) {
          // 若为注释，则继续查找是否存在'-->'
          const commentEnd = html.indexOf("-->");
          if (commentEnd >= 0) {
            // 若存在 '-->',继续判断options中是否保留注释
            if (options.shouldKeepComment) {
              // 若保留注释，则把注释截取出来传给options.comment，创建注释类型的AST节点
              // 调用4个钩子函数中的comment函数，将真实的注释内容传进去，创建注释类型的AST节点
              options.comment(
                html.substring(4, commentEnd),
                index,
                index + commentEnd + 3
              );
            }
            // 若不保留注释，则将游标移动到'-->'之后，继续向后解析
            advance(commentEnd + 3);
            continue;
          }
        }
        /**
         * 解析条件注释
         * 由于条件注释不存在于真正的DOM树中，所以不需要调用钩子函数创建AST节点
         */
        const conditionalComment = /^<!\[/;
        if (conditionalComment.test(html)) {
          // 若为条件注释，则继续查找是否存在']>'
          const conditionalEnd = html.indexOf("]>");
          if (conditionalEnd >= 0) {
            // 若存在 ']>',则从原本的html字符串中把条件注释截掉，
            // 把剩下的内容重新赋给html，继续向后匹配
            advance(conditionalEnd + 2);
            continue;
          }
        }
        // 解析是否是DOCTYPE
        const doctypeMatch = html.match(doctype);
        if (doctypeMatch) {
        }
        // 解析是否是结束标签
        const endTagMatch = html.match(endTag);
        if (endTagMatch) {
        }
        // 匹配是否是开始标签
        const startTagMatch = parseStartTag();
        if (startTagMatch) {
        }
      }
      // 如果html字符串不是以'<'开头,则解析文本类型
      let text, rest, next;
      if (textEnd >= 0) {
      }
      // 如果在html字符串中没有找到'<'，表示这一段html字符串都是纯文本
      if (textEnd < 0) {
        text = html;
        html = "";
      }
      // 把截取出来的text转化成textAST
      if (options.chars && text) {
        options.chars(text);
      }
    } else {
      // 父元素为script、style、textarea时，其内部的内容全部当做纯文本处理
    }

    //将整个字符串作为文本对待
    if (html === last) {
      options.chars && options.chars(html);
      if (!stack.length && options.warn) {
        options.warn('Mal-formatted tag at end of template: "' + html + '"');
      }
      break;
    }
  }

  // Clean up any remaining tags
  parseEndTag();
  //parse 开始标签
  function parseStartTag() {}
  //处理 parseStartTag 的结果
  function handleStartTag(match) {}
  //parse 结束标签
  function parseEndTag(tagName, start, end) {}
}
