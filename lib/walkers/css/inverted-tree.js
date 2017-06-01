const cssParseUtils = require('../utils/css-parse-utils');
const cssMatchUtils = require('../utils/find-element');

const {
  extractSelectors,
  extractSegments,
  extractSymbols
} = cssParseUtils;

const {
  elementMatches
} = cssMatchUtils;

class InvertedTree {
  constructor() {

  }

  matches(element) {
    return elementMatches(element, this.symbols);
  }
}
