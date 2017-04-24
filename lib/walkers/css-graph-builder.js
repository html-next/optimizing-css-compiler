const postcss = require('postcss');

function generateRuleGraph(node, namespace) {
  const stylePod = Object.create(null);
  let selectorString = node.selector;

  if (!node.nodes.length) { return; }
  node.nodes.forEach(decl => {
    stylePod[decl.prop] = decl.value;
  });

  namespace.set(selectorString, stylePod);
}

module.exports = postcss.plugin('postcss-build-graph', (options = {}) => {
  // Work with options here
  const moduleName = options.moduleName;
  const componentName = options.componentName;
  const isComponent = options.isComponent;
  const staticNamespace = options.graph.static.get(moduleName);
  const dynamicNamespace = options.graph.dynamic.get(moduleName);

  if (isComponent) {
    staticNamespace.setRootName(componentName);
    dynamicNamespace.setRootName(componentName);
  }

  return root => {
    let previousNode = null;
    for (let i = 0; i < root.nodes.length; i++) {
      let node = root.nodes[i];
      let type = node.type;
      if (previousNode && previousNode.type === 'comment' && previousNode.text === '@dynamic') {
        type = 'dynamic';
      } else if (type ==='atrule' && node.name === 'dynamic') {
        type = 'dynamic';
        node.selector = node.params;
      }

      switch (type) {
        case 'rule':
          //console.log('rule', node);
          generateRuleGraph(node, staticNamespace, isComponent ? componentName: false);
          break;
        case 'dynamic':
          generateRuleGraph(node, dynamicNamespace, isComponent ? componentName: false);
          break;
        default:
          break;
      }
      previousNode = node;
    }
  };
});
