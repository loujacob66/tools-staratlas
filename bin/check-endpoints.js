// bin/check-endpoints.js
const path = require("path");
const fs = require("fs");
const JSON5 = require("json5");
const fetch = require("node-fetch");
const minimist = require("minimist");
const { logInfo, logError } = require("../lib/logger");

const args = minimist(process.argv.slice(2));
const configDir = args["config-dir"] ? path.resolve(args["config-dir"]) : process.cwd();

const INPUT_FILE = path.join(configDir, "endpoints.json5");
const OUTPUT_FILE = path.join(configDir, "healthy-endpoints.json5");

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

(async () => {
  if (!fs.existsSync(INPUT_FILE)) {
    logError(`❌ endpoints.json5 not found in ${configDir}`);
    process.exit(1);
  }

  const endpoints = JSON5.parse(fs.readFileSync(INPUT_FILE, "utf8"));
  const healthy = [];

  logInfo(`🔍 Checking ${endpoints.length} endpoints...`);

  for (const endpoint of endpoints) {
    const ok = await testEndpoint(endpoint);
    logInfo(`${ok ? "✅" : "❌"} ${endpoint.name}`);
    if (ok) healthy.push(endpoint);
  }

  if (healthy.length === 0) {
    logError("❌ No healthy endpoints found.");
    process.exit(1);
  }

  fs.writeFileSync(OUTPUT_FILE, JSON5.stringify(healthy, null, 2));
  logInfo(`✅ Wrote ${healthy.length} healthy endpoints to ${OUTPUT_FILE}`);
})();
