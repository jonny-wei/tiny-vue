/**
 * 如何描述虚拟DOM(Virtual DOM)?
 * VNode 类
 * 
 * 虚拟DOM
 * 用一个JS对象来描述一个DOM节点
 * 用JS的计算性能来换取操作DOM所消耗的性能
 * 通过DOM-Diff算法计算出需要更新的地方，然后去更新需要更新的视图，达到尽可能少的操作DOM的目的
 * 
 * 组件的产出是 Virtual DOM。组件的核心是 render 函数，
 * 通过 render 函数生成 Virtual DOM，然后通过 patch "打补丁" 将虚拟 DOM 节点高效的渲染成真实的 DOM。
 * 
 * 使用Virtual DOM的目的：
 * 主要目的：Virtual DOM带来了分层设计，跨平台以及SSR等特性
 * Virtual DOM是对渲染过程的抽象，使得框架可以渲染到 web(浏览器) 以外的平台(跨平台)，以及能够实现 SSR(服务端渲染) 等。
 * 次要目的：Virtual DOM 达到尽可能少的操作DOM的目的，减少操作真实DOM的性能消耗
 * 至于 Virtual DOM 相比原生 DOM 操作的性能，这并非 Virtual DOM 的目标，
 * 确切地说，如果要比较二者的性能是要“控制变量”的，例如：页面的大小、数据变化量等
 * 
 * VNode的作用是相当大的：
 * 我们在视图渲染之前，把写好的template模板先编译成VNode并缓存下来，
 * 等到数据发生变化页面需要重新渲染的时候，我们把数据发生变化后生成的VNode与前一次缓存下来的VNode进行对比(Diff算法)，
 * 找出差异，然后有差异的VNode对应的真实DOM节点就是需要重新渲染的节点，
 * 最后根据有差异的VNode创建出真实的DOM节点再插入到视图中，最终完成一次视图更新。
 */

export default class VNode {
    tag: string | void; // 标签
    data: VNodeData | void; // 当前节点对应的对象, 虚拟DOM节点数据, 是一个VNodeData类型
    children: ?Array<VNode>; // 子节点
    text: string | void; // 文本节点
    key: string | number | void; // 节点键值, 用于优化
    parent: VNode | void; // 组件父节点，占位符
    elm: Node | void; // 真实DOM节点
    ns: string | void; // 当前节点的名字空间
    context: Component | void; // 当前组件节点对应的Vue实例(作用域)
    fnContext: Component | void; // 函数式组件对应的Vue实例
    fnOptions: ?ComponentOptions;
    componentOptions: VNodeComponentOptions | void; // 组件的option选项
    componentInstance: Component | void; // 组件实例

    raw: boolean; // 简而言之就是是否为原生HTML或只是普通文本，innerHTML的时候为true，textContent的时候为false
    isStatic: boolean; // 是否为静态节点
    isRootInsert: boolean;  // 是否作为跟节点插入
    isComment: boolean;   // 是否为注释节点
    isCloned: boolean; // 是否为克隆节点
    isOnce: boolean; // 是否是一个 v-once 节点
    asyncFactory: Function | void; // 异步组件工厂方法
    
    constructor(
        tag?: string,
        data?: VNodeData,
        children?: ?Array<VNode>,
        text?: string
        elm?: Node,
        context?: Component,
        componentOptions?: VNodeComponentOptions,
        asyncFactory?: Function
    ){
        this.tag = tag
        this.data = data
        this.children = children
        this.text = text
        this.key = data && data.key
        this.elm = elm
        this.ns = undefined
        this.context = context
        this.fnContext = undefined
        this.fnOptions = undefined
        this.componentOptions = componentOptions
        this.componentInstance = undefined
        this.parent = undefined
        this.raw = false
        this.isStatic = false
        this.isRootInsert = true
        this.isComment = false
        this.isCloned = false
        this.isOnce = false
        this.asyncFactory = asyncFactory;
    }
}


/**
 * VNode类型：
 * 文本节点，html元素节点，注释节点，克隆节点，组件节点，函数式组件节点
 * 根据不同的VNode类型，描述真实DOM
 * VNode可以描述的多种节点类型，它们本质上都是VNode类的实例，只是在实例化的时候传入的属性参数不同而已
 */

 /**
  * 创建注释节点
  * @param text 
  */
export const createEmptyVNode = (text: string = '') => {
    const node = new VNode()
    node.text = text
    node.isComment = true
    return node
 }

 /**
  * 文本节点
  * @param val 
  */
export function createTextNode(val: string | number): VNode {
    return new VNode(undefined,undefined,undefined,String(val))
}

/**
 * 克隆节点
 * @param vnode 
 * 优化的浅克隆
 * 用于静态节点与插槽，因为它们可以跨节点重用
 * 由于多个地方复用渲染，因此克隆它们以避免真实DOM依赖时错误
 * 它主要是为了做模板编译优化时使用
 */
export function cloneVNode(vnode: VNode): VNode {
    const cloned = new VNode(
       vnode.tag || undefined,
        vnode.data,
        // #7975
        // clone children array to avoid mutating original in case of cloning
        // a child.
        vnode.children && vnode.children.slice(),
        vnode.text || undefined,
        vnode.elm || undefined,
        vnode.context,
        vnode.componentOptions,
        vnode.asyncFactory || null
      )
      cloned.ns = vnode.ns
      cloned.isStatic = vnode.isStatic
      cloned.key = vnode.key
      cloned.isComment = vnode.isComment
      cloned.fnContext = vnode.fnContext
      cloned.isCloned = true // 克隆节点与已有节点唯一的不同，标记为克隆节点
      return cloned
}