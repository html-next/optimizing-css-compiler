/* eslint-env node */
'use strict';
const processTrees = require('./lib/process-trees');

module.exports = {
  name: 'optimizing-css-compiler',

  included: function() {
    this.app.trees.app = processTrees(this.app.trees.app);
  }
};
