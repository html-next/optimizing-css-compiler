const VALUE_SYMBOL = "OPTIMIZING_CSS_COMPILER_STYLE_POD";
const SPLIT_SYMBOLS = /[\.|#]/;

function getSymbolsForKey(key) {
  return key.split(SPLIT_SYMBOLS).sort().reverse();
}

function symbolsForNode(node) {
  const symbols = [node.tag];

  node.attributes.forEach((attr) => {
    if (attr.name === 'class') {
      if (attr.value.type === 'TextNode') {
        let classNames = attr.value.chars.split(' ');
        classNames = classNames.map(n => `.${n}`);
        symbols.push(...classNames);
      }
    } else if (attr.name === 'id') {
      if (attr.value.type === 'TextNode') {
        symbols.push(`#${attr.value.chars}`);
      }
    } else {
      if (attr.value.type === 'TextNode') {
        let value = attr.value.chars;
        if (value) {
          symbols.push(`[${attr.name}="${value}"]`);
        } else {
          symbols.push(`[${attr.name}]`);
        }
      }
    }
  });

  return symbols;
}

function matchKey(key, symbols) {
  let symbolsForKey = getSymbolsForKey(key);
  for (let i = 0; i < symbolsForKey.length; i++) {
    let s = symbolsForKey[i];
    if (symbols.indexOf(s) === -1) {
      return false;
    }
  }
  return true;
}

function findParent(node, key) {
  let match = null;
  while (!match && node.parent) {
    let node = node.parent;
    let symbols = symbolsForNode(node);
    if (matchKey(key, symbols)) {
      match = node;
    }
  }

  return match;
}

function matchDeep(node, graph, symbol, matched = []) {
  graph.forEach((key) => {

  });
  Object.keys(graph).forEach((key) => {

    if (key === VALUE_SYMBOL) {
      matched.push(graph.getValue());
    } else if (key === '>' && node.parent) {
      console.log('parent', node.parent);
    } else {
      if (node.parent) {
        console.log('other-key', key);
        let matchedParent = findParent(node, key);
        if (matchedParent) {

        }
      }
    }
  });

  console.log('matched', matched);
  return matched;
}

module.exports = class {
  constructor(options) {
    this.options = options;
    let _graph = options.availableGraph;
    let _usedGraph = options.usedGraph;

    let graph = this.graph = {
      isComponent: options.isComponent,
      componentName: options.componentName,
      moduleName: options.moduleName,
      available: {
        static: _graph.static.get(options.moduleName),
        dynamic: _graph.dynamic.get(options.moduleName)
      },
      used: {
        static: _usedGraph.static.get(options.moduleName),
        dynamic: _usedGraph.dynamic.get(options.moduleName)
      }
    };

    if (options.isComponent) {
      graph.used.static.setRootName(options.componentName);
      graph.used.dynamic.setRootName(options.componentName);
    }
  }

  transform(ast) {
    this.syntax.traverse(ast, {
      ElementNode(node) {
        const graph = this.graph;
        let symbols = symbolsForNode(node);
        let matchedRules = [];

        symbols.forEach((symbol) => {
          if (graph.avilable.static.get(symbol)) {
            let rules = matchDeep(node, OPTS.staticNamespace.get(symbol), symbol);
            matchedRules.push(...rules);
          }
        });

        console.log('rules', matchedRules);
      }
    });

    return ast;
  }
};
