const walkTree = require('./utils/walk-tree');
const precompile = require('@glimmer/compiler').precompile;
const htmlGraphBuilder = require('../walkers/html-graph-builder');
const COMPONENT_PATH = 'components/';
const { StyleGraph } = require('./graph/style-graph');

module.exports = function processTemplatesTree(templatesDir, stylesGraph) {
  const usedStylesGraph = {
    dynamic: new StyleGraph('dynamic'),
    static: new StyleGraph('static')
  };

  return walkTree(templatesDir, (relativePath, fileData) => {
    let moduleName = relativePath.substr(templatesDir.length + 1);
    let isComponent = false;
    moduleName = moduleName.replace('.hbs', '');
    let componentName;

    if (moduleName.indexOf(COMPONENT_PATH) === 0) {
      isComponent = true;
      componentName = moduleName.substr(COMPONENT_PATH.length);
    }

    precompile(fileData, {
      rawSource: fileData,
      isComponent,
      moduleName,
      componentName,
      availableGraph:stylesGraph,
      usedGraph:usedStylesGraph,
      plugins: {
        ast: [htmlGraphBuilder]
      }
    });
  }).then(() => {
    return usedStylesGraph;
  });
};
