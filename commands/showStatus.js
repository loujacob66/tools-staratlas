const fs = require("fs");
const path = require("path");
const JSON5 = require("json5");
const { log, logError } = require("../lib/logger");
const { getActiveEndpointsInUse } = require("../lib/pm2-utils");
const { sendPushoverAlert } = require("../lib/notify");
const { findConfigFile } = require("../lib/fileUtils");

module.exports = async function showStatus(configDir, { pushover = false }) {
  const filePath = findConfigFile("healthy-endpoints.json5", configDir, { pushover });

  const healthy = JSON5.parse(fs.readFileSync(filePath, "utf8"));
  const readCount = healthy.filter(e => !e.name.includes("W")).length;
  const writeCount = healthy.filter(e => e.name.includes("W")).length;

  const summary = `✅ ${healthy.length} healthy endpoints: ${readCount} read, ${writeCount} write`;
  log(summary);

  const active = getActiveEndpointsInUse();
  const lines = healthy.map(e => {
    const cleanedUrl = e.url.replace(/\/+$/, "");
    const inUse = active.includes(cleanedUrl);
    return `✅ ${e.name} ${inUse ? "🟢" : "⚪"}`;
  });

  lines.forEach(line => log(line));

  if (pushover) {
    const message = `${summary}\n\n${lines.join("\n")}`;
    sendPushoverAlert(message);
  }
};
