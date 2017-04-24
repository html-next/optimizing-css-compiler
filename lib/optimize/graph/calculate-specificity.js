/*
  Roughly calculate the base specificity (not including !important) for a path
 */
const ELEMENT_SPECIFICITY = 1;
const ATTR_SPECIFICITY = 10;
const ID_SPECIFICITY = 100;
const PATH_SYMBOL = 'PATH_SYMBOL';

function isId(symbol) {
  return symbol.indexOf('#') === 0;
}

function isElement(symbol) {
  let s0 = symbol.charAt(0);
  let s1 = symbol.charAt(1);
  return s0.match(/[a-zA-Z]/) || s0 === s1 === ':';
}

function isAttr(symbol) {
  let s0 = symbol.charAt(0);
  let s1 = symbol.charAt(1);

  return s0.match(/[\.\[:]/) || (s0 === '*' && s1 === '[');
}

module.exports = function calculateSpecificity(graph, path) {
  let specificity = 0;
  let node = graph;
  let i = path.length;

  while(i-- > 0) {
    let segment = path[i];

    if (!node[segment]) {
      throw new Error('Unknown Path Segment');
    }

    node = node[segment];
    let symbols = node[PATH_SYMBOL];

    symbols.forEach((symbol) => {
      if (isId(symbol)) {
        specificity += ID_SPECIFICITY;
      } else if (isElement(symbol)) {
        specificity += ELEMENT_SPECIFICITY;
      } else if (isAttr(symbol)) {
        specificity += ATTR_SPECIFICITY;
      }
    });

  }

  return specificity;
};
