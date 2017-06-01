/*
  Determine if we should consider this element (elementSymbols)
  to match a css rule segment (matchSymbols)

  We assume already sorted symbol arrays

  @return Boolean true when the given array of symbols for the element matches the symbols in matchSymbols
 */
function elementMatches(elementSymbols, matchSymbols) {
  if (elementSymbols.length < matchSymbols.length) { return false; }

  for (let i = 0; i < matchSymbols.length; i++) {
    let requiredValue = matchSymbols[i];
    if (elementSymbols.indexOf(requiredValue) === -1) {
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


module.exports = {
  elementMatches
};
