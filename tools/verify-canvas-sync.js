// tools/verify-canvas-sync.js
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const FILES = [
  { label: "Endpoint Utils", file: "lib/endpointUtils.js" },
  { label: "Logger", file: "lib/logger.js" },
  { label: "Launch Utils", file: "lib/launchUtils.js" }
];

const SNAPSHOT_DIR = path.resolve(__dirname, "../.snapshots");
if (!fs.existsSync(SNAPSHOT_DIR)) fs.mkdirSync(SNAPSHOT_DIR);

function hashFile(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

const saveSnapshots = process.argv.includes("--save");
let allMatch = true;

for (const { label, file } of FILES) {
  const fullPath = path.resolve(__dirname, "../", file);
  const snapshotPath = path.join(SNAPSHOT_DIR, file.replace(/[\\/]/g, "__") + ".snap");

if (!fs.existsSync(fullPath)) {
    console.warn(`[WARN] ${label}: file not found`);
    continue;
  }

  const current = fs.readFileSync(fullPath, "utf8");
  const currentHash = hashFile(current);

  if (fs.existsSync(snapshotPath)) {
    const snap = fs.readFileSync(snapshotPath, "utf8");
    const snapHash = hashFile(snap);

    if (snapHash === currentHash) {
      console.log(`[OK] ${label} is in sync.`);
    } else {
      console.log(`[DIFF] ${label} has changed since last snapshot.`);
      console.log(`       file:     ${currentHash}`);
      console.log(`       snapshot: ${snapHash}`);
      if (saveSnapshots) {
        fs.writeFileSync(snapshotPath, current);
        console.log(`       → Snapshot updated.`);
      } else {
        allMatch = false;
      }
    }
  } else {
    fs.writeFileSync(snapshotPath, current);
    console.log(`[INIT] Snapshot created for ${label}`);
  }
}

if (!allMatch && !saveSnapshots) {
  console.log("\n💡 Run this script again with --save to accept changes as the new baseline.");
}
