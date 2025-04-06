const fs = require("fs");
const path = require("path");
const { format } = require("date-fns");
let chalk = null;

try {
  chalk = require("chalk");
} catch (err) {
  chalk = {
    gray: x => x, green: x => x, yellow: x => x, red: x => x, cyan: x => x,
    bold: x => x
  };
}

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

function write(line, opts = {}) {
  const isSilent = opts.silent !== undefined ? opts.silent : globalSilent;
  if (!isSilent) console.log(line);
  if (logStream) logStream.write(line + "\n");
}

function log(msg, opts = {}) {
  const ts = opts.noTimestamp ? "" : chalk.gray(`[${getTimestamp()}] `);
  write(`${ts}${msg}`, opts);
}

function logInfo(msg, opts = {}) {
  const ts = opts.noTimestamp ? "" : chalk.gray(`[${getTimestamp()}] `);
  write(`${ts}${chalk.cyan("ℹ️  ")}${msg}`, opts);
}

function logSuccess(msg, opts = {}) {
  const ts = opts.noTimestamp ? "" : chalk.gray(`[${getTimestamp()}] `);
  write(`${ts}${chalk.green("✅ ")}${msg}`, opts);
}

function logWarn(msg, opts = {}) {
  const ts = opts.noTimestamp ? "" : chalk.gray(`[${getTimestamp()}] `);
  write(`${ts}${chalk.yellow("⚠️  ")}${msg}`, opts);
}

function logError(msg, opts = {}) {
  const ts = opts.noTimestamp ? "" : chalk.gray(`[${getTimestamp()}] `);
  write(`${ts}${chalk.red("⛔ ")}${msg}`, opts);
}

function logStep(msg, opts = {}) {
  const ts = opts.noTimestamp ? "" : chalk.gray(`[${getTimestamp()}] `);
  write(`${ts}${chalk.bold("➡️ ")}${msg}`, opts);
}

function logSection(title = "") {
  console.log(""); // line break
  console.log(chalk.bold("── " + title));
}

module.exports = {
  initLogger,
  setSilent,
  log,
  logInfo,
  logSuccess,
  logWarn,
  logError,
  logStep,
  logSection,
};
