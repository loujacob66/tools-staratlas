const fs = require("fs");
const path = require("path");
const os = require("os");
const { format } = require("date-fns");
const JSON5 = require("json5");
const { log, logInfo, logError } = require("./logger");

function backupOriginal(filePath, backupRootDir) {
  const backupDir = path.join(backupRootDir, "backups");
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const timestamp = format(new Date(), "yyyy-MM-dd'T'HH-mm-ss");
  const baseName = path.basename(filePath);
  const backupPath = path.join(backupDir, `${baseName}.${timestamp}.js`);
  fs.copyFileSync(filePath, backupPath);
  logInfo(`📦 Backed up ${baseName} to backups/ as ${path.basename(backupPath)}`);
}

function buildFullExportedConfig(config) {
  // We no longer need dynamic code like path.join() in output
  return `module.exports = ${JSON.stringify(config, null, 2)};\n`;
}

async function adaptConfigs({ all = false, configFile = null, dryRun = false, configDir = null }) {
  const rootDir = configDir ? path.resolve(configDir) : path.resolve(__dirname, "..");
  const healthyPath = path.join(rootDir, "healthy-endpoints.json5");
  const injectedCwd = path.join(os.homedir(), "staratlas-labs-solanabot");

  if (!fs.existsSync(healthyPath)) {
    logError(`❌ healthy-endpoints.json5 not found in ${rootDir}`);
    process.exit(1);
  }

  const healthy = JSON5.parse(fs.readFileSync(healthyPath, "utf8"));
  if (!Array.isArray(healthy) || healthy.length === 0) {
    logError(`❌ healthy-endpoints.json5 is empty or malformed.`);
    process.exit(1);
  }

  const readEndpoints = healthy.filter(e => !e.name.includes("W"));
  const writeEndpoints = healthy.filter(e => e.name.includes("W"));

  if (readEndpoints.length === 0) {
    logError("❌ No healthy READ endpoints available.");
    process.exit(1);
  }

  if (writeEndpoints.length === 0) {
    logError("❌ No healthy WRITE endpoints available.");
    process.exit(1);
  }

  const writeEndpoint = writeEndpoints[0];
  let configFiles = [];

  if (configFile) {
    const fullPath = path.join(rootDir, configFile);
    if (!fs.existsSync(fullPath)) {
      logError(`❌ Config file ${configFile} not found in ${rootDir}`);
      process.exit(1);
    }
    configFiles.push(fullPath);
  } else if (all) {
    configFiles = fs.readdirSync(rootDir)
      .filter(f => f.endsWith(".config.js"))
      .map(f => path.join(rootDir, f));
  } else {
    logError(`❌ No config file specified and --all not used.`);
    process.exit(1);
  }

  let readIndex = 0;

  for (const fullPath of configFiles) {
    const config = require(fullPath);
    if (!Array.isArray(config.apps)) continue;

    if (!dryRun) backupOriginal(fullPath, rootDir);

    for (const app of config.apps) {
      // ✅ Overwrite or inject a literal cwd string
      app.cwd = injectedCwd;

      if (!app.env) app.env = {};
      const read = readEndpoints[readIndex % readEndpoints.length];
      app.env.SOLANA_RPC_URL_READ = read.url;
      app.env.SOLANA_RPC_URL_WRITE = writeEndpoint.url;

      if (dryRun) {
        logInfo(`🔍 [dry-run] ${app.name} → READ: ${read.url}, WRITE: ${writeEndpoint.url}, CWD: ${injectedCwd}`);
      }

      readIndex++;
    }

    const outputCode = buildFullExportedConfig(config);

    if (!dryRun) {
      fs.writeFileSync(fullPath, outputCode);
      logInfo(`✅ Rewrote ${path.basename(fullPath)} with updated env and cwd.`);
    }
  }

  logInfo(dryRun ? "✨ Dry run complete. No files were modified." : "✨ All configs adapted successfully.");
}

module.exports = {
  adaptConfigs,
};
