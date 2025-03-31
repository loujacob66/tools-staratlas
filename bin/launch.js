// bin/launch.js
#!/usr/bin/env node

const path = require("path");
const { adaptConfigs } = require("../lib/configUtils");
const { launchJobs } = require("../lib/launchUtils");
const { logInfo, logError } = require("../lib/logger");

const args = process.argv.slice(2);
const flags = new Set(args);

const isDryRun = flags.has("--dry-run");
const doAdapt = flags.has("--adapt-configs");
const doLaunch = flags.has("--launch");

if (!doAdapt && !doLaunch) {
  logError("No operation specified. Use --adapt-configs, --launch, or both.");
  process.exit(1);
}

(async () => {
  try {
    if (doAdapt) {
      logInfo("Adapting PM2 config files...");
      await adaptConfigs({ dryRun: isDryRun });
    }

    if (doLaunch) {
      logInfo("Launching jobs...");
      await launchJobs({ dryRun: isDryRun });
    }

    logInfo("Done.");
  } catch (err) {
    logError(`Error during launch sequence: ${err.message}`);
    process.exit(1);
  }
})();
