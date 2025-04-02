// check-endpoints.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const JSON5 = require('json5');
const argv = require('minimist')(process.argv.slice(2), {
  boolean: ['monitor', 'pushover', 'status'],
  default: { monitor: false, pushover: false, status: false },
});

const { getActiveEndpointsInUse } = require('../lib/pm2-utils');

const ENDPOINTS_PATH = path.resolve(process.cwd(), 'config', 'endpoints.json5');
const HEALTHY_PATH = path.resolve(process.cwd(), 'healthy-endpoints.json5');
const HEALTH_THRESHOLD = 5;

async function getHealthyEndpoints(endpoints) {
  const healthy = [];
  for (const entry of endpoints) {
    const endpoint = entry.url;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getHealth' })
      });
      const json = await res.json();
      if (json.result === 'ok') {
        healthy.push(endpoint);
      }
    } catch (err) {
      console.warn(`[warn] Failed to check endpoint: ${endpoint}`);
    }
  }
  return healthy;
}

async function sendPushoverAlert(message) {
  const PUSHOVER_USER = process.env.PUSHOVER_USER;
  const PUSHOVER_TOKEN = process.env.PUSHOVER_TOKEN;

  if (!PUSHOVER_USER || !PUSHOVER_TOKEN) {
    console.warn('[pushover] Missing credentials, skipping alert.');
    return;
  }

  try {
    await fetch('https://api.pushover.net/1/messages.json', {
      method: 'POST',
      body: new URLSearchParams({
        token: PUSHOVER_TOKEN,
        user: PUSHOVER_USER,
        message,
      }),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    console.log('[pushover] Alert sent.');
  } catch (err) {
    console.error('[pushover] Failed to send alert:', err);
  }
}

(async () => {
  const allEndpoints = JSON5.parse(fs.readFileSync(ENDPOINTS_PATH, 'utf8'));
  const knownUrls = allEndpoints.map(e => e.url.replace(/\/+$/, ''));
  const healthyEndpoints = await getHealthyEndpoints(allEndpoints);
  const inUse = getActiveEndpointsInUse();

  console.log(`[check] Healthy endpoints: ${healthyEndpoints.length}/${allEndpoints.length}`);

  const statusData = allEndpoints.map(entry => {
    const isHealthy = healthyEndpoints.includes(entry.url);
    const isInUse = inUse.includes(entry.url.replace(/\/+$/, ''));
    const healthMarker = isHealthy ? '✅' : '❌';
    const usageMarker = isInUse ? '🟢 in use' : '⚪ not in use';
    return {
      line: `${healthMarker} ${entry.name || entry.url} (${usageMarker})`,
      isInUse
    };
  });

  const sortedStatusReport = statusData
    .sort((a, b) => b.isInUse - a.isInUse)
    .map(item => item.line)
    .join('\n');

  console.log(sortedStatusReport);

  if (argv.status && argv.pushover) {
    await sendPushoverAlert(`🩺 Endpoint Health Report:\n${sortedStatusReport}`);
  }

  if (argv.monitor) {
    if (argv.pushover && healthyEndpoints.length < HEALTH_THRESHOLD) {
      await sendPushoverAlert(`❗ URGENT: Only ${healthyEndpoints.length}/${allEndpoints.length} endpoints are healthy.`);
    }

    if (argv.pushover) {
      const unhealthyInUse = inUse.filter(ep => !healthyEndpoints.includes(ep));
      const unknownInUse = inUse.filter(ep => !knownUrls.includes(ep));

      if (unhealthyInUse.length > 0) {
        const msg = `⚠️ The following in-use endpoints are unhealthy:\n` + unhealthyInUse.join('\n');
        await sendPushoverAlert(msg);
        console.warn('[warn] Unhealthy in-use endpoints:');
        unhealthyInUse.forEach(ep => console.warn(' ⚠️ ', ep));
      }

      if (unknownInUse.length > 0) {
        const msg = `❓ Unknown in-use endpoints (not in config):\n` + unknownInUse.join('\n');
        await sendPushoverAlert(msg);
        console.warn('[warn] Unknown in-use endpoints (not in config):');
        unknownInUse.forEach(ep => console.warn(' ❓ ', ep));
      }
    }

    process.exit(0);
  }

  // Write healthy endpoints list to file
  fs.writeFileSync(HEALTHY_PATH, JSON.stringify(healthyEndpoints, null, 2));
  console.log(`[check] Wrote healthy endpoints to: ${HEALTHY_PATH}`);
})();
