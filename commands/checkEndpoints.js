const { runEndpointCheck } = require("../lib/endpointUtils");
const { findConfigFile } = require("../lib/fileUtils");
const path = require("path");
const { logSection, logInfo } = require("../lib/logger-enhanced");

module.exports = async function checkEndpoints(options) {
  logSection("Endpoint Check");
  const filePath = findConfigFile("endpoints.json5", options.configDir, options);
  const detectedDir = path.dirname(filePath);
  logInfo(`Using config from: ${filePath}`);
  await runEndpointCheck(detectedDir, options);
};
