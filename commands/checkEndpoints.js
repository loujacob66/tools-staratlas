const { runEndpointCheck } = require("../lib/endpointUtils");
const { getPm2JobEnvMap } = require("../lib/pm2-utils");
const { findConfigFile } = require("../lib/fileUtils");
const { sendPushoverAlert } = require("../lib/notify");
const path = require("path");
const fs = require("fs");
const JSON5 = require("json5");
const { logSection, logInfo } = require("../lib/logger-enhanced");

function normalizeArgs(args = []) {
  const out = {};
  for (const arg of args) {
    if (arg === "--pushover") out.pushover = true;
  }
  return out;
}

module.exports = async function checkEndpoints(options) {
  if (Array.isArray(options)) options = normalizeArgs(options);

  console.log("[check] options:", options);
  logSection("Endpoint Check");
  const filePath = findConfigFile("endpoints.json5", options.configDir, options);
  const detectedDir = path.dirname(filePath);
  logInfo(`Using config from: ${filePath}`);

  const allEndpoints = JSON5.parse(fs.readFileSync(filePath, "utf8"));
  const healthy = await runEndpointCheck(detectedDir, options);

  if (options.pushover) {
    const jobMap = getPm2JobEnvMap();
    const readUrls = new Set();
    const writeUrls = new Set();

    for (const env of Object.values(jobMap)) {
      const read = env?.SOLANA_RPC_URL_READ?.replace(/\/+$/, "");
      const write = env?.SOLANA_RPC_URL_WRITE?.replace(/\/+$/, "");
      if (read) readUrls.add(read);
      if (write) writeUrls.add(write);
    }

    const healthyUrls = new Set(healthy.map(e => e.url.replace(/\/+$/, "")));

    const lines = [];
    let readCount = 0;
    let writeCount = 0;

    for (const e of allEndpoints) {
      const url = e.url.replace(/\/+$/, "");
      const isHealthy = healthyUrls.has(url);
      const isRead = readUrls.has(url);
      const isWrite = writeUrls.has(url);

      const status = isHealthy ? "✅" : "❌";
      let usage = "";
      if (isRead) {
        usage = "🟢";
        readCount++;
      } else if (isWrite) {
        usage = "⚪";
        writeCount++;
      }

      lines.push(`${status} ${e.name} ${usage}`);
    }

    const summary = `✅ ${healthy.length} healthy endpoints: ${readCount} read, ${writeCount} write\n`;
    const message = `${summary}\n${lines.join("\n")}`;

    await sendPushoverAlert(message.slice(0, 1024));
  }
};
