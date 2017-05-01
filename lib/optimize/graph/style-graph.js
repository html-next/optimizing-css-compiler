/*
  # Terminology Explanation

  Given the following CSS

  ```
  .foo .bar.baz, div#ham { ...}
  ```

  `selectorString`: `.foo .bar.baz, div#ham`
  `pathStrings`:    `.foo .bar.baz` `div#ham`
  `paths`:          `['.foo', '.foo.baz']` `['div#ham']`
  `symbols`:        `.foo` `.bar` `.baz` `div` `#ham`
  `stylePod`:       `{ ... }`

  # Graph Explanation

  We build our graph using reversed paths to make it efficient to math elements in templates
  against known rules.

  Each component gets it's own sub-graph.

  For example, given the following CSS for the component `my-component`

  ```
  .foo-1 .bar-1.foo-2 > div.foo-3 .bar {}
  ```

  We would generate the following data structure.

  ```
 {
   .bar {
     [PATH_SYMBOL]: ['.bar']
     div.foo-3 {
       [PATH_SYMBOL]: ['div', '.foo-3']
        > {
         [PATH_SYMBOL]: ['>']
         .bar-1.foo-2 {
           [PATH_SYMBOL]: ['bar-1', '.foo-2']
           .foo-1 {
             [PATH_SYMBOL]: ['.foo-1']
             [VALUE_SYMBOL]: <stylePod>
           }
         }
       }
     }
   }
 }
  ```

  With this structure in place, we can take the following steps to
  match an element in the DOM.

  match(.bar)
    matchParent(['div, '.foo-3])
      matchImmediateParent(['.bar-1', '.foo-2'])
        matchParent(['.foo-1'])

 */
const chalk = require('chalk');
const random = Date.now();
const VALUE_SYMBOL = random + 'VALUE_SYMBOL';
const PATH_SYMBOL = random + 'PATH_SYMBOL';
const SPECIFICITY_SYMBOL = random + 'SPECIFITY_SYMBOL';
const NAME_SYMBOL = random + 'NAME_SYMBOL';

const SELECTOR_SPLIT_SYMBOLS = ',';
const PATH_SPLIT_SYMBOLS = ' ';
const PATH_SPLIT_CLEANUP = /\s+/g;
const SPLIT_SYMBOLS = /\./g;

// we assume already sorted arrays
function isSameArray(symbols, matchers) {
  if (symbols.length < matchers.length) { return false; }

  for (let i = 0; i < matchers.length; i++) {
    let requiredValue = matchers[i];
    if (symbols.indexOf(requiredValue) === -1) {
      return false;
    }
  }

  return true;
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
    cb(segments, path);
  });
}

function iteratePath(path, cb) {
  let depth = TREE_DEPTH;
  path.forEach((segment) => {
    let tlds = segment
      .replace(SPLIT_SYMBOLS, '####.')
      .split('####')
      .filter(a => a)
      .sort()
      .reverse();
    cb(segment, tlds, tlds.join(''));
    TREE_DEPTH++;
  });
  TREE_DEPTH = depth;
}

let TREE_DEPTH = 2;

function padStr(chars, char = '~') {
  let ret = '';
  while (chars--) {
    ret += char;
  }
  return ret;
}

function log(msg) {
  console.log(chalk.grey(chalk.green('=> ') + padStr(TREE_DEPTH, '\t') + msg));
}

class Segment {
  constructor(name, symbols = [name]) {
    this.name = name;
    this.specificity = 0;
    this.value = null;
    this.symbols = symbols;
    this.children = Object.create(null);
    this.pairs = Object.create(null);
  }

  addChild(name, symbols) {
    log('addChild ' + chalk.white(this.name) + ' ' + chalk.yellow(name));

    let segment = this.children[name];

    if (!segment) {
      segment = this.children[name] = new Segment(name, symbols);

      if (symbols && symbols.length > 1) {
        for (let i = 0; i < symbols.length; i++) {
          let s = symbols[i];
          let pair = this.pairs[s] = this.pairs[s] || [];
          pair.push([symbols, segment]);
        }
      }
    }

    return segment;
  }

  detectJoin(symbols) {
    let pairs = this.pairs;
    let keys = Object.keys(pairs);
    if (keys.length === 0) {
      // console.log('no pairs to match against');
      return false;
    }
    // console.log('available pairs', keys);
    let found = [];
    for (let i = 0; i < symbols.length; i++) {
      let s = symbols[i];
      // console.log('seeking ' + s);
      let pair = pairs[s];
      if (pair) {
        // console.log('found ' + s + ' seeking matching pair to ' + JSON.stringify(symbols));
        for (let j = 0; j < pair.length; j++) {
          let matchers = pair[j][0];
          let segment = pair[j][1];

          // console.log('matching against ' + JSON.stringify(matchers));
          if (found.indexOf(segment) === -1 && isSameArray(symbols, matchers)) {
            // console.log('matched pair');
            found.push(segment);
          }
        }
      }
    }

    return found.length ? found : false;
  }

  forEach(cb) {
    const children = this.children;
    const keys = Object.keys(children);

    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      cb(key, children[key]);
    }
  }

  setValue(value) {
    this.value = value;
  }

  toJSON() {
    return {
      name: this.name,
      value: this.value,
      children: this.children
    };
  }
}

class Namespace {
  constructor(name) {
    this._name = name;
    this._rootName = null;
    this._selectorPaths = new Segment(name);
  }

  setRootName(name) {
    this._rootName = name;
    this._selectorPaths.addChild(this._rootName);
  }

  get root() {
    return this._rootName ? this._selectorPaths.children[this._rootName] : this._selectorPaths;
  }

  get(localPathString) {
    let componentName = this._rootName || this._name;

    if (!localPathString || localPathString === componentName) {
      return this.root;
    }

    return this.root.children[localPathString];
  }

  detectJoin(localPathString) {
    return this.root.detectJoin(localPathString);
  }

  forEach() {
    throw new Error('Namespace.forEach is not implemented');
  }

  set(selectorString, stylePod) {
    if (selectorString === '&') {
      if (!this._rootName) {
        throw new Error(`You forget the component name for ${this._name}!`);
      }
      let componentName = this._rootName || this._name;

      if (!this.root) {
        this._selectorPaths.addChild(componentName, [componentName]);
      }
      this.root.setValue(stylePod)
    } else {
      iterateSelectors(selectorString, (pathSegments, path) => {
        let currentSegment = this.root;
        log('Adding Selector ' + chalk.yellow(path));
        TREE_DEPTH++;

        iteratePath(pathSegments, (segment, symbols) => {
          currentSegment = currentSegment.addChild(segment, symbols);
        });

        currentSegment.setValue(stylePod);
        TREE_DEPTH--;
      });
    }
  }

  toJSON() {
    return this._selectorPaths.toJSON();
  }
}

class StyleGraph {
  constructor(name) {
    this.name = name;
    this._namespaces = Object.create(null);
  }

  get(namespace) {
    return this._namespaces[namespace] || (this._namespaces[namespace] = new Namespace(namespace));
  }

  toJSON() {
    return this._namespaces;
  }
}

module.exports = {
  VALUE_SYMBOL,
  PATH_SYMBOL,
  SPECIFICITY_SYMBOL,
  StyleGraph
};
