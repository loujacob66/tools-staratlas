# tools-staratlas

CLI tools for managing Star Atlas automation using PM2, rotating and validating Solana RPC endpoints, launching job configs, and alerting on failures.

---

## 🚀 Features
- Launch PM2 jobs with per-job endpoint overrides
- Rotate or adapt PM2 config files for new endpoint assignments
- Health-check all endpoints from environment configuration
- Environment-based endpoint configuration for security and flexibility
- Support for dry-run, filtered launch, and logging
- Pushover notifications for endpoint health and job status

---

## 📦 Installation
```bash
git clone https://github.com/YOUR-USERNAME/tools-staratlas.git
cd tools-staratlas
npm install
cp .env.sample .env
# Edit .env file with your endpoint and notification settings
```

---

## 📁 Directory Structure
```
.
├── bin/                   # CLI entry points (launch)
├── commands/              # Command implementations
├── lib/                   # Core utility modules
├── config/                # Legacy configuration files
├── .snapshots/            # Canvas sync verification snapshots
├── tools/                 # Internal dev tools (verify script)
├── .env                   # Environment configuration (endpoints, keys)
└── sample.config.js       # Example PM2 job config
```

---

## 🔐 Configuration

### Environment Variables (`.env`)

Create a `.env` file from `.env.sample` and configure:

```bash
# Pushover Notifications (optional)
PUSHOVER_USER=your_pushover_user_key
PUSHOVER_TOKEN=your_pushover_app_token

# Solana Write Endpoint (single endpoint for write operations)
SOLANA_WRITE_ENDPOINT=https://your-write-endpoint-url

# Solana Read Endpoints (comma-separated name:url pairs)
SOLANA_READ_ENDPOINTS=Endpoint 1:https://url1,Endpoint 2:https://url2,Endpoint 3:https://url3
```

**Note:** The application now uses environment variables instead of JSON configuration files for endpoint management. This provides better security and easier deployment.

---

## 🛠 Commands

### `launch status`
Shows endpoint usage overview and identifies any jobs using invalid endpoints.

```bash
node bin/launch status [--pushover]
```

**Flags:**
- `--pushover` — Send status report via Pushover notification

### `launch check`
Health-checks all configured endpoints from environment variables.

```bash
node bin/launch check [--pushover]
```

**Flags:**
- `--pushover` — Send health report via Pushover notification

### Other Commands
- `launch start` — Start PM2 jobs
- `launch rotate` — Rotate endpoint assignments

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

## 🔄 Migration from JSON Config

If upgrading from the JSON-based configuration:

1. Copy your endpoints from `config/endpoints.json5` to the `.env` file
2. Separate read and write endpoints appropriately
3. The application maintains backward compatibility with JSON files as fallback

---

## 🔔 Features
- Environment-based endpoint configuration for improved security
- Pushover integration for monitoring and alerts
- PM2 job status tracking and endpoint validation
- Health monitoring for all Solana RPC endpoints
- Endpoint rotation and load balancing support

---

## 🧠 License
MIT © You. Customize as you like.
