// lib/launchUtils.js
const { logInfo } = require("./logger");
const { execSync } = require("child_process");

function launchJobs(configPath, jobNames, dryRun = false) {
  logInfo("Launching jobs...");
  for (const name of jobNames) {
    const cmd = `pm2 start "${configPath}" --only "${name}"`;
    if (dryRun) {
      logInfo(`[dry-run] Would run: ${cmd}`, { noTimestamp: true });
    } else {
      logInfo(`Running: ${cmd}`);
      execSync(cmd, { stdio: "inherit" });
    }
  }
  logInfo(`\n${dryRun ? "Dry run complete." : "✅ Done."} (${jobNames.length} total)`);
}

module.exports = {
  launchJobs,
};