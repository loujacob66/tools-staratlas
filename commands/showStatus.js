const { log, logSuccess, logError, logSection } = require("../lib/logger-enhanced");
const { getPm2JobEnvMap } = require("../lib/pm2-utils");
const { sendPushoverAlert } = require("../lib/notify");
const { getHealthyEndpoints } = require("../lib/envConfig");

function normalizeArgs(args = []) {
  const out = {};
  for (const arg of args) {
    if (arg === "--pushover") out.pushover = true;
  }
  return out;
}

async function showStatus(options = {}) {
  if (Array.isArray(options)) options = normalizeArgs(options);

  console.log("[status] options:", options);
  const { pushover } = options;

  logSection("Endpoint Usage Overview");

  try {
    // Get endpoints from environment variables instead of JSON file
    const healthy = getHealthyEndpoints();
    const jobMap = getPm2JobEnvMap();

    const jobsByEndpoint = {};
    const healthyUrls = {};
    const usedHealthy = new Set();
    const invalidJobs = [];

    for (const e of healthy) {
      const url = e.url.replace(/\/+$/, "");
      healthyUrls[url] = e.name;
      jobsByEndpoint[e.name] = [];
    }

    for (const [jobName, env] of Object.entries(jobMap)) {
      const rawUrl = env.SOLANA_RPC_URL_READ;
      if (!rawUrl) continue;

      const url = rawUrl.replace(/\/+$/, "");
      const label = healthyUrls[url];

      if (label) {
        jobsByEndpoint[label].push(jobName);
        usedHealthy.add(label);
      } else {
        invalidJobs.push({ job: jobName, url });
      }
    }

    // Grouped output by endpoint
    const sortedLabels = Object.keys(jobsByEndpoint).sort();
    for (const label of sortedLabels) {
      const jobs = jobsByEndpoint[label];
      if (jobs.length > 0) {
        log(`✅ ${label} (${jobs.length} job${jobs.length !== 1 ? "s" : ""})`);
        jobs.forEach(j => log(`   • ${j}`));
      } else {
        log(`⚪ ${label} (unused)`);
      }
    }

    if (invalidJobs.length > 0) {
      logSection("Jobs Using Invalid or Untracked Endpoints");
      for (const { job, url } of invalidJobs) {
        logError(`⛔ ${job} → ${url}`);
      }
    }

    if (pushover) {
      const total = Object.values(jobsByEndpoint).reduce((sum, list) => sum + list.length, 0);
      const report = [`${total} jobs using ${usedHealthy.size} healthy endpoints.`];
      if (invalidJobs.length > 0) {
        report.push(`${invalidJobs.length} job(s) using invalid endpoints.`);
      }
      sendPushoverAlert(report.join("\n"));
    }
    
  } catch (error) {
    logError(`Failed to load endpoint configuration: ${error.message}`);
    logError("Make sure SOLANA_READ_ENDPOINTS is properly set in your .env file");
    if (pushover) {
      await sendPushoverAlert("🚨 Failed to load endpoint configuration from .env file");
    }
    process.exit(1);
  }
}

module.exports = showStatus;
