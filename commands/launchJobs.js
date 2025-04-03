const fs = require("fs");
const path = require("path");
const minimist = require("minimist");
const { log, logError } = require("../lib/logger");
const { findConfigFile } = require("../lib/fileUtils");
const { launchJobs } = require("../lib/launchUtils");

module.exports = async function launch(configDir, configFile, { dryRun = false }) {
  if (!configFile) {
    logError("❌ Please specify a config file to launch.");
    return;
  }

  const filePath = findConfigFile(configFile, configDir, { failIfMissing: true });
  const config = require(filePath);

  if (!Array.isArray(config.apps)) {
    logError(`❌ Invalid or empty config: ${configFile}`);
    return;
  }

  const cliArgs = minimist(process.argv.slice(2));
  const only = cliArgs["only"];

  let jobNames = config.apps.map(app => app.name);

  if (only) {
    const filter = Array.isArray(only) ? only : [only];
    jobNames = jobNames.filter(name => filter.includes(name));
  }

  if (jobNames.length === 0) {
    logError(`❌ No matching job(s) found for --only=${only}`);
    return;
  }

  launchJobs(filePath, jobNames, dryRun);
};
