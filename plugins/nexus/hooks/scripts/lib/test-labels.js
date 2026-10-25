'use strict';
/**
 * The slow-label and report helpers shared by every language, and node's label writer: the kept-slow reason
 * comment (`// slow: {reason}` on the line above a test, the same form in all languages), the tree readers a
 * report is resolved through, and the ` @slow` suffix node tests carry on their name literal. A plugin that
 * needs them ships a byte-identical copy of this file.
 *
 * Each language's own labels and report readers are its runner's (the contract in lib/test-runners.js):
 * label-tests.js and verify-run.js reach them through the loader.
 */
const {
  setReason, clearReason, relativeFile, insideTree, sourceFiles, projectDir,
} = require('./test-runners');
const { SLOW_SUFFIX, callLiteral, retagNodeSource } = require('./runners/node');

module.exports = {
  SLOW_SUFFIX, callLiteral, retagNodeSource, setNodeReason: setReason, clearNodeReason: clearReason,
  relativeFile, insideTree, sourceFiles, projectDir,
};
