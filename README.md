# [WIP] optimizing-css-compiler

What does a little convention get you? A lot, as it turns out.

When following the conventions listed below, the Optimizing CSS Compiler
 will be able to aggressively optimize, compile and minify your CSS by
 taking the following steps:
 
- builds a broccoli tree of handlebars templates and styles
- constructs a graph of all possible style paths in your CSS files
- constructs a new graph of all used style paths in your handlebars files
- compiles css down to the smallest possible set of rules.
- applies those rules to the templates, removing any existing classes
- writes a style sheet containing the rules

## The Guidelines

- **Don't expect this to work (because it doesn't yet)**
- Do contribute if you find this neat, ask in #dev-html-next in the Ember Slack
- Componetize your CSS
- Use `&` for the component root element
- Tag dynamic selectors (things to leave alone) with `@dynamic` or `/* @dynamic */`
- Don't use media-queries and breakpoints (yet! they will be doable long term)
- Don't use any CSS preprocessors (yet! also will be doable long term)
- Don't add class names within `component.js` files (yet! most usage in this pattern will eventually be allowed)

## Installation

* `git clone <repository-url>` this repository
* `cd optimizing-css-compiler`
* `npm install`
* `bower install`

## Running

* `ember serve`
* Visit your app at [http://localhost:4200](http://localhost:4200).

## Running Tests

* `npm test` (Runs `ember try:each` to test your addon against multiple Ember versions)
* `ember test`
* `ember test --server`

## Building

* `ember build`

For more information on using ember-cli, visit [https://ember-cli.com/](https://ember-cli.com/).
