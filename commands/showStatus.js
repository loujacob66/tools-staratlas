const { findConfigFile } = require("../lib/fileUtils");

const filePath = findConfigFile("healthy-endpoints.json5", configDir, { pushover });
