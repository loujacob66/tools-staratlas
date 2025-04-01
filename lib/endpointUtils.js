// lib/endpointUtils.js
const fs = require("fs");
const path = require("path");
const JSON5 = require("json5");
const fetch = require("node-fetch");
const { logInfo, logError } = require("./logger");

const ENDPOINTS_FILE = path.resolve(__dirname, "../config/endpoints.json5");
const OUTPUT_FILE = path.resolve(__dirname, "../healthy-endpoints.json5");

function readEndpoints() {
  if (!fs.existsSync(ENDPOINTS_FILE)) {
    throw new Error("endpoints.json5 not found");
  }
  const raw = fs.readFileSync(ENDPOINTS_FILE, "utf8");
  const parsed = JSON5.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

async function checkEndpoint(url, verbose = false) {
  const headers = { "Content-Type": "application/json" };
  const payload = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getSlot" });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: payload,
      timeout: 5000,
    });

    if (res.status === 429) {
      return { url, healthy: false, reason: "Over quota (429)" };
    }

    const json = await res.json();
    if (json.error || typeof json.result !== "number") {
      return { url, healthy: false, reason: json.error?.message || "Invalid response" };
    }

    return { url, healthy: true };
  } catch (err) {
    const reason = err.message?.split("\n")[0].slice(0, 60) || "Unknown error";
    return { url, healthy: false, reason: verbose ? err.message : reason };
  }
}

async function checkAllEndpoints({ verbose = false } = {}) {
  logInfo("\n🔍 Checking all endpoints in endpoints.json5...");
  const endpoints = readEndpoints();
  const results = [];

  for (const { url } of endpoints) {
    const result = await checkEndpoint(url, verbose);
    results.push(result);

    const shortUrl = url.replace(/^https:\/\//, "").slice(0, 25).padEnd(27);
    const icon = result.healthy ? "✅" : "❌";
    const status = result.healthy ? "Healthy" : `Unhealthy: ${result.reason}`;

    logInfo(`${icon}  ${shortUrl} ${status}`, { noTimestamp: true });
  }

  const healthy = results.filter(r => r.healthy).map(r => ({ url: r.url }));
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(healthy, null, 2));
  logInfo(`💾 Saved ${healthy.length} healthy endpoints to healthy-endpoints.json5`);
  logInfo(`✅ ${healthy.length} healthy endpoints available.`);
  logInfo("\n✨ Check complete. " + `${healthy.length} healthy endpoints saved to healthy-endpoints.json5.`);

  return healthy;
}

module.exports = {
  readEndpoints,
  checkEndpoint,
  checkAllEndpoints,
};