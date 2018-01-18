# [WIP] optimizing-css-compiler

[![Greenkeeper badge](https://badges.greenkeeper.io/html-next/optimizing-css-compiler.svg)](https://greenkeeper.io/)

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
- Do assume your CSS is scoped by template context (route or component hbs file)

## Things that don't work yet (but will)

- **Everything! (but the basic cases are getting close to working)**
- media-queries and breakpoints
- CSS preprocessors
- class names within `component.js` files (yet! a subset of usage in this pattern will eventually be allowed)
- !important` (it'll still work, you just shouldn't)
- global CSS
-  `::pseudo-element` and `:pseudo-class` selectors

## CSS

- use mixins, not global selectors
- no attr selectors
- no sibling selectors
- no ID selectors
- classed and elements only

## Why?

Existing scoped and inline style solutions lead to selector bloat and limited
style reusability.  While the scoping and isolation is a great mental model,
it's not as great for the browser, which can better optimize styles it has
already seen.

The approach here allows us to write CSS as if it were scoped, and have it
behave scoped at runtime as well.  But unlike other solutions, you will ship
the smallest possible CSS file with the fewest possible selectors.

This has the double effect of reducing the size of your template files
by eliminating long and multiple class names in favor of short "sha" based
selectors.

This also has the ability to alert you to unused styles in your stylesheet,
and to "tree-shake" your dead CSS.

In dev mode, we'll keep your selectors scoped but expanded so you can
see quickly what has been applied, while in production we will aggressively
minimize and combine your selectors as much as possible.

## Does "compiler" just mean "minification" ?

Not at all.  Here's a quick (and contrived) example. Imagine this were
ths sum total of the CSS and html in your app:

```css
h1 {
  font-size: 1rem;
  display: block;
  width: 100px;
  height: 50px;
  margin: 0;
  padding: 0;
}

.foo {
  font-size: 1rem;
  width: 100px;
  height: 50px;
  margin: 5px;
}

.bar {
  box-sizing: border-box;
  width: 100%;
  height: auto;
  margin: 5px;
  padding: 5px;
}

.baz {
  color: #f00;
}
```

```html
<h1 class="foo bar">Hello World</h1>
```

Looking at this example, we can see that many of our CSS rules are either
overridden or redundant.

Given the contrived nature of our example, we also see that we have 3
selectors matching the html in our "app" when we could have used 1. We
also have one selector that goes completely unused.

For this example, the optimizing compiler would instead produce the following
CSS and DOM.

```css
.s0 {
  display: block;
  font-size: 1rem;
  box-sizing: border-box;
  width: 100%;
  height: auto;
  margin: 5px;
  padding: 5px;
}
```

```html
<h1 class="s0">Hello World</h1>
```

## Does "optimizing" just mean shorter class names and "collapsed" selector rules?

No. In addition to referring to the ability to simplify the combined rules
 for a single DOM element, "optimizing" refers to the ability to intelligently
 produce the smallest selector graph it can based on the actual usage of
 various rules in your app.
 
 A contrived example of this extends the above example.
 
 If any other elements use the same "rule set" as `s0`, they will also
use `s0`.

For the case where another element is just one style prop different from `s0`,
  a clustering algorithm based on app usage is used to build a primary 
  selector group, and a modified selector group.
  
For an example in which one group differs only by a different value for 
padding-top, something like the following would be produced:

```css
.s0 {
  display: block;
  font-size: 1rem;
  box-sizing: border-box;
  width: 100%;
  height: auto;
  margin: 5px;
  padding: 5px;
}

.s1 {
  padding-top: 10px;
}
```

## Prior Art

The following links are some prior art we should investigate the usefulness of:

- https://github.com/prototypal-io/prius
- https://github.com/prototypal-io/cascada-es6
- https://github.com/prototypal-io/cascada


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
