#!/usr/bin/env node

const path = require("path");
const { adaptConfigs } = require("../lib/configUtils");
const { launchJobs } = require("../lib/launchUtils");
const { setLogFile, logInfo, logError } = require("../lib/logger");

const args = process.argv.slice(2);
const flags = new Set(args);

const isDryRun = flags.has("--dry-run");
const isAdaptMode = flags.has("--adapt-configs");
const isAllMode = flags.has("--all");
const namedFileArg = args.find(arg => arg.endsWith(".config.js"));

let delaySeconds = 1;
let onlyPattern = null;
let logFilePath = null;

// Parse --delay <seconds>
const delayIndex = args.indexOf("--delay");
if (delayIndex !== -1 && args[delayIndex + 1]) {
  const parsed = parseFloat(args[delayIndex + 1]);
  if (!isNaN(parsed) && parsed >= 0) {
    delaySeconds = parsed;
  } else {
    console.warn(`⚠️  Invalid delay value. Using default of ${delaySeconds}s.`);
  }
}

// Parse --log-file <file>
const logFileIndex = args.indexOf("--log-file");
if (logFileIndex !== -1 && args[logFileIndex + 1]) {
  logFilePath = args[logFileIndex + 1];
  setLogFile(logFilePath);
}

// Parse --only <pattern>
const onlyIndex = args.indexOf("--only");
if (onlyIndex !== -1 && args[onlyIndex + 1]) {
  onlyPattern = args[onlyIndex + 1].toLowerCase();
}

if (!isAdaptMode && !flags.has("--launch")) {
  logError("No operation specified. Use --adapt-configs, --launch, or both.");
  process.exit(1);
}

(async () => {
  try {
    if (isAdaptMode) {
      logInfo("Adapting PM2 config files...");
      await adaptConfigs({
        all: isAllMode,
        configFile: namedFileArg,
        dryRun: isDryRun
      });
    }

    if (flags.has("--launch")) {
      logInfo("Launching jobs...");
      await launchJobs({
        delaySeconds,
        dryRun: isDryRun,
        only: onlyPattern
      });
    }

    logInfo("✅ Done.");
  } catch (err) {
    logError(`❌ Error during launch sequence: ${err.message}`);
    process.exit(1);
  }
})();
