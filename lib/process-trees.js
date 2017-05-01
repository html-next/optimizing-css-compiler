const Funnel = require('broccoli-funnel');
const mergeTrees = require('broccoli-merge-trees');
const OptimizingCssCompiler = require('./broccoli-plugins/optimize-css');

module.exports = function processTrees(path) {
  const stylesAndTemplatesTree = new Funnel(path, {
    include: ['**/**.css', '**/**.hbs']
  });
  const passThroughTree = new Funnel(path, {
    exclude: [/styles/, /templates/]
  });
  const optimized = new OptimizingCssCompiler(stylesAndTemplatesTree);

  return mergeTrees([passThroughTree, optimized]);
};
