const fs = require("fs");
const path = require("path");
const { format } = require("date-fns");

let logStream = null;
let globalSilent = false;

function setSilent(silent) {
  globalSilent = silent;
}

function initLogger(logFilePath) {
  if (logFilePath) {
    const absPath = path.resolve(logFilePath);
    logStream = fs.createWriteStream(absPath, { flags: "a" });
  }
}

function getTimestamp() {
  return format(new Date(), "HH:mm:ss");
}

function writeLog(type, message, opts = {}) {
  const ts = opts.noTimestamp ? "" : `[${getTimestamp()}] `;
  const line = `${ts}[${type}] ${message}`;

  const isSilent = opts.silent !== undefined ? opts.silent : globalSilent;

  if (!isSilent) console.log(line);
  if (logStream) logStream.write(line + "\n");
}

// Neutral log with no [TYPE] prefix
function log(message, opts = {}) {
  const ts = opts.noTimestamp ? "" : `[${getTimestamp()}] `;
  const line = `${ts}${message}`;

  const isSilent = opts.silent !== undefined ? opts.silent : globalSilent;

  if (!isSilent) console.log(line);
  if (logStream) logStream.write(line + "\n");
}

function logInfo(msg, opts = {}) {
  writeLog("INFO", msg, opts);
}

function logWarn(msg, opts = {}) {
  writeLog("WARN", msg, opts);
}

function logError(msg, opts = {}) {
  writeLog("ERROR", msg, opts);
}

module.exports = {
  initLogger,
  setSilent,
  log,
  logInfo,
  logWarn,
  logError,
};
