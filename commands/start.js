// commands/start.js
const { logInfo, logError } = require("../lib/logger");
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

async function start(args, options) {
  const [configFile] = args;
  const only = options.only;
  const dryRun = options.dryRun;

  if (!configFile) {
    logError("❌ Please specify a config file to start.");
    return;
  }

  const configPath = require("../lib/fileUtils").findConfigFile(configFile, options.configDir);
  if (!fs.existsSync(configPath)) {
    logError(`❌ Config file not found: ${configPath}`);
    return;
  }

  const config = require(configPath);
  if (!Array.isArray(config.apps)) {
    logError(`❌ Invalid or empty config: ${configPath}`);
    return;
  }

  let jobNames = config.apps.map(app => app.name);

  if (only) {
    const onlySet = new Set(Array.isArray(only) ? only : [only]);
    jobNames = jobNames.filter(name => onlySet.has(name));
  }

  if (jobNames.length === 0) {
    logError("❌ No matching job(s) found to start.");
    return;
  }

  logInfo("🚀 Starting jobs...");

  for (const name of jobNames) {
    const cmd = `pm2 start "${configPath}" --only "${name}"`;
    if (dryRun) {
      logInfo(`[dry-run] Would run: ${cmd}`, { noTimestamp: true });
    } else {
      logInfo(`Running: ${cmd}`);
      execSync(cmd, { stdio: "inherit" });
    }
  }

  logInfo(`\n${dryRun ? "✨ Dry run complete." : `✅ Started ${jobNames.length} job(s).`}`);
}

module.exports = start;
