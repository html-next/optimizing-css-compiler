const SELECTOR_SPLIT_SYMBOLS = ',';
const PATH_SPLIT_SYMBOLS = ' ';
const PATH_SPLIT_CLEANUP = /\s+/g;
const SPLIT_SYMBOLS = /\./g;

/*
  Given the string form of a CSS Selector for a given set of rules,
  return an array of unique selector rules.

  Example:

  ```
  .fixed, .sidebar > .sticky {
    position: fixed;
  }
  ```

  becomes

  ```
  ['.fixed', '.sidebar > .sticky']
  ```

  @return Array<String> an array of CSS rules
 */
function extractSelectors(selectorString) {
  return selectorString.split(SELECTOR_SPLIT_SYMBOLS);
}

/*
  Given the string form of a CSS rule, return the individual element
  matchers (segments).

  Note: `>` is treated as a segment which is special cased elsewhere.

  Example:

  ```
  .sidebar.foo > .sticky
  ```

  becomes

  ```
  ['.sidebar.foo', '>', '.sticky']
  ```

  @return Array<String> an array of segments.
 */
function extractSegments(selector) {
  return selector
    .split('>')
    .join(' > ')
    .replace(PATH_SPLIT_CLEANUP, ' ')
    .split(PATH_SPLIT_SYMBOLS)
    .reverse();
}

/*
  Given the string form of a CSS rule segment, return the individual
  selectors that compose it.  Because of our constraints, this will
  always be constrained to elements, classNames, and their pseudo-variants.

  Example:

  ```
  'div.sidebar.foo'
  ```

  Becomes:

  ```
  ['div', '.sidebar', '.foo']
  ```

  @return Array<String> an array of symbols.
 */
function extractSymbols(segment) {
  return segment
    .replace(SPLIT_SYMBOLS, '##.')
    .split('##')
    .filter(a => a)
    .sort()
    .reverse();
}

module.exports = {
  extractSelectors,
  extractSegments,
  extractSymbols
};
