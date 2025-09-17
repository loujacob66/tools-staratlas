const { log, logSuccess, logError, logSection } = require("../lib/logger-enhanced");
const { getPm2JobEnvMap } = require("../lib/pm2-utils");
const { sendPushoverAlert } = require("../lib/notify");
const { getHealthyEndpoints, getWriteEndpoint } = require("../lib/envConfig");

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
    // Get endpoints from environment variables
    const healthy = getHealthyEndpoints();
    const writeEndpoint = getWriteEndpoint();
    const jobMap = getPm2JobEnvMap();

    const jobsByEndpoint = {};
    const healthyUrls = {};
    const usedHealthy = new Set();
    const invalidJobs = [];
    const jobsWithoutEndpoints = [];
    const writeEndpointJobs = [];

    // Set up read endpoints tracking
    for (const e of healthy) {
      const url = e.url.replace(/\/+$/, "");
      healthyUrls[url] = e.name;
      jobsByEndpoint[e.name] = [];
    }

    // Set up write endpoint tracking
    const writeEndpointNormalized = writeEndpoint.replace(/\/+$/, "");
    jobsByEndpoint["Write Endpoint"] = [];

    for (const [jobName, env] of Object.entries(jobMap)) {
      const readUrl = env.SOLANA_RPC_URL_READ;
      const writeUrl = env.SOLANA_RPC_URL_WRITE;
      
      // Check if job uses write endpoint
      if (writeUrl) {
        const writeUrlNormalized = writeUrl.replace(/\/+$/, "");
        if (writeUrlNormalized === writeEndpointNormalized) {
          writeEndpointJobs.push(jobName);
        }
      }
      
      // Check if job uses read endpoint
      if (readUrl) {
        const url = readUrl.replace(/\/+$/, "");
        const label = healthyUrls[url];

        if (label) {
          jobsByEndpoint[label].push(jobName);
          usedHealthy.add(label);
        } else {
          invalidJobs.push({ job: jobName, url: readUrl });
        }
      } else {
        // Job doesn't have a read endpoint (like StatusCheck_Hourly)
        jobsWithoutEndpoints.push(jobName);
      }
    }

    // Grouped output by read endpoint
    const sortedLabels = Object.keys(jobsByEndpoint).filter(label => label !== "Write Endpoint").sort();
    for (const label of sortedLabels) {
      const jobs = jobsByEndpoint[label];
      if (jobs.length > 0) {
        log(`✅ ${label} (${jobs.length} job${jobs.length !== 1 ? "s" : ""})`);
        jobs.forEach(j => log(`   • ${j}`));
      } else {
        log(`⚪ ${label} (unused)`);
      }
    }

    // Show write endpoint usage
    if (writeEndpointJobs.length > 0) {
      log(`✅ Write Endpoint (${writeEndpointJobs.length} job${writeEndpointJobs.length !== 1 ? "s" : ""})`);
      writeEndpointJobs.forEach(j => log(`   • ${j}`));
    } else {
      log(`⚪ Write Endpoint (unused)`);
    }

    // Show jobs without endpoints (make this more prominent)
    if (jobsWithoutEndpoints.length > 0) {
      logSection("System Jobs (No Endpoints Required)");
      for (const jobName of jobsWithoutEndpoints) {
        log(`🔧 ${jobName} - System monitoring job`);
      }
      log(`ℹ️  ${jobsWithoutEndpoints.length} system job${jobsWithoutEndpoints.length !== 1 ? 's' : ''} running independently`);
    }

    // Show invalid jobs
    if (invalidJobs.length > 0) {
      logSection("Jobs Using Invalid or Untracked Endpoints");
      for (const { job, url } of invalidJobs) {
        logError(`⛔ ${job} → ${url}`);
      }
    }

    if (pushover) {
      const totalReadJobs = Object.values(jobsByEndpoint).reduce((sum, list) => sum + list.length, 0) - writeEndpointJobs.length;
      
      // Create detailed endpoint status list for Pushover
      const lines = [];
      let activeCount = 0;
      let unusedCount = 0;

      // Read endpoints
      for (const label of sortedLabels) {
        const jobs = jobsByEndpoint[label];
        if (jobs.length > 0) {
          lines.push(`✅ ${label} 🟢 (${jobs.length} job${jobs.length !== 1 ? 's' : ''})`);
          activeCount++;
        } else {
          lines.push(`⚪ ${label} (unused)`);
          unusedCount++;
        }
      }

      // Write endpoint
      if (writeEndpointJobs.length > 0) {
        lines.push(`✅ Write Endpoint ✏️ (${writeEndpointJobs.length} job${writeEndpointJobs.length !== 1 ? 's' : ''})`);
        activeCount++;
      } else {
        lines.push(`⚪ Write Endpoint (unused)`);
        unusedCount++;
      }

      // Jobs without endpoints (make more prominent in Pushover too)
      if (jobsWithoutEndpoints.length > 0) {
        lines.push('');
        lines.push(`🔧 System Jobs (${jobsWithoutEndpoints.length}):`);
        for (const jobName of jobsWithoutEndpoints) {
          lines.push(`🔧 ${jobName} - Monitoring`);
        }
      }

      // Invalid jobs
      if (invalidJobs.length > 0) {
        lines.push('');
        lines.push('⛔ Invalid Endpoints:');
        for (const { job, url } of invalidJobs) {
          const shortUrl = url.split('/').pop().substring(0, 8) + '...';
          lines.push(`❌ ${job} → ${shortUrl}`);
        }
      }

      const totalEndpoints = healthy.length + 1; // read endpoints + write endpoint
      const totalJobs = totalReadJobs + writeEndpointJobs.length;
      const summary = `📊 Status: ${totalJobs} endpoint jobs + ${jobsWithoutEndpoints.length} system jobs | ${usedHealthy.size + (writeEndpointJobs.length > 0 ? 1 : 0)}/${totalEndpoints} endpoints (${activeCount} active, ${unusedCount} unused)`;
      const message = `${summary}\n\n${lines.join('\n')}`;

      await sendPushoverAlert(message.slice(0, 1024));
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
