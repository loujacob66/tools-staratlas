const { log } = require("./logger");
const { execSync } = require("child_process");

function launchJobs(configPath, jobNames, dryRun = false) {
  log("🚀 Launching jobs...");

  for (const name of jobNames) {
    const cmd = `pm2 start "${configPath}" --only "${name}"`;

    if (dryRun) {
      log(`[dry-run] Would run: ${cmd}`, { noTimestamp: true });
    } else {
      log(`Running: ${cmd}`);
      execSync(cmd, { stdio: "inherit" });
    }
  }

  log(dryRun ? "\n✨ Dry run complete." : `\n✅ Launched ${jobNames.length} job(s).`);
}

module.exports = {
  launchJobs,
};
