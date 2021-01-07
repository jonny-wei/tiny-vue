/**
 * 如何生成 VNode 进而产出 Virtual DOM(虚拟DOM) 以及进行 patch ?
 *
 * 模板编译
 *
 * 将template模板生成render函数的过程，把HTML编译成渲染函数的过程
 *
 * 其具体流程可大致分为三个阶段：
 * 模板解析阶段(解析器)：将一堆模板字符串(包括指令、class、style等数据)用正则等方式解析成抽象语法树AST；
 * 优化阶段(优化器)：遍历AST，找出其中的静态节点，并打上标记；vue优化之一静态节点patch中不进行diff比较
 * 代码生成阶段(生成器)：将AST转换成渲染函数；
 *
 * 返回值
 * 最终返回了抽象语法树( ast )，渲染函数( render )，静态渲染函数( staticRenderFns )组成的对象
 * 
 * 总结
 * 模板编译的目的是：将用户所写的模板编译成供Vue实例在挂载时可调用的render函数(template模板生成render函数的过程)
 * mount中调用compileToFunctions就可以将template转化成render函数
 * const { compile, compileToFunctions } = createCompiler(baseOptions)
 * compileToFunctions函数是 createCompiler 函数的返回值对象中的其中一个，
 * createCompiler 函数顾名思义他的作用就是创建一个编译器，如下代码所示：
 */

export const createCompiler = createCompilerCreator(function baseCompile(
  template: string,
  options: CompilerOptions
): CompiledResult {
  // 模板解析阶段：用正则等方式解析 template 模板中的指令、class、style等数据，形成AST
  const ast = parse(template.trim(), options);
  if (options.optimize !== false) {
    // 优化阶段：遍历AST，找出其中的静态节点，并打上标记；
    optimize(ast, options);
  }
  // 代码生成阶段：将AST转换成渲染函数；
  const code = generate(ast, options);
  return {
    ast,
    render: code.render,
    staticRenderFns: code.staticRenderFns,
  };
});
