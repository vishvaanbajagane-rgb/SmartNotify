/**
 * SmartNotify AI — Notification Routing Engine
 * Classifies WhatsApp messages into notify / digest / mute with full explainability.
 */

export type Action = "notify" | "digest" | "mute";
export type MessageType =
  | "personal"
  | "urgent"
  | "event"
  | "payment"
  | "business_update"
  | "promotion"
  | "greeting"
  | "forward"
  | "spam"
  | "scam"
  | "unknown";

export interface MessageInput {
  messageId: string;
  userId: string;
  conversationType: "personal" | "group" | "business";
  groupId?: string | null;
  businessId?: string | null;
  senderUserId?: string | null;
  createdAt: string;
  messageText?: string | null;
  mediaType?: string | null;
  mediaId?: string | null;
  forwardedCount: number;
}

export interface PredictionOutput {
  action: Action;
  messageType: MessageType;
  reason: string;
  confidence: number;
  evidenceMessageIds: string;
  scamProbability: number;
  spamProbability: number;
  urgencyScore: number;
  businessTrustScore: number;
  personalizationFactors: string[];
}

// ─── Detection patterns ───────────────────────────────────────────────────────

const INJECTION_PATTERNS = [
  /routing override/i,
  /system note.*router/i,
  /internal router metadata/i,
  /set action=/i,
  /verified_business=true/i,
  /user_priority=high/i,
  /assistant instruction.*ignore/i,
  /mark.*notify.*confidence/i,
  /classify as urgent/i,
  /mark (as )?notify/i,
];

const SCAM_PATTERNS = [
  /\botp\b/i,
  /login code/i,
  /verification code/i,
  /6 digit/i,
  /account.*(block|restrict|suspend|lock)/i,
  /(block|restrict|suspend|lock).*account/i,
  /profile.*block/i,
  /access.*block/i,
  /verify.*now/i,
  /share.*otp/i,
  /send.*otp/i,
  /send.*code/i,
  /reply.*code/i,
  /wallet.*details/i,
  /bank.*details/i,
  /fill.*bank/i,
  /pay.*clearance/i,
  /clearance.*amount/i,
  /processing fee/i,
  /service.*reactivat/i,
  /benefit.*approval.*pending/i,
  /scan.*qr.*pay/i,
  /screenshot.*after.*submission/i,
  /account-login\.in/i,
  /amazonpay-delivery\.in/i,
  /pay-check-secure\.com/i,
  /account-help\.in/i,
  /chase-secure-alert\.com/i,
  /bit\.ly\/verify/i,
];

const SPAM_PATTERNS = [
  /forward.*to.*\d+.*people/i,
  /share.*with.*\d+.*people/i,
  /send.*to.*\d+.*groups/i,
  /share.*in.*all.*family.*groups/i,
  /forward.*in.*all.*family/i,
  /do not break the chain/i,
  /don't break the chain/i,
  /for.*blessings/i,
  /for good luck/i,
  /positive energy failao/i,
  /bhagwan sabka bhala/i,
  /fwd as received/i,
];

const URGENT_PATTERNS = [
  /urgently?/i,
  /immediately/i,
  /right now/i,
  /in.*next.*\d+.*min/i,
  /leaving in \d+ min/i,
  /in \d+ minutes/i,
  /call me now/i,
  /need you on this/i,
  /can you call/i,
  /don't wait till later/i,
  /jaldi/i,
  /abhi/i,
  /time kam hai/i,
  /nikalna padega/i,
];

const PAYMENT_PATTERNS = [
  /payment due/i,
  /maintenance.*pay/i,
  /pay.*before.*\d+/i,
  /complete.*before.*\d+.*(pm|am)/i,
  /late fee/i,
  /society.*pay/i,
  /fee.*due/i,
];

const EVENT_PATTERNS = [
  /forms? (close|closes|closing|lock)/i,
  /submission.*deadline/i,
  /portal.*lock/i,
  /registration.*open/i,
  /sign.*consent/i,
  /field.?trip/i,
  /internship.*approval/i,
  /maintenance.*start/i,
  /lift.*maintenance/i,
  /fire alarm test/i,
  /tanker.*leav/i,
  /bus list/i,
  /potluck/i,
  /faculty advising/i,
];

const PROMOTION_PATTERNS = [
  /\d+%\s*off/i,
  /limited.*offer/i,
  /offer.*expir/i,
  /shop.*collection/i,
  /selected.*product/i,
  /shopping.*benefit/i,
  /launch discount/i,
  /travel deal/i,
  /saved.*deal/i,
  /welcome.*discount/i,
];

