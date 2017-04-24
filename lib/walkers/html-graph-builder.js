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
  Object.keys(graph).forEach((key) => {
    if (key === VALUE_SYMBOL) {
      matched.push(graph[VALUE_SYMBOL]);
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

function matchRulesForNode(node, OPTS) {
  const GRAPHS = OPTS.availableGraph;
  let symbols = symbolsForNode(node);
  let matchedRules = [];

  symbols.forEach((symbol) => {
    if (GRAPHS.static[symbol]) {
      let rules = matchDeep(node, GRAPHS.static[symbol], symbol);
      matchedRules.push(...rules);
    }
  });

  console.log('rules', matchedRules);
}

module.exports = class {
  constructor(options) {
    this.options = options;
  }
  transform(ast) {
    const OPTS = this.options;
    this.syntax.traverse(ast, {
      ElementNode(node) {
        matchRulesForNode(node, OPTS);
      }
    });

    return ast;
  }
};
