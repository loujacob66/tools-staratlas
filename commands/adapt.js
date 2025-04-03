const { runEndpointCheck } = require("../lib/endpointUtils");
const { adaptConfigs } = require("../lib/configUtils");

module.exports = async function adapt(configDir, { configFile, all = false, dryRun = false, pushover = false }) {
  await runEndpointCheck(configDir, { pushover });
  await adaptConfigs({ all, configFile, dryRun, configDir });
};
