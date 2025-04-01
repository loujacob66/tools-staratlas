# tools-staratlas

CLI tools for managing Star Atlas automation using PM2, rotating and validating Solana RPC endpoints, launching job configs, and alerting on failures.

---

## 🚀 Features
- Launch PM2 jobs with per-job endpoint overrides
- Rotate or adapt PM2 config files for new endpoint assignments
- Health-check all endpoints in `endpoints.json5`
- Snapshot-based verification of core logic
- Support for dry-run, filtered launch, and logging

---

## 📦 Installation
```bash
git clone https://github.com/YOUR-USERNAME/tools-staratlas.git
cd tools-staratlas
npm install
```

---

## 📁 Directory Structure
```
.
├── bin/                   # CLI entry points (launch, check-endpoints)
├── config/                # Configuration files (endpoints.json5, etc.)
├── lib/                   # Core utility modules
├── .snapshots/            # Canvas sync verification snapshots
├── tools/                 # Internal dev tools (verify script)
└── sample.config.js       # Example PM2 job config
```

---

## 🛠 Commands

### `check-endpoints.js`
Checks health of all Solana RPC endpoints in `config/endpoints.json5`.

```bash
node bin/check-endpoints.js [--verbose] [--log-file=FILE]
```

**Flags:**
- `--verbose` — Show full error messages
- `--log-file=FILE` — Save output to a file

➡️ Output is written to `healthy-endpoints.json5`

### `launch.js`
Launches jobs from a PM2 config file, with optional config adjustments.

```bash
node bin/launch.js [--adapt-configs] [--launch] [--dry-run] [--only=job1,job2] [--log-file=FILE] my.config.js
```

**Flags:**
- `--adapt-configs` — Adjust config files before launching
- `--launch` — Run `pm2 start` on each job
- `--dry-run` — Show what would happen without taking action
- `--only=job1,job2` — Filter jobs by name
- `--log-file=FILE` — Output logs to a file

---

## 🧪 Snapshot Verification
Run this to check whether your local logic matches the verified canvas versions:
```bash
npm run verify
```

To update snapshots after edits:
```bash
npm run verify -- --save
```

---

## 🔐 Config Files

### `config/endpoints.json5`
```json5
[
  { url: "https://your-rpc-endpoint-1" },
  { url: "https://your-rpc-endpoint-2" }
]
```

### `sample.config.js`
A fully sanitized PM2 job config. Jobs reference `SOLANA_RPC_URL_WRITE` and `SOLANA_RPC_URL_READ` via `env`.

---

## 🔔 Coming Soon
- `--check-only` + `--pushover` alerting for endpoint failures
- Minimum healthy threshold enforcement
- Endpoint rotation dashboard

---

## 🧠 License
MIT © You. Customize as you like.
