const path = require("path");
const fs = require("fs");
const pm2 = require("pm2");
const os = require("os");

const {
  loadConfigFiles,
  extractJobEndpoints,
  assignNewReadEndpoints,
} = require("../lib/rotationUtils");
const { findConfigFile } = require("../lib/fileUtils");
const { sendPushoverAlert } = require("../lib/notify");
const { log, logSection } = require("../lib/logger-enhanced");
const { getHealthyEndpoints } = require("../lib/envConfig");

function stopAndRestartJob(jobName, configPath) {
  return new Promise((resolve, reject) => {
    pm2.connect(err => {
      if (err) return reject(err);
      pm2.delete(jobName, () => {
        pm2.start(configPath, { only: jobName }, err => {
          pm2.disconnect();
          if (err) return reject(err);
          resolve();
        });
      });
    });
  });
}

function getPm2LiveEnvMap() {
  try {
    const raw = require("child_process").execSync("pm2 jlist").toString();
    const parsed = JSON.parse(raw);
    const map = {};
    for (const proc of parsed) {
      map[proc.name] = proc.pm2_env?.env || {};
    }
    return map;
  } catch (err) {
    log(`⚠️  Unable to read PM2 env: ${err.message}`);
    return {};
  }
}

function normalizeKeys(obj) {
  const out = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    out[camelKey] = obj[key];
  }
  return out;
}

module.exports = async function rotate(_args, rawOptions = {}) {
  const options = normalizeKeys(rawOptions);
  const toBool = val => val === true || val === "true";

  const dryRun = toBool(options.dryRun);
  const force = toBool(options.force);
  const scramble = toBool(options.scramble);
  const pushover = toBool(options.pushover);
  const only = options.only || null;
  const seed = Number(options.seed || 0);
  const configDir = options.configDir;

  const baseDir =
    configDir ||
    path.dirname(findConfigFile("endpoints.json5", process.cwd(), { silent: true })) ||
    path.resolve(os.homedir(), "pm2-configs");

  logSection("Endpoint Rotation");

  try {
    // Get healthy endpoints from environment variables instead of JSON file
    const healthy = getHealthyEndpoints();
    log(`📊 Using ${healthy.length} endpoints from environment configuration`);
    
    const configObjects = loadConfigFiles(baseDir);
    const jobEndpoints = extractJobEndpoints(configObjects);
    const liveEnv = getPm2LiveEnvMap();

    const newAssignments = assignNewReadEndpoints(jobEndpoints, healthy, {
      forceReassign: force,
      scramble,
      rotateDay: seed,
    });

    const jobsToUpdate = only ? [only] : Object.keys(newAssignments);

    for (const jobName of jobsToUpdate) {
      const fromLive = (liveEnv[jobName]?.SOLANA_RPC_URL_READ || "").replace(/\/+$/, "");
      const to = newAssignments[jobName];
      const toNormalized = to.replace(/\/+$/, "");

      const label = healthy.find(e => e.url.replace(/\/+$/, "") === toNormalized)?.name || "(unknown)";

      const shouldSkip = fromLive === toNormalized && !force;
      if (shouldSkip) {
        log(`➡️ ${jobName} already using correct endpoint — skipping`);
        continue;
      }

      log(`${jobName}`);
      log(`   • from (live): ${fromLive}`);
      log(`   • to:          ${to} (${label})`);

      if (!dryRun) {
        const configEntry = configObjects.find(({ config }) =>
          Array.isArray(config.apps) && config.apps.some(app => app.name === jobName)
        );

        if (!configEntry) {
          log(`⛔ Job '${jobName}' not found in configs`);
          continue;
        }

        // Update env in config and write it back correctly
        let updated = false;
        for (const app of configEntry.config.apps) {
          if (app.name === jobName) {
            app.env = { ...app.env, SOLANA_RPC_URL_READ: to };
            updated = true;
          }
        }

        if (updated) {
          const isJs = configEntry.file.endsWith(".js");
          const contents = isJs
            ? "module.exports = " + JSON.stringify(configEntry.config, null, 2)
            : JSON.stringify(configEntry.config, null, 2);
          fs.writeFileSync(configEntry.file, contents);
        }

        await stopAndRestartJob(jobName, configEntry.file);
        log(`✅ Restarted ${jobName}`);
      } else {
        log(`   ⏱️ (dry run — no restart performed)`);
      }
    }

    log(`✅ Rotation complete (${dryRun ? "simulated" : "live"})`);

    if (!dryRun && pushover) {
      await sendPushoverAlert(`✅ Endpoint rotation completed successfully using ${healthy.length} endpoints.`);
    }
  } catch (error) {
    log(`⛔ Failed to load endpoint configuration: ${error.message}`);
    log("Make sure SOLANA_READ_ENDPOINTS is properly set in your .env file");
    if (pushover) {
      await sendPushoverAlert("🚨 Endpoint rotation failed - configuration error");
    }
    process.exit(1);
  }
};
