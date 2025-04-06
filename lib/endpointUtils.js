// lib/endpointUtils.js
const path = require("path");
const fs = require("fs");
const JSON5 = require("json5");
const fetch = require("node-fetch");
const { log, logError } = require("./logger");
const { findConfigFile } = require("./fileUtils");

async function testEndpoint(endpoint) {
  try {
    const res = await fetch(endpoint.url, {
      method: "POST",
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getHealth"
      }),
      headers: { "Content-Type": "application/json" },
      timeout: 5000
    });

    if (!res.ok) return false;
    const json = await res.json();
    return json.result === "ok";
  } catch (_) {
    return false;
  }
}

async function runEndpointCheck(configDir, { pushover = false, quiet = false } = {}) {
  const filePath = findConfigFile("endpoints.json5", configDir);
  const detectedDir = path.dirname(filePath);
  const inputFile = path.resolve(detectedDir, "endpoints.json5");
  const outputFile = path.resolve(detectedDir, "healthy-endpoints.json5");

  if (!fs.existsSync(inputFile)) {
    logError(`❌ endpoints.json5 not found in ${detectedDir}`);
    process.exit(1);
  }

  const endpoints = JSON5.parse(fs.readFileSync(inputFile, "utf8"));
  const healthy = [];

  log(`🔍 Checking ${endpoints.length} endpoints...`);

  for (const endpoint of endpoints) {
    const ok = await testEndpoint(endpoint);
    log(`${ok ? "✅" : "❌"} ${endpoint.name}`);
    if (ok) healthy.push(endpoint);
  }

  if (healthy.length === 0) {
    logError("❌ No healthy endpoints found.");
    process.exit(1);
  }

  fs.writeFileSync(outputFile, JSON5.stringify(healthy, null, 2));
  log(`✅ Wrote ${healthy.length} healthy endpoints to healthy-endpoints.json5`);

  return healthy;
}

module.exports = {
  runEndpointCheck
};
