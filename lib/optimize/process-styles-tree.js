const walkTree = require('./utils/walk-tree');
const postcss = require('postcss');
const cssGraphBuilder = require('../walkers/css-graph-builder');
const { StyleGraph } = require('./graph/style-graph');
const COMPONENT_PATH = 'components/';

module.exports = function processStylesTree(styleDir /*, warningStream*/) {
  const GRAPH = {
    dynamic: new StyleGraph('dynamic'),
    static: new StyleGraph('static')
  };

  return walkTree(styleDir, (relativePath, fileData) => {
    let moduleName = relativePath.substr(styleDir.length + 1);
    let isComponent = false;
    let componentName;
    moduleName = moduleName.replace('.css', '');

    if (moduleName.indexOf(COMPONENT_PATH) === 0) {
      isComponent = true;
      componentName = moduleName.substr(COMPONENT_PATH.length);
    }

    const processor = postcss();
    const opts = {
      from: relativePath,
      to: relativePath,
      map: {
        inline: false,
        annotation: false
      },
      plugins: [cssGraphBuilder],
      graph: GRAPH,
      isComponent,
      moduleName,
      componentName
    };

    if (!opts.plugins || opts.plugins.length < 1) {
      throw new Error('You must provide at least 1 plugin in the plugin array')
    }

    opts.plugins.forEach((plugin) => {
      // let pluginOptions = assign(opts, plugin.options || {});
      processor.use(plugin(opts));
    });

    return processor.process(fileData, opts)
      .then((result) => {
        // result.warnings().forEach(warn => warningStream.write(warn.toString()))

        return result.css
      })
      .catch((err) => {
        if (err.name === 'CssSyntaxError') {
          err.message += `\n${err.showSourceCode()}`
        }

        throw err
      })
  }).then(() => {
    return GRAPH;
  });
};
