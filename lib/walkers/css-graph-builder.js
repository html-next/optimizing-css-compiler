const postcss = require('postcss');
const LookupIndex = Object.create(null);

const VALUE_SYMBOL = 'OPTIMIZING_CSS_COMPILER_STYLE_POD';
const SELECTOR_SPLIT_SYMBOLS = ',';
const PATH_SPLIT_SYMBOLS = ' ';
const PATH_SPLIT_CLEANUP = /\s+/g;
const SPLIT_SYMBOLS = /[\.|#]/;

function addSegmentToLookupIndex(key, tlds) {
  let cache = LookupIndex;
  tlds.forEach((s) => {
    cache[s] = cache[s] || Object.create(null);
    cache = cache[s];
  });
  cache[VALUE_SYMBOL] = key;
}

function iterateSelectors(selector, cb) {
  let selectors = selector.split(SELECTOR_SPLIT_SYMBOLS);
  selectors.forEach((path) => {
    let segments = path
      .split('>')
      .join(' > ')
      .replace(PATH_SPLIT_CLEANUP, ' ')
      .split(PATH_SPLIT_SYMBOLS)
      .reverse();
    cb(segments);
  });
}

function iteratePath(path, cb) {
  path.forEach((segment) => {
    let tlds = segment.split(SPLIT_SYMBOLS).sort().reverse();
    cb(segment, tlds, tlds.join(''));
  });
}

function generateRuleGraph(node, root, componentName) {
  const stylePod = Object.create(null);
  let selector = node.selector;
  const isComponent = !!componentName;

  if (!isComponent && selector === '&') {
    throw new Error('you forget the component name!');
  }

  if (!node.nodes.length) { return; }
  node.nodes.forEach(decl => {
    stylePod[decl.prop] = decl.value;
  });

  if (selector === '&') {
    root[componentName] = root[componentName] || Object.create(null);
    root[componentName][VALUE_SYMBOL] = stylePod;
  } else {
    iterateSelectors(selector, (path) => {
      let currentSegment = root;

      if (isComponent) {
        path.push(componentName);
      }

      iteratePath(path, (segment, tlds) => {
        let newSegment = currentSegment[segment] || Object.create(null);
        currentSegment[segment] = newSegment;
        currentSegment = newSegment;
      });

      currentSegment[VALUE_SYMBOL] = stylePod;
    });
  }
}

module.exports = postcss.plugin('postcss-build-graph', (options = {}) => {
  // Work with options here
  const moduleName = options.moduleName;
  const isComponent = options.isComponent;
  const GRAPH = options.graph;
  const StaticGraph = GRAPH.static;
  const DynamicGraph = GRAPH.dynamic;

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
          generateRuleGraph(node, StaticGraph, isComponent ? moduleName: false);
          break;
        case 'dynamic':
          generateRuleGraph(node, DynamicGraph, isComponent ? moduleName: false);
          break;
        default:
          break;
      }
      previousNode = node;
    }
  };
});
