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
const random = Date.now();
const VALUE_SYMBOL = random + 'VALUE_SYMBOL';
const PATH_SYMBOL = random + 'PATH_SYMBOL';
const SPECIFICITY_SYMBOL = random + 'SPECIFITY_SYMBOL';
const NAME_SYMBOL = random + 'NAME_SYMBOL';

const SELECTOR_SPLIT_SYMBOLS = ',';
const PATH_SPLIT_SYMBOLS = ' ';
const PATH_SPLIT_CLEANUP = /\s+/g;
const SPLIT_SYMBOLS = /[\.|#]/;

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

class Segment {
  constructor(name, symbols = [name]) {
    this.name = name;
    this.specificity = 0;
    this.value = null;
    this.symbols = symbols;
    this.children = Object.create(null);
  }

  addChild(name, symbols) {
    this.children[name] = this.children[name] || new Segment(name, symbols);
    return this.children[name];
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

  set(selectorString, stylePod) {
    if (selectorString === '&') {
      if (!this._rootName) {
        throw new Error(`You forget the component name for ${this._name}!`);
      }
      let componentName = this._rootName || this._name;
      this._selectorPaths.addChild(componentName, stylePod);
    } else {
      iterateSelectors(selectorString, (path) => {
        let currentSegment = this.root;

        iteratePath(path, (segment, symbols) => {
          currentSegment = currentSegment.addChild(segment, symbols);
        });

        currentSegment.setValue(stylePod);
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
