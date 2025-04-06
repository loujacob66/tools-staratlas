const pm2 = require("pm2");
const { execSync } = require("child_process");

function getActiveEndpointsInUse() {
  const list = getPm2JobEnvMap();
  const urls = [];

  for (const env of Object.values(list)) {
    if (env.SOLANA_RPC_URL_READ) {
      urls.push(env.SOLANA_RPC_URL_READ.replace(/\/+$/, ""));
    }
  }

  return urls;
}

function getPm2JobEnvMap() {
  const result = {};
  const list = execSync("pm2 jlist").toString();
  const jobs = JSON.parse(list);

  for (const job of jobs) {
    result[job.name] = job.pm2_env.env || {};
  }

  return result;
}

module.exports = {
  getActiveEndpointsInUse,
  getPm2JobEnvMap,
};
