/**
 * 合并属性函数
 */ 
export function mergeOptions (
    parent: Object,
    child: Object,
    vm?: Component
  ): Object {
    if (process.env.NODE_ENV !== 'production') {
      checkComponents(child)
    }
  
    if (typeof child === 'function') {
      child = child.options
    }
  
    normalizeProps(child, vm)
    normalizeInject(child, vm)
    normalizeDirectives(child)
  
    // Apply extends and mixins on the child options,
    // but only if it is a raw options object that isn't
    // the result of another mergeOptions call.
    // Only merged options has the _base property.
    if (!child._base) {
      if (child.extends) {
        parent = mergeOptions(parent, child.extends, vm)
      }
      if (child.mixins) {
        for (let i = 0, l = child.mixins.length; i < l; i++) {
          parent = mergeOptions(parent, child.mixins[i], vm)
        }
      }
    }
  
    const options = {}
    let key
    for (key in parent) {
      mergeField(key)
    }
    for (key in child) {
      if (!hasOwn(parent, key)) {
        mergeField(key)
      }
    }
    function mergeField (key) {
      const strat = strats[key] || defaultStrat
      options[key] = strat(parent[key], child[key], vm, key)
    }
    return options
  }