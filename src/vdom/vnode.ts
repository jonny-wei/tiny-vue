export default class VNode {
    tag: string | void; // 标签
    data: VNodeData | void; // 虚拟DOM节点数据
    children: ?Array<VNode>; // 子节点
    text: string | void; // 文本节点
    key: string | number | void; // 节点键值, 用于优化
    parent: VNode | void; // 组件父节点，占位符
    
    constructor(
        tag?: string,
        data?: VNode,
        children?: ?Array<VNode>,
        text?: string
    ){
        this.tag = tag;
        this.data = data;
        this.children = children;
        this.text = text;
        this.key = data && data.key;
        this.parent = undefined;
    }
}
