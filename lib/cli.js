// lib/cli.js
const path = require("path");

const knownFlags = new Set([
  "--adapt-configs",
  "--dry-run",
  "--delay",
  "--all",
  "--help",
  "--config-dir"
]);

function parseCliArgs(argv) {
  const args = argv.slice(2);
  const flags = new Set();
  let configFile = null;
  let delay = 1;
  let configDir = null;
  let unknownFlags = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith("--")) {
      if (!knownFlags.has(arg)) {
        unknownFlags.push(arg);
        continue;
      }

      flags.add(arg);

      if (arg === "--delay" && args[i + 1]) {
        const parsed = parseFloat(args[i + 1]);
        if (!isNaN(parsed)) delay = parsed;
        i++;
      }

      if (arg === "--config-dir" && args[i + 1]) {
        configDir = path.resolve(args[i + 1]);
        i++;
      }
    } else if (arg.endsWith(".config.js")) {
      configFile = path.basename(arg);
    }
  }

  const isAdapt = flags.has("--adapt-configs");
  const isDryRun = flags.has("--dry-run");
  const isAll = flags.has("--all");
  const isHelp = flags.has("--help");

  if (isHelp || (!isAdapt && !isDryRun && !configFile && !isAll && delay === 1 && unknownFlags.length === 0)) {
    return { showHelp: true };
  }

  if (unknownFlags.length > 0) {
    throw new Error(`❌ Unknown flag(s): ${unknownFlags.join(", ")}`);
  }

  return {
    isAdapt,
    isDryRun,
    isAll,
    delay,
    configFile,
    configDir,
    showHelp: false,
  };
}

module.exports = {
  parseCliArgs,
};
