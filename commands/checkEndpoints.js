// commands/checkEndpoints.js
const { runEndpointCheck } = require("../lib/endpointUtils");
const { findConfigFile } = require("../lib/fileUtils");
const path = require("path");

module.exports = async function checkEndpoints(options) {
  const filePath = findConfigFile("endpoints.json5", options.configDir, options);
  const detectedDir = path.dirname(filePath);
  await runEndpointCheck(detectedDir, options);
};
