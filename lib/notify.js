const fetch = require("node-fetch");
const { log, logError } = require("./logger");

const PUSHOVER_USER = process.env.PUSHOVER_USER;
const PUSHOVER_TOKEN = process.env.PUSHOVER_TOKEN;

function sendPushoverAlert(message) {
  if (!PUSHOVER_USER || !PUSHOVER_TOKEN) {
    logError("❌ Pushover credentials not set (PUSHOVER_USER, PUSHOVER_TOKEN)");
    return;
  }

  fetch("https://api.pushover.net/1/messages.json", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      token: PUSHOVER_TOKEN,
      user: PUSHOVER_USER,
      message,
    })
  })
    .then(res => res.json())
    .then(json => {
      if (json.status !== 1) {
        logError(`❌ Failed to send Pushover alert: ${JSON.stringify(json)}`);
      } else {
        log("📣 Pushover alert sent.");
      }
    })
    .catch(err => {
      logError(`❌ Error sending Pushover alert: ${err.message}`);
    });
}

module.exports = {
  sendPushoverAlert
};
