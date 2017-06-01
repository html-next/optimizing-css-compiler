function padStr(chars, char = '~') {
  let ret = '';
  while (chars--) {
    ret += char;
  }
  return ret;
}

function symbolsForElement(node) {
  const symbols = [node.tag];

  let classNames = node.classNames.slice();

  symbols.push(...classNames);

  return symbols;
}

module.exports = {
  padStr,
  symbolsForElement
};
