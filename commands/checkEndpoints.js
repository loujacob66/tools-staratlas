const { runEndpointCheck } = require("../lib/endpointUtils");
const { getPm2JobEnvMap } = require("../lib/pm2-utils");
const { sendPushoverAlert } = require("../lib/notify");
const { logSection, logInfo } = require("../lib/logger-enhanced");
const { getAllEndpoints } = require("../lib/envConfig");

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
  
  try {
    // Get endpoints from environment variables instead of JSON file
    const allEndpoints = getAllEndpoints();
    logInfo(`Using endpoint configuration from .env file (${allEndpoints.length} endpoints)`);

    // Note: runEndpointCheck expects a directory path, but since we're using env vars,
    // we'll pass the current directory and modify runEndpointCheck if needed
    const healthy = await runEndpointCheck(process.cwd(), options, allEndpoints);

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
  } catch (error) {
    console.error(`[check] Failed to load endpoint configuration: ${error.message}`);
    console.error("Make sure SOLANA_READ_ENDPOINTS and SOLANA_WRITE_ENDPOINT are properly set in your .env file");
    if (options.pushover) {
      await sendPushoverAlert("🚨 Failed to load endpoint configuration from .env file");
    }
    process.exit(1);
  }
};
