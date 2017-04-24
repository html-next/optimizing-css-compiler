const walkTree = require('./utils/walk-tree');
const precompile = require('@glimmer/compiler').precompile;
const htmlGraphBuilder = require('../walkers/html-graph-builder');
const COMPONENT_PATH = 'components/';

module.exports = function processTemplatesTree(templatesDir, stylesGraph) {
  const usedStylesGraph = {
    dynamic: Object.create(null),
    static: Object.create(null)
  };

  return walkTree(templatesDir, (relativePath, fileData) => {
    let moduleName = relativePath.substr(templatesDir.length + 1);
    let isComponent = false;
    moduleName = moduleName.replace('.hbs', '');

    if (moduleName.indexOf(COMPONENT_PATH) === 0) {
      isComponent = true;
      moduleName = moduleName.substr(COMPONENT_PATH.length);
    }

    precompile(fileData, {
      rawSource: fileData,
      isComponent,
      moduleName,
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
