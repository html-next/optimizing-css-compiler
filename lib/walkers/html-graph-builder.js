const SPLIT_SYMBOLS = /\./g;
const chalk = require('chalk');
const Tree = require('../optimize/graph/dom-tree');

let TREE_DEPTH = 0;

function padStr(chars, char = '~') {
  let ret = '';
  while (chars--) {
    ret += char;
  }
  return ret;
}

function log(msg) {
  console.log(chalk.grey(chalk.cyan('=> ') + padStr(TREE_DEPTH, '\t') + msg));
}

function getSymbolsForKey(key) {
  return key
    .replace(SPLIT_SYMBOLS, '####.')
    .split('####')
    .filter(a => a)
    .sort()
    .reverse();
}

function symbolsForNode(node) {
  const symbols = [node.tag];

  let classNames = node.classNames.slice();

  symbols.push(...classNames);

  return symbols;
}

function matchKey(key, symbols) {
  // console.log('attempting to match ', key, symbols);
  let symbolsForKey = getSymbolsForKey(key);
  for (let i = 0; i < symbolsForKey.length; i++) {
    let s = symbolsForKey[i];
    if (symbols.indexOf(s) === -1) {
      return false;
    }
  }
  return true;
}

function findClosestParent(node, key) {
  // console.log('finding closest', key);
  let match = null;
  while (!match && node.parent) {
    node = node.parent;
    let symbols = symbolsForNode(node);
    if (matchKey(key, symbols)) {
      match = node;
    }
  }

  // console.log(match ? 'found a matching parent element' : 'no matching parent element found');
  return match;
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

    /*
    if (options.isComponent) {
      graph.used.static.setRootName(options.componentName);
      graph.used.dynamic.setRootName(options.componentName);
    }
    */
  }

  transform(ast) {
    console.log('\n\n');
    log('Transforming Template');

    const graph = this.graph;
    const tree = new Tree(ast);

    // console.log(JSON.stringify(tree, null, 2));

    tree.visit((node) => {
      let symbols = symbolsForNode(node);
      TREE_DEPTH++;
      log('Analyzing Element ' + chalk.yellow(JSON.stringify(symbols)));

      findStyleSelectors(node, graph.available.static, symbols);
      TREE_DEPTH--;
    });

    return ast;
  }
};

function matchSegment(node, segment, symbol, matched = []) {
  TREE_DEPTH++;

  if (segment.value) {
    log('Matched ' + chalk.yellow(symbol));
    matched.push(symbol);
  }

  segment.forEach((key, childSegment) => {
    if (key === '>') {
      if (node.parent) {
        log('HasParent ' + chalk.yellow(key));
        let grandChildSymbols = symbolsForNode(node.parent);
        childSegment.forEach((grandChildKey, grandChildSegment) => {
          if (matchKey(grandChildKey, grandChildSymbols)) {
            // console.log('matched immediate parent, continuing walk');
            matchSegment(node.parentNode, grandChildSegment, grandChildKey, matched);
          }
        });
      }
    } else {
      if (node.parent) {
        let matchedParent = findClosestParent(node, key);
        if (matchedParent) {
          // console.log('matching closest that was found');
          matchSegment(matchedParent, childSegment, key, matched);
        }
      }
    }
  });

  TREE_DEPTH--;
  return matched;
}

function findStyleSelectors(node, namespace, symbols, matched = []) {
  TREE_DEPTH++;
  let availableJoins = namespace.detectJoin(symbols);

  if (availableJoins) {
    TREE_DEPTH++;
    log('Analyzing Joins');
    availableJoins.forEach((segment) => {
      matchSegment(node, segment, segment.name, matched);
    });
    TREE_DEPTH--;
  }

  symbols.forEach((symbol) => {
    TREE_DEPTH++;
    log('Collecting rules for Symbol ' + chalk.yellow(symbol));
    let segment = namespace.get(symbol);

    if (segment) {
      matchSegment(node, segment, symbol, matched);
    }
    TREE_DEPTH--;
  });

  TREE_DEPTH--;
  return matched;
}
