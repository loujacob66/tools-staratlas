// scan.config.js
const path = require("path");

// Allow overriding from environment or default to expected location
const SOLANA_BOT_ROOT = process.env.SOLANA_BOT_ROOT || path.resolve(__dirname, "../../staratlas-labs-solanabot");

module.exports = {
  apps: [
    {
      name: "MRZ-36:SCAN_LEMONPARTY",
      cwd: path.join(SOLANA_BOT_ROOT),
      script: "./dist/main.js",
      args: "scan 'LEMONPARTY' 'MRZ-36' --minProbability=.35 --scanStrikeCount=4 --travelModeToStarbase warp",
      instances: 1,
      exp_backoff_restart_delay: 30000,
      env: {
        PRIORITY_FEE_LEVEL: "medium",
        PRIORITY_FEE_MAX: "50000",
        SOLANA_RPC_URL_WRITE: "https://example-writer.url",
        SOLANA_RPC_URL_READ: "https://example-reader.url"
      }
    }
  ]
};
