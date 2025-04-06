const fs = require("fs");
const path = require("path");
const JSON5 = require("json5");

function loadConfigFiles(configDir) {
  const files = fs.readdirSync(configDir).filter(f => f.endsWith(".json") || f.endsWith(".json5") || f.endsWith(".js"));
  return files.map(file => {
    const fullPath = path.join(configDir, file);
    const config = require(fullPath);
    return { config, file: fullPath };
  });
}

function extractJobEndpoints(configObjects) {
  const map = {};
  for (const { config } of configObjects) {
    for (const app of config.apps || []) {
      if (app.env?.SOLANA_RPC_URL_READ) {
        map[app.name] = app.env.SOLANA_RPC_URL_READ.replace(/\/+$/, "");
      }
    }
  }
  return map;
}

function assignNewReadEndpoints(jobEndpoints, healthyList, options = {}) {
  const {
    forceReassign = false,
    scramble = false,
    rotateDay = 0,
  } = options;

  const healthyReadEndpoints = healthyList.filter(e => !e.name.includes("W"));
  const assigned = {};

  const jobNames = Object.keys(jobEndpoints).sort();

  for (const jobName of jobNames) {
    const current = jobEndpoints[jobName];
    let newUrl;

    if (scramble) {
      const hash = hashString(jobName + rotateDay);
      const eligible = healthyReadEndpoints.filter(e => !forceReassign || e.url.replace(/\/+$/, "") !== current);

      // If forcing and all endpoints match current, fallback to all
      const pool = eligible.length > 0 ? eligible : healthyReadEndpoints;

      newUrl = pool[hash % pool.length].url;
    } else {
      newUrl = current; // keep as-is unless reassigning
    }

    assigned[jobName] = newUrl;
  }

  return assigned;
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

module.exports = {
  loadConfigFiles,
  extractJobEndpoints,
  assignNewReadEndpoints,
};
