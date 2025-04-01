// lib/configUtils.js
const fs = require("fs");
const path = require("path");
const { format } = require("date-fns");
const JSON5 = require("json5");
const { logInfo, logError } = require("./logger");

const SCRIPT_DIR = __dirname;

const backupOriginal = (filePath) => {
  const backupDir = path.join(SCRIPT_DIR, "../backups");
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
  const timestamp = format(new Date(), "yyyy-MM-dd'T'HH-mm-ss");
  const baseName = path.basename(filePath);
  const backupPath = path.join(backupDir, `${baseName}.${timestamp}.js`);
  fs.copyFileSync(filePath, backupPath);
  logInfo(`📦 Backed up ${baseName} to backups/ as ${path.basename(backupPath)}`);
};

async function adaptConfigs({ all = false, configFile = null, dryRun = false }) {
  const healthyPath = path.resolve(SCRIPT_DIR, "../healthy-endpoints.json5");
  if (!fs.existsSync(healthyPath)) {
    logError(`❌ healthy-endpoints.json5 not found.`);
    process.exit(1);
  }

  const healthy = JSON5.parse(fs.readFileSync(healthyPath, "utf8"));
  if (!Array.isArray(healthy) || healthy.length === 0) {
    logError(`❌ healthy-endpoints.json5 is empty or malformed.`);
    process.exit(1);
  }

  let configFiles = [];

  if (configFile) {
    const fullPath = path.resolve(SCRIPT_DIR, "..", configFile);
    if (!fs.existsSync(fullPath)) {
      logError(`❌ Config file ${configFile} not found.`);
      process.exit(1);
    }
    configFiles.push(fullPath);
  } else if (all) {
    configFiles = fs.readdirSync(path.resolve(SCRIPT_DIR, ".."))
      .filter(f => f.endsWith(".config.js"))
      .map(f => path.resolve(SCRIPT_DIR, "..", f));
  } else {
    logError(`❌ No config file specified and --all not used.`);
    process.exit(1);
  }

  let endpointIndex = 0;

  for (const fullPath of configFiles) {
    const config = require(fullPath);
    if (!Array.isArray(config.apps)) continue;

    if (!dryRun) backupOriginal(fullPath);

    for (const app of config.apps) {
      if (!app.env) app.env = {};
      const endpoint = healthy[endpointIndex % healthy.length];
      if (!endpoint?.url) continue;

      if (dryRun) {
        logInfo(`🔍 [dry-run] ${app.name} → ${endpoint.url}`);
      } else {
        app.env.SOLANA_RPC_URL_READ = endpoint.url;
      }

      endpointIndex++;
    }

    if (!dryRun) {
      const adaptedCode = 'module.exports = ' + JSON.stringify(config, null, 2) + ';\n';
      fs.writeFileSync(fullPath, adaptedCode);
      logInfo(`✅ Adapted ${path.basename(fullPath)} with new SOLANA_RPC_URL_READ values.`);
    }
  }

  logInfo(dryRun ? "✨ Dry run complete. No files were modified." : "✨ All configs adapted successfully.");
}

module.exports = {
  adaptConfigs,
};
