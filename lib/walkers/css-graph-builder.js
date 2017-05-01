const postcss = require('postcss');
const chalk = require('chalk');

let TREE_DEPTH = 0;

function cleanupFileName(file) {
  return file.substring(file.indexOf('.tmp') + 4);
}

function log(msg) {
  console.log(chalk.grey(chalk.green('=> ') + padStr(TREE_DEPTH, '\t') + msg));
}

function padStr(chars, char = '~') {
  let ret = '';
  while (chars--) {
    ret += char;
  }
  return ret;
}

function showErrorTick(source, errorSource, index) {
  let lines = source.split('\n');
  let startLine = errorSource.line - 4;
  let endLine = startLine + 7;
  let str = '\n\n```css';

  startLine = startLine < 0 ? 0 : startLine;
  endLine = endLine >= lines.length ? lines.length - 1 : endLine;

  for (let i = startLine; i < endLine; i++) {
    if (i !== errorSource.line -1 ) {
      str += `\n${i + 1}:\t${lines[i]}`;
    } else {
      str += chalk.white(`\n${i + 1}:\t${lines[i]}`);
      str += chalk.yellow(`\n\t${padStr(index || errorSource.column)}^`);
    }
  }

  str += '\n```';

  return chalk.grey(str);

}

function throwValidationError(invalidType, selector, node, index) {
  const fileName = node.source.input.file;
  const lineNo = node.source.start.line;
  const error = chalk.bgRed(chalk.white(`\n\n Optimizing CSS Compiler Error `)) +
    `\nYou cannot use ${chalk.yellow(invalidType)} selectors when using the Optimizing CSS Compiler` +
    `\n\tfound ${chalk.yellow(selector)} at ` + chalk.white(cleanupFileName(fileName)) + ` line ` + chalk.white(lineNo);

  console.log(
    chalk.grey(error),
    showErrorTick(node.source.input.css, node.source.start, index),
    '\n\n'
  );

  // we have to throw vs call exit or the promise chain will continue to execute
  throw new Error(`Optimized CSS Compilation Failed`);
}

function validateSelector(selector, node) {
  let index;
  if ((index = selector.indexOf('#')) !== -1) {
    throwValidationError('#id', selector, node, index);
  } else if ((index = selector.indexOf('[')) !== -1) {
    throwValidationError('[attribute]', selector, node, index);
  } else if ((index = selector.indexOf(`~`)) !== -1) {
    throwValidationError('~sibling', selector, node, index);
  } else if ((index = selector.indexOf('+')) !== -1) {
    throwValidationError('+sibling', selector, node, index);
  } else if ((index = selector.indexOf('*')) !== -1) {
    throwValidationError('*wildcard', selector, node, index);
  }
}

function generateRuleGraph(node, namespace) {
  const stylePod = Object.create(null);
  let selectorString = node.selector;

  if (!node.nodes.length) { return; }

  log(`Add Selector '${chalk.yellow(selectorString)}' To Graph`);
  TREE_DEPTH++;

  node.nodes.forEach(decl => {
    stylePod[decl.prop] = decl.value;
  });

  validateSelector(selectorString, node);

  namespace.set(selectorString, stylePod);
  TREE_DEPTH--;
}

module.exports = postcss.plugin('postcss-build-graph', (options = {}) => {
  console.log('\n\n');
  // Work with options here
  const moduleName = options.moduleName;
  const componentName = options.componentName;
  const isComponent = options.isComponent;
  const staticNamespace = options.graph.static.get(moduleName);
  const dynamicNamespace = options.graph.dynamic.get(moduleName);

  log('Building CSS Graph for ' + chalk.yellow(isComponent ? componentName : moduleName));

  if (isComponent) {
    staticNamespace.setRootName(componentName);
    dynamicNamespace.setRootName(componentName);
  }

  return root => {
    let previousNode = null;
    for (let i = 0; i < root.nodes.length; i++) {
      TREE_DEPTH++;
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
      TREE_DEPTH--;
    }
  };
});
