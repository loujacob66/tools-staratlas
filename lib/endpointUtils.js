const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const JSON5 = require("json5");
const { log, logError } = require("./logger");

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
  } catch (err) {
    return false;
  }
}

async function runEndpointCheck(configDir, { pushover = false, quiet = false } = {}) {
  const inputFile = path.resolve(configDir, "endpoints.json5");
  const outputFile = path.resolve(configDir, "healthy-endpoints.json5");

  if (!fs.existsSync(inputFile)) {
    logError(`❌ endpoints.json5 not found in ${configDir}`);
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
