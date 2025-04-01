// sample.config.js
module.exports = {
  apps: [
    {
      name: "Transport_Sample_Job",
      cwd: "/path/to/staratlas-labs",
      script: "./dist/main.js",
      args: "transport FLEET_X --base 'BASE_A' --target-resources 'ZONE_A:resource' -s fuel:1000000 -s food:500000",
      instances: 1,
      exp_backoff_restart_delay: 300000,
      env: {
        PRIORITY_FEE_LEVEL: "medium",
        PRIORITY_FEE_MAX: "50000",
        SOLANA_RPC_URL_WRITE: "https://your-rpc-provider/write-key",
        SOLANA_RPC_URL_READ: "https://your-rpc-provider/read-key"
      }
    },
    {
      name: "Refuel_And_Resupply",
      cwd: "/path/to/staratlas-labs",
      script: "./dist/main.js",
      args: "replenish fuel 1000000 '(-40,30)'",
      instances: 1,
      cron_restart: "0 */6 * * *",
      autorestart: false,
      env: {
        PRIORITY_FEE_LEVEL: "low",
        PRIORITY_FEE_MAX: "25000",
        SOLANA_RPC_URL_WRITE: "https://your-rpc-provider/write-key",
        SOLANA_RPC_URL_READ: "https://your-rpc-provider/read-key"
      }
    },
    {
      name: "Sample_Market_Export",
      cwd: "/path/to/staratlas-labs",
      script: "./dist/main.js",
      args: "export sample-token --reserve=100000",
      instances: 1,
      autorestart: false,
      cron_restart: "0 * * * *",
      env: {
        SOLANA_RPC_URL_WRITE: "https://your-rpc-provider/write-key",
        SOLANA_RPC_URL_READ: "https://your-rpc-provider/read-key"
      }
    }
  ]
};