const BUSINESS_UPDATE_PATTERNS = [
  /your order/i,
  /order.*pack/i,
  /delivery.*attempt/i,
  /delivery.*schedule/i,
  /return.*pickup/i,
  /card.*statement/i,
  /statement.*ready/i,
  /health.*update/i,
  /appointment/i,
  /prescription/i,
  /ride update/i,
  /route.*chang/i,
  /pickup.*status/i,
  /account.*payment.*update/i,
];

const GREETING_PATTERNS = [
  /good morning/i,
  /good evening/i,
  /good night/i,
  /have a good day/i,
  /stay blessed/i,
  /smile today/i,
];

// Known business trust scores
const BUSINESS_TRUST: Record<string, number> = {
  business_001: 0.95, // Amazon
  business_002: 0.70, // Generic banking — moderate
  business_003: 0.75, // Shopping
  business_004: 0.87, // Healthcare
  business_012: 0.80, // Beauty
  business_032: 0.87, // Healthcare
  business_033: 0.50,
  business_036: 0.15, // Suspicious Amazon lookalike
  business_060: 0.87, // Shopee
  business_061: 0.92, // Ride service
  business_062: 0.05, // Phishing / Chase fake
  business_064: 0.35, // Suspicious food refund
  business_067: 0.78, // Shopping
  business_070: 0.92, // FedEx
  business_076: 0.82, // Banking
  business_091: 0.80, // Product review
  business_092: 0.82, // Travel
  business_093: 0.87, // RazorpayX
  business_094: 0.70,
  business_095: 0.60, // Survey
  business_096: 0.92, // PVR
  business_097: 0.25, // RazorpayX suspicious
};

