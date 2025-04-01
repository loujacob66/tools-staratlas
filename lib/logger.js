// lib/logger.js
const fs = require("fs");
const path = require("path");
const { format } = require("date-fns");

let logStream = null;

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

  if (!opts.silent) console.log(line);
  if (logStream) logStream.write(line + "\n");
}

function logInfo(msg, opts) {
  writeLog("INFO", msg, opts);
}

function logWarn(msg, opts) {
  writeLog("WARN", msg, opts);
}

function logError(msg, opts) {
  writeLog("ERROR", msg, opts);
}

module.exports = {
  initLogger,
  logInfo,
  logWarn,
  logError,
};
