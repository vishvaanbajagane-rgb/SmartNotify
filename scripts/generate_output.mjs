#!/usr/bin/env node
/**
 * SmartNotify AI — output.csv generator (Node.js)
 * Reads attached_assets/messages_1785592641857.csv and writes output.csv
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// ─── Patterns ────────────────────────────────────────────────────────────────
const INJECTION = [
  /routing override/i, /system note.*router/i, /internal router metadata/i,
  /set action=/i, /verified_business=true/i, /user_priority=high/i,
  /assistant instruction.*ignore/i, /mark.*notify.*confidence/i,
  /classify as urgent/i, /mark (as )?notify/i,
];
const SCAM = [
  /\botp\b/i, /login code/i, /verification code/i, /6 digit/i,
  /account.*(block|restrict|suspend|lock)/i, /(block|restrict|suspend|lock).*account/i,
  /profile.*block/i, /access.*block/i, /verify.*now/i,
  /share.*otp/i, /send.*otp/i, /send.*code/i, /reply.*code/i,
  /wallet.*details/i, /bank.*details/i, /fill.*bank/i,
  /pay.*clearance/i, /clearance.*amount/i, /processing fee/i,
  /service.*reactivat/i, /benefit.*approval.*pending/i,
  /scan.*qr.*pay/i, /screenshot.*after.*submission/i,
  /account-login\.in/i, /amazonpay-delivery\.in/i, /pay-check-secure\.com/i,
  /account-help\.in/i, /chase-secure-alert\.com/i, /bit\.ly\/verify/i,
];
const SPAM = [
  /forward.*to.*\d+.*people/i, /share.*with.*\d+.*people/i,
  /send.*to.*\d+.*groups/i, /share.*in.*all.*family.*groups/i,
  /forward.*in.*all.*family/i, /do not break the chain/i, /don't break the chain/i,
  /for.*blessings/i, /for good luck/i, /positive energy failao/i,
  /bhagwan sabka bhala/i, /fwd as received/i,
];
const URGENT = [
  /urgently?/i, /immediately/i, /right now/i,
  /in.*next.*\d+.*min/i, /leaving in \d+ min/i, /in \d+ minutes/i,
  /call me now/i, /need you on this/i, /can you call/i,
  /don't wait till later/i, /jaldi/i, /abhi/i, /time kam hai/i, /nikalna padega/i,
];
const PAYMENT = [
  /payment due/i, /maintenance.*pay/i, /pay.*before.*\d+/i,
  /complete.*before.*\d+.*(pm|am)/i, /late fee/i, /society.*pay/i, /fee.*due/i,
];
const EVENT = [
  /forms? (close|closes|closing|lock)/i, /submission.*deadline/i,
  /portal.*lock/i, /registration.*open/i, /sign.*consent/i,
  /field.?trip/i, /internship.*approval/i, /maintenance.*start/i,
  /lift.*maintenance/i, /fire alarm test/i, /tanker.*leav/i,
  /bus list/i, /potluck/i, /faculty advising/i,
];
const PROMOTION = [
  /\d+%\s*off/i, /limited.*offer/i, /offer.*expir/i, /shop.*collection/i,
  /selected.*product/i, /shopping.*benefit/i, /launch discount/i,
  /travel deal/i, /saved.*deal/i, /welcome.*discount/i,
];
const BUSINESS_UPDATE = [
  /your order/i, /order.*pack/i, /delivery.*attempt/i, /delivery.*schedule/i,
  /return.*pickup/i, /card.*statement/i, /statement.*ready/i,
  /health.*update/i, /appointment/i, /prescription/i,
  /ride update/i, /route.*chang/i, /pickup.*status/i,
  /account.*payment.*update/i,
];
const GREETING = [
  /good morning/i, /good evening/i, /good night/i,
  /have a good day/i, /stay blessed/i, /smile today/i,
];

const TRUST = {
  business_001: 0.95, business_002: 0.70, business_003: 0.75,
  business_004: 0.87, business_012: 0.80, business_032: 0.87,
  business_033: 0.50, business_036: 0.15, business_060: 0.87,
  business_061: 0.92, business_062: 0.05, business_064: 0.35,
  business_067: 0.78, business_070: 0.92, business_076: 0.82,
  business_091: 0.80, business_092: 0.82, business_093: 0.87,
  business_094: 0.70, business_095: 0.60, business_096: 0.92,
  business_097: 0.25,
};

const m = (text, pats) => pats.some(p => p.test(text));
const r = n => Math.round(n * 100) / 100;

function classify(row) {
  const text = row.message_text || "";
  const conv = row.conversation_type;
  const fwd = parseInt(row.forwarded_count || "0", 10);
  const businessId = row.business_id || "";
  const userId = row.user_id || "";
  const mediaType = row.media_type || "";
  const msgId = row.message_id;

  if (m(text, INJECTION))
    return { message_id: msgId, action: "mute", message_type: "scam",
      reason: "Prompt injection attempt detected — message tries to override the notification router.",
      confidence: 0.99, evidence_message_ids: "none" };

  const isScam = m(text, SCAM);
  const trustScore = TRUST[businessId] ?? 0.6;
  const isUntrustedBiz = businessId && trustScore < 0.4;

  if (isScam || (conv === "business" && isUntrustedBiz && text.length > 20))
    return { message_id: msgId, action: "mute", message_type: "scam",
      reason: "Message exhibits scam indicators: OTP/code extraction, suspicious link, account threat, or payment coercion.",
      confidence: r(isScam ? 0.93 : 0.75), evidence_message_ids: "none" };

  const isChain = m(text, SPAM);
  const isBlessFwd = fwd >= 7 && /blessings|positive energy|bhagwan|smile today|stay blessed/.test(text.toLowerCase());
  const isFwdHealth = fwd >= 6 && /health|doctor|herbal|tablets|tip.*fix/.test(text.toLowerCase());

  if (isChain || isBlessFwd || isFwdHealth)
    return { message_id: msgId, action: "mute", message_type: "spam",
      reason: `Chain or mass-forwarded spam message (${fwd} forwards). No actionable content.`,
      confidence: 0.91, evidence_message_ids: "none" };

  if (mediaType === "voice" && !text) {
    const act = (trustScore < 0.5 && conv === "business") ? "mute"
      : conv === "business" ? "digest" : "notify";
    return { message_id: msgId, action: act, message_type: "unknown",
      reason: `Voice note from ${conv} conversation; content requires listening.`,
      confidence: 0.60, evidence_message_ids: "none" };
  }

  const isUrgent = m(text, URGENT);
  const isMentioned = text.includes(`@${userId}`);
  const isTimeSensitive = /\d+\s*(min|minutes?|pm|am|hrs?|hours?)/i.test(text);
  const isMedical = /doctor|clinic|appointment|specialist|hospital/.test(text.toLowerCase());
  const isWork = /build|deploy|client|rollback|standup|sync|deployment|refund edge|payment worker|queue/.test(text.toLowerCase());

  if (conv === "personal") {
    if (isUrgent || isMentioned || isTimeSensitive || isMedical || isWork)
      return { message_id: msgId, action: "notify", message_type: "urgent",
        reason: "Personal message with time-sensitive or urgent content.",
        confidence: 0.88, evidence_message_ids: "none" };
    if (fwd === 0)
      return { message_id: msgId, action: "notify", message_type: "personal",
        reason: "Direct personal message from a known contact.",
        confidence: 0.80, evidence_message_ids: "none" };
    return { message_id: msgId, action: "digest", message_type: "forward",
      reason: `Forwarded personal message (${fwd} hops); lower urgency.`,
      confidence: 0.72, evidence_message_ids: "none" };
  }

  if (conv === "group") {
    if (fwd >= 9)
      return { message_id: msgId, action: "mute", message_type: "spam",
        reason: `Highly forwarded group message (${fwd} forwards) with low personal relevance.`,
        confidence: 0.87, evidence_message_ids: "none" };
    if (m(text, PAYMENT) && fwd <= 2)
      return { message_id: msgId, action: "notify", message_type: "payment",
        reason: "Payment deadline or dues notice from group — likely a legitimate admin.",
        confidence: 0.80, evidence_message_ids: "none" };
    if (m(text, EVENT))
      return { message_id: msgId, action: "notify", message_type: "event",
        reason: "Group event notice or time-sensitive announcement requiring action.",
        confidence: 0.82, evidence_message_ids: "none" };
    if (isMentioned || (isUrgent && fwd <= 2))
      return { message_id: msgId, action: "notify", message_type: "urgent",
        reason: "User directly mentioned or urgent time-sensitive request in group.",
        confidence: 0.87, evidence_message_ids: "none" };
    if (isWork)
      return { message_id: msgId, action: "notify", message_type: "urgent",
        reason: "Work-related message with actionable technical or business content.",
        confidence: 0.85, evidence_message_ids: "none" };
    if (m(text, PROMOTION) && fwd > 2)
      return { message_id: msgId, action: "mute", message_type: "promotion",
        reason: "Commercial promotion forwarded in group; low personal relevance.",
        confidence: 0.77, evidence_message_ids: "none" };
    if (m(text, GREETING) && fwd >= 3)
      return { message_id: msgId, action: "mute", message_type: "greeting",
        reason: `Mass-forwarded greeting (${fwd} forwards) with no actionable content.`,
        confidence: 0.85, evidence_message_ids: "none" };
    return { message_id: msgId, action: "digest", message_type: "personal",
      reason: "Casual group conversation; can be reviewed later.",
      confidence: 0.73, evidence_message_ids: "none" };
  }

  if (conv === "business") {
    if (m(text, BUSINESS_UPDATE) && trustScore >= 0.75) {
      const isCritical = /delivery|order|appointment|ride update|pickup today|return pickup|fedex/i.test(text);
      return { message_id: msgId, action: isCritical ? "notify" : "digest",
        message_type: "business_update",
        reason: isCritical ? "Trusted business with actionable delivery or service update."
          : "Trusted business update reviewable at convenience.",
        confidence: r(trustScore), evidence_message_ids: "none" };
    }
    if (m(text, PROMOTION)) {
      const act = trustScore >= 0.75 && fwd === 0 ? "digest" : "mute";
      return { message_id: msgId, action: act, message_type: "promotion",
        reason: "Business promotional message; scheduled for digest or muted based on trust.",
        confidence: r(trustScore * 0.85), evidence_message_ids: "none" };
    }
    if (/survey|feedback|review|experience/i.test(text))
      return { message_id: msgId, action: "digest", message_type: "business_update",
        reason: "Business requesting feedback or survey response; low priority.",
        confidence: 0.70, evidence_message_ids: "none" };
    return { message_id: msgId, action: "digest", message_type: "business_update",
      reason: "Business message with insufficient signals for high-priority routing.",
      confidence: r(trustScore), evidence_message_ids: "none" };
  }

  return { message_id: msgId, action: "digest", message_type: "unknown",
    reason: "Insufficient context; routed to digest for manual review.",
    confidence: 0.55, evidence_message_ids: "none" };
}

// ─── CSV parser ───────────────────────────────────────────────────────────────
function parseCSV(raw) {
  const lines = [];
  let cur = "", inQ = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c === '"') { inQ = !inQ; cur += c; }
    else if (c === "\n" && !inQ) { lines.push(cur); cur = ""; }
    else cur += c;
  }
  if (cur.trim()) lines.push(cur);
  if (lines.length < 2) return [];

  const header = lines[0].split(",").map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const fields = [];
    let field = "", inFQ = false;
    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      if (c === '"') inFQ = !inFQ;
      else if (c === ',' && !inFQ) { fields.push(field.replace(/^"|"$/g, "").replace(/""/g, '"')); field = ""; }
      else field += c;
    }
    fields.push(field.replace(/^"|"$/g, "").replace(/""/g, '"'));
    const obj = {};
    header.forEach((h, idx) => { obj[h] = (fields[idx] ?? "").trim(); });
    rows.push(obj);
  }
  return rows;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const inputPath = path.join(root, "attached_assets", "messages_1785592641857.csv");
const outputPath = path.join(root, "output.csv");

const raw = fs.readFileSync(inputPath, "utf-8");
const rows = parseCSV(raw);
console.log(`Loaded ${rows.length} messages`);

const results = rows.map(classify);

const header = "message_id,action,message_type,reason,confidence,evidence_message_ids";
const csvLines = results.map(r =>
  `${r.message_id},${r.action},${r.message_type},"${r.reason.replace(/"/g, '""')}",${r.confidence},${r.evidence_message_ids}`
);
fs.writeFileSync(outputPath, [header, ...csvLines].join("\n"), "utf-8");
console.log(`Written ${results.length} predictions to output.csv`);

const counts = {};
results.forEach(r => { counts[r.action] = (counts[r.action] || 0) + 1; });
console.log("\nAction distribution:", counts);
