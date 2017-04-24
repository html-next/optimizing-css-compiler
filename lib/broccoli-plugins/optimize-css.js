/* jshint node: true */
/**
 * OptimizingCssCompiler
 *
 *  - takes a tree of glimmer templates and styles
 *  - constructs a graph of all possible style paths
 *  - constructs a new graph of all used style paths
 *  - compiles css down to the smallest possible set of rules.
 *  - applies those rules to the templates
 *  - writes a style sheet containing the rules
 */
const Plugin = require('broccoli-plugin');
const fs = require('fs');
const path = require('path');
const processStylesTree = require('../optimize/process-styles-tree');
const processTemplatesTree = require('../optimize/process-templates-tree');
const optimizeGraph = require('../optimize/optimize-styles-graph');
const compileTemplatesTree = require('../optimize/compile-templates-tree');
const writeStyleSheet = require('../optimize/write-style-sheet');

function OptimizingCssCompiler(inputPath, options) {
  options = options || {
    annotation: "Optimizing CSS Compiler"
  };
  this.options = options;

  Plugin.call(this, [inputPath], {
    annotation: options.annotation
  });
}

// Create a subclass from Plugin
OptimizingCssCompiler.prototype = Object.create(Plugin.prototype);
OptimizingCssCompiler.prototype.constructor = OptimizingCssCompiler;

OptimizingCssCompiler.prototype.build = function optimizeAndCompileCss() {
  const inputPath = this.inputPaths[0];
  const templatesPath = path.join(inputPath, 'templates');
  const stylesPath = path.join(inputPath, 'styles');
  const templatesDirStats = fs.lstatSync(templatesPath);
  const styleDirStats = fs.lstatSync(stylesPath);
  const outputPath = this.outputPath;

  if (!templatesDirStats.isDirectory()) {
    throw new Error('Passed a tree with no /templates root directory to the Optimize CSS Compiler');
  }

  if (!styleDirStats.isDirectory()) {
    throw new Error('Passed a tree with no /styles root directory to the Optimize CSS Compiler');
  }

  return processStylesTree(stylesPath)
    .then((stylesGraph) => {
      return processTemplatesTree(templatesPath, stylesGraph);
    })
    .then(optimizeGraph)
    .then((optimizedStylesGraph) => {
      return compileTemplatesTree(templatesPath, optimizedStylesGraph, outputPath);
    })
    .then((optimizedStylesGraph) => {
      return writeStyleSheet(optimizedStylesGraph, outputPath);
    });
};

module.exports = OptimizingCssCompiler;
