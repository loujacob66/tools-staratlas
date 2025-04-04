const path = require("path");
const fs = require("fs");
const os = require("os");
const { logError } = require("./logger");

function findConfigFile(filename, configDir = null, options = {}) {
  const homeFallback = path.join(os.homedir(), "pm2-configs");

  const tryPaths = [
    configDir ? path.join(configDir, filename) : null,
    path.join(process.cwd(), filename),
    path.join(homeFallback, filename),
  ].filter(Boolean); // remove nulls

  for (const candidate of tryPaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  logError(`❌ ${filename} not found in any known config location.`);
  if (!options.quiet) {
    console.log(`Try using --config-dir or move your files to ~/pm2-configs`);
  }

  process.exit(1);
}

module.exports = {
  findConfigFile,
};
