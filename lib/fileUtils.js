// lib/fileUtils.js
const fs = require("fs");
const path = require("path");
const { log, logError } = require("./logger");

function findConfigFile(filename, configDir, { silent = false, failIfMissing = true, pushover = false } = {}) {
  const fallbackDir = path.resolve(process.env.HOME || "~", "pm2-configs");

  const tryPaths = [
    path.join(configDir, filename),
    path.join(fallbackDir, filename)
  ];

  const foundPath = tryPaths.find(fs.existsSync);

  if (!foundPath && failIfMissing) {
    logError(`❌ ${filename} not found in:`);
    tryPaths.forEach(p => logError(`   - ${p}`));
    log("");
    log(`💡 Hint: Use --config-dir to specify the correct location.`);
    log(`   Example: launch status --config-dir ~/pm2-configs`);

    if (pushover) {
      const { sendPushoverAlert } = require("./notify");
      sendPushoverAlert(`🚨 ${filename} not found in any known location.`);
    }

    process.exit(1);
  }

  return foundPath;
}

module.exports = {
  findConfigFile
};
