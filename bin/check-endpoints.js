#!/usr/bin/env node

const { checkAllEndpoints } = require("../lib/endpointUtils");
const { initLogger } = require("../lib/logger");

const args = process.argv.slice(2);
const logFileArg = args.find(arg => arg.startsWith("--log-file="));
const verbose = args.includes("--verbose");

if (logFileArg) {
  const logPath = logFileArg.split("=")[1];
  initLogger(logPath);
}

checkAllEndpoints({ verbose });