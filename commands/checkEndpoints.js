const { runEndpointCheck } = require("../lib/endpointUtils");
const { findConfigFile } = require("../lib/fileUtils");
const path = require("path");

module.exports = async function checkEndpoints(configDir, { pushover = false }) {
  const filePath = findConfigFile("endpoints.json5", configDir, { pushover });
  const detectedDir = path.dirname(filePath);
  await runEndpointCheck(detectedDir, { pushover });
};