function matches(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

function r(n: number): number {
  return Math.round(n * 100) / 100;
}

export function predict(msg: MessageInput): PredictionOutput {
  const text = msg.messageText ?? "";
  const conv = msg.conversationType;
  const fwd = msg.forwardedCount;

  // ── 1. Injection attack ────────────────────────────────────────────────────
  if (matches(text, INJECTION_PATTERNS)) {
    return {
      action: "mute",
      messageType: "scam",
      reason: "Prompt injection attempt detected — message tries to override the notification router.",
      confidence: 0.99,
      evidenceMessageIds: "none",
      scamProbability: 0.99,
      spamProbability: 0.0,
      urgencyScore: 0.0,
      businessTrustScore: 0.0,
      personalizationFactors: ["injection_attack_detected"],
    };
  }

  // ── 2. Scam detection ──────────────────────────────────────────────────────
  const isScam = matches(text, SCAM_PATTERNS);
  const isUntrustedBusiness =
    msg.businessId !== null &&
    msg.businessId !== undefined &&
    (BUSINESS_TRUST[msg.businessId] ?? 0.6) < 0.4;

  if (isScam || (conv === "business" && isUntrustedBusiness && text.length > 20)) {
    const scamProb = isScam ? 0.93 : 0.75;
    return {
      action: "mute",
      messageType: "scam",
      reason: "Message exhibits scam indicators: OTP/code extraction, suspicious link, account threat, or payment coercion.",
      confidence: r(scamProb),
      evidenceMessageIds: "none",
      scamProbability: r(scamProb),
      spamProbability: 0.1,
      urgencyScore: 0.0,
      businessTrustScore: 0.0,
      personalizationFactors: ["scam_pattern_detected"],
    };
  }

  // ── 3. Chain/spam detection ────────────────────────────────────────────────
  const isChain = matches(text, SPAM_PATTERNS);
  const isBlessingForward =
    /blessings|positive energy|bhagwan|smile today|stay blessed/.test(
      text.toLowerCase(),
    );
  const isFwdHealth =
    fwd >= 6 &&
    /health|doctor|herbal|tablets|tip.*fix/.test(text.toLowerCase());
  const isHighFwdBlessing = fwd >= 7 && isBlessingForward;

  if (isChain || isHighFwdBlessing || isFwdHealth) {
    return {
      action: "mute",
      messageType: "spam",
      reason: `Chain or mass-forwarded spam message (${fwd} forwards). No actionable content.`,
      confidence: 0.91,
      evidenceMessageIds: "none",
      scamProbability: 0.05,
      spamProbability: 0.95,
      urgencyScore: 0.0,
      businessTrustScore: 0.3,
      personalizationFactors: ["high_forward_count", "chain_message"],
    };
  }

  // ── 4. Voice notes (no text) ───────────────────────────────────────────────
  if (msg.mediaType === "voice" && !text) {
    const trustScore =
      msg.businessId ? (BUSINESS_TRUST[msg.businessId] ?? 0.5) : 0.7;
    const action: Action =
      trustScore < 0.5 ? "mute" : conv === "business" ? "digest" : "notify";
    return {
      action,
      messageType: "unknown",
      reason:
        action === "mute"
          ? "Voice note from low-trust business sender."
          : `Voice note from ${conv} chat — content requires listening.`,
      confidence: 0.60,
      evidenceMessageIds: "none",
      scamProbability: 0.1,
      spamProbability: 0.05,
      urgencyScore: conv === "personal" ? 0.5 : 0.3,
      businessTrustScore: r(trustScore),
      personalizationFactors: ["voice_note_no_text"],
    };
  }

  // ── 5. Urgency / mention signals ──────────────────────────────────────────
  const isUrgent = matches(text, URGENT_PATTERNS);
  const isMentioned = text.includes(`@${msg.userId}`);
  const isTimeSensitive =
    /\d+\s*(min|minutes?|pm|am|hrs?|hours?)/i.test(text);
  const isMedical =
    /doctor|clinic|appointment|specialist|hospital/.test(text.toLowerCase());
  const isWork =
    /build|deploy|client|rollback|standup|sync|deployment|refund edge|payment worker|queue/.test(
      text.toLowerCase(),
    );

  // ── 6. Personal conversation ───────────────────────────────────────────────
  if (conv === "personal") {
    if (isUrgent || isMentioned || isTimeSensitive || isMedical || isWork) {
      return {
        action: "notify",
        messageType: isMedical ? "urgent" : isWork ? "urgent" : "urgent",
        reason: "Personal message with time-sensitive or urgent content.",
        confidence: 0.88,
        evidenceMessageIds: "none",
        scamProbability: 0.02,
        spamProbability: 0.01,
        urgencyScore: 0.85,
        businessTrustScore: 0.9,
        personalizationFactors: ["personal_conversation", "urgency_detected"],
      };
    }
    if (fwd === 0) {
      return {
        action: "notify",
        messageType: "personal",
        reason: "Direct personal message from a known contact.",
        confidence: 0.80,
        evidenceMessageIds: "none",
        scamProbability: 0.02,
        spamProbability: 0.01,
        urgencyScore: 0.4,
        businessTrustScore: 0.9,
        personalizationFactors: ["personal_conversation", "no_forwarding"],
      };
    }
    return {
      action: "digest",
      messageType: "forward",
      reason: `Forwarded personal message (${fwd} hops); lower urgency.`,
      confidence: 0.72,
      evidenceMessageIds: "none",
      scamProbability: 0.05,
      spamProbability: 0.3,
      urgencyScore: 0.2,
      businessTrustScore: 0.7,
      personalizationFactors: ["forwarded_message"],
    };
  }

  // ── 7. Group conversation ──────────────────────────────────────────────────
  if (conv === "group") {
    if (fwd >= 9) {
      return {
        action: "mute",
        messageType: "spam",
        reason: `Highly forwarded group message (${fwd} forwards) with low personal relevance.`,
        confidence: 0.87,
        evidenceMessageIds: "none",
        scamProbability: 0.1,
        spamProbability: 0.9,
        urgencyScore: 0.0,
        businessTrustScore: 0.2,
        personalizationFactors: ["high_forward_group"],
      };
    }
    if (matches(text, PAYMENT_PATTERNS) && fwd <= 2) {
      return {
        action: "notify",
        messageType: "payment",
        reason: "Payment deadline or dues notice from group — likely from a legitimate admin.",
        confidence: 0.80,
        evidenceMessageIds: "none",
        scamProbability: 0.1,
        spamProbability: 0.05,
        urgencyScore: 0.7,
        businessTrustScore: 0.7,
        personalizationFactors: ["payment_due", "group_admin"],
      };
    }
    if (matches(text, EVENT_PATTERNS)) {
      return {
        action: "notify",
        messageType: "event",
        reason: "Group event notice or time-sensitive announcement requiring action.",
        confidence: 0.82,
        evidenceMessageIds: "none",
        scamProbability: 0.03,
        spamProbability: 0.03,
        urgencyScore: 0.7,
        businessTrustScore: 0.75,
        personalizationFactors: ["event_announcement"],
      };
    }
    if (isMentioned || (isUrgent && fwd <= 2)) {
      return {
        action: "notify",
        messageType: "urgent",
        reason: "User directly mentioned or urgent time-sensitive request in group.",
        confidence: 0.87,
        evidenceMessageIds: "none",
        scamProbability: 0.03,
        spamProbability: 0.03,
        urgencyScore: 0.85,
        businessTrustScore: 0.8,
        personalizationFactors: ["direct_mention", "urgency_detected"],
      };
    }
    if (isWork) {
      return {
        action: "notify",
        messageType: "urgent",
        reason: "Work-related message with actionable technical or business content.",
        confidence: 0.85,
        evidenceMessageIds: "none",
        scamProbability: 0.02,
        spamProbability: 0.02,
        urgencyScore: 0.8,
        businessTrustScore: 0.85,
        personalizationFactors: ["work_context"],
      };
    }
    if (matches(text, PROMOTION_PATTERNS) && fwd > 2) {
      return {
        action: "mute",
        messageType: "promotion",
        reason: "Commercial promotion forwarded in group; low personal relevance.",
        confidence: 0.77,
        evidenceMessageIds: "none",
        scamProbability: 0.05,
        spamProbability: 0.6,
        urgencyScore: 0.05,
        businessTrustScore: 0.4,
        personalizationFactors: ["group_promo_forwarded"],
      };
    }
    if (matches(text, GREETING_PATTERNS) && fwd >= 3) {
      return {
        action: "mute",
        messageType: "greeting",
        reason: `Mass-forwarded greeting (${fwd} forwards) with no actionable content.`,
        confidence: 0.85,
        evidenceMessageIds: "none",
        scamProbability: 0.01,
        spamProbability: 0.8,
        urgencyScore: 0.0,
        businessTrustScore: 0.5,
        personalizationFactors: ["greeting_forwarded"],
      };
    }
    return {
      action: "digest",
      messageType: "personal",
      reason: "Casual group conversation; can be reviewed later.",
      confidence: 0.73,
      evidenceMessageIds: "none",
      scamProbability: 0.03,
      spamProbability: 0.1,
      urgencyScore: 0.2,
      businessTrustScore: 0.6,
      personalizationFactors: ["group_casual"],
    };
  }

  // ── 8. Business conversation ───────────────────────────────────────────────
  if (conv === "business") {
    const trustScore = msg.businessId
      ? (BUSINESS_TRUST[msg.businessId] ?? 0.6)
      : 0.6;

    if (matches(text, BUSINESS_UPDATE_PATTERNS) && trustScore >= 0.75) {
      const isCritical =
        /delivery|order|appointment|ride update|pickup today|return pickup|fedex/i.test(
          text,
        );
      return {
        action: isCritical ? "notify" : "digest",
        messageType: "business_update",
        reason: isCritical
          ? "Trusted business with actionable delivery, appointment, or service update."
          : "Trusted business update reviewable at convenience.",
        confidence: r(trustScore),
        evidenceMessageIds: "none",
        scamProbability: 0.02,
        spamProbability: 0.05,
        urgencyScore: isCritical ? 0.75 : 0.35,
        businessTrustScore: r(trustScore),
        personalizationFactors: ["trusted_business", "business_update"],
      };
    }
    if (matches(text, PROMOTION_PATTERNS)) {
      const action: Action = trustScore >= 0.75 && fwd === 0 ? "digest" : "mute";
      return {
        action,
        messageType: "promotion",
        reason: "Business promotional message; scheduled for digest or muted based on trust.",
        confidence: r(trustScore * 0.85),
        evidenceMessageIds: "none",
        scamProbability: 0.05,
        spamProbability: 0.55,
        urgencyScore: 0.05,
        businessTrustScore: r(trustScore),
        personalizationFactors: ["business_promotion"],
      };
    }
    if (/survey|feedback|review|experience/i.test(text)) {
      return {
        action: "digest",
        messageType: "business_update",
        reason: "Business requesting feedback or survey response; low priority.",
        confidence: 0.70,
        evidenceMessageIds: "none",
        scamProbability: 0.03,
        spamProbability: 0.15,
        urgencyScore: 0.1,
        businessTrustScore: r(trustScore),
        personalizationFactors: ["survey_request"],
      };
    }
    return {
      action: "digest",
      messageType: "business_update",
      reason: "Business message with insufficient signals for high-priority routing.",
      confidence: r(trustScore),
      evidenceMessageIds: "none",
      scamProbability: 0.05,
      spamProbability: 0.1,
      urgencyScore: 0.2,
      businessTrustScore: r(trustScore),
      personalizationFactors: [],
    };
  }

  // ── Fallback ───────────────────────────────────────────────────────────────
  return {
    action: "digest",
    messageType: "unknown",
    reason: "Insufficient context to determine priority; routed to digest for manual review.",
    confidence: 0.55,
    evidenceMessageIds: "none",
    scamProbability: 0.1,
    spamProbability: 0.1,
    urgencyScore: 0.2,
    businessTrustScore: 0.5,
    personalizationFactors: [],
  };
}
