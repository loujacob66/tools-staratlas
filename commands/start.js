const path = require("path");
const pm2 = require("pm2");
const { findConfigFile } = require("../lib/fileUtils");
const { loadConfigFiles } = require("../lib/rotationUtils");
const { log, logSection } = require("../lib/logger-enhanced");

function normalizeKeys(obj) {
  const out = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    out[camelKey] = obj[key];
  }
  return out;
}

module.exports = async function start(_args, rawOptions = {}) {
  const options = normalizeKeys(rawOptions);
  const only = options.only;
  const dryRun = options.dryRun === true || options.dryRun === "true";
  const configDir = options.configDir || path.resolve(process.env.HOME, "pm2-configs");

  logSection("Job Starter");

  const configFiles = loadConfigFiles(configDir);
  const found = [];

  for (const { config, file } of configFiles) {
    for (const app of config.apps) {
      if (!only || app.name === only) {
        found.push({ name: app.name, file });
      }
    }
  }

  if (only && found.length === 0) {
    log(`⛔ Job '${only}' not found in any config file`);
    return;
  }

  for (const { name, file } of found) {
    log(`➡️ Starting job '${name}' from ${path.basename(file)}...`);

    if (dryRun) {
      log(`   ⏱️ (dry run — no start performed)`);
      continue;
    }

    await new Promise((resolve, reject) => {
      pm2.connect(err => {
        if (err) return reject(err);
        pm2.start(file, { only: name }, err => {
          pm2.disconnect();
          if (err) return reject(err);
          resolve();
        });
      });
    });

    log(`✅ Started job '${name}' from ${path.basename(file)}`);
  }
};
