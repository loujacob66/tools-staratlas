// lib/pm2-utils.js
const { execSync } = require('child_process');

function getActiveEndpointsInUse() {
  try {
    const output = execSync('pm2 jlist').toString();
    const jobs = JSON.parse(output);

    const endpoints = new Set();

    for (const job of jobs) {
      const env = job.pm2_env?.env || {};
      const candidates = [
        env.RPC_ENDPOINT,
        env.SOLANA_RPC_URL_READ,
        env.SOLANA_RPC_URL_WRITE,
      ];

      candidates.forEach(url => {
        if (url && typeof url === 'string') {
          endpoints.add(url.replace(/\/+$/, ''));
        }
      });
    }

    return Array.from(endpoints);
  } catch (err) {
    console.error('[error] Failed to get active endpoints from PM2:', err);
    return [];
  }
}

module.exports = {
  getActiveEndpointsInUse,
};
