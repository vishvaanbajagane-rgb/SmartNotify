import { Router, type IRouter } from "express";
import { getStore } from "../lib/data-loader.js";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const records = getStore();
  let notifyCount = 0,
    digestCount = 0,
    muteCount = 0,
    scamCount = 0,
    spamCount = 0,
    urgentCount = 0,
    totalConf = 0;

  const typeCounts: Record<string, number> = {};

  for (const r of records) {
    const p = r.prediction;
    if (p.action === "notify") notifyCount++;
    else if (p.action === "digest") digestCount++;
    else muteCount++;
    if (p.messageType === "scam") scamCount++;
    if (p.messageType === "spam") spamCount++;
    if (p.messageType === "urgent") urgentCount++;
    totalConf += p.confidence;
    typeCounts[p.messageType] = (typeCounts[p.messageType] ?? 0) + 1;
  }

  const messagesByType = Object.entries(typeCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  const recentMessages = [...records]
    .sort(
      (a, b) =>
        new Date(b.message.createdAt).getTime() -
        new Date(a.message.createdAt).getTime(),
    )
    .slice(0, 10);

  res.json({
    totalMessages: records.length,
    notifyCount,
    digestCount,
    muteCount,
    scamCount,
    spamCount,
    urgentCount,
    averageConfidence:
      records.length > 0
        ? Math.round((totalConf / records.length) * 100) / 100
        : 0,
    messagesByType,
    recentMessages,
  });
});

router.get("/analytics", async (_req, res): Promise<void> => {
  const records = getStore();

  // Action distribution
  const actionCounts: Record<string, number> = {
    notify: 0,
    digest: 0,
    mute: 0,
  };
  const typeCounts: Record<string, number> = {};
  const convCounts: Record<string, number> = {};
  const confidenceBuckets: Record<string, number> = {
    "0.0–0.5": 0,
    "0.5–0.6": 0,
    "0.6–0.7": 0,
    "0.7–0.8": 0,
    "0.8–0.9": 0,
    "0.9–1.0": 0,
  };
  const dailyMap: Record<
    string,
    { notify: number; digest: number; mute: number }
  > = {};
  const senderCounts: Record<string, number> = {};

  for (const r of records) {
    const p = r.prediction;
    const m = r.message;

    actionCounts[p.action]++;
    typeCounts[p.messageType] = (typeCounts[p.messageType] ?? 0) + 1;
    convCounts[m.conversationType] =
      (convCounts[m.conversationType] ?? 0) + 1;

    // Confidence bucket
    const c = p.confidence;
    if (c < 0.5) confidenceBuckets["0.0–0.5"]++;
    else if (c < 0.6) confidenceBuckets["0.5–0.6"]++;
    else if (c < 0.7) confidenceBuckets["0.6–0.7"]++;
    else if (c < 0.8) confidenceBuckets["0.7–0.8"]++;
    else if (c < 0.9) confidenceBuckets["0.8–0.9"]++;
    else confidenceBuckets["0.9–1.0"]++;

    // Daily trend
    const day = m.createdAt.split(" ")[0] ?? m.createdAt.slice(0, 10);
    if (!dailyMap[day]) dailyMap[day] = { notify: 0, digest: 0, mute: 0 };
    dailyMap[day][p.action]++;

    // Sender counts
    const sender =
      m.businessId ??
      m.senderUserId ??
      m.groupId ??
      "unknown";
    senderCounts[sender] = (senderCounts[sender] ?? 0) + 1;
  }

  const ACTION_COLORS: Record<string, string> = {
    notify: "#22c55e",
    digest: "#3b82f6",
    mute: "#6b7280",
  };

  res.json({
    actionDistribution: Object.entries(actionCounts).map(([name, value]) => ({
      name,
      value,
      color: ACTION_COLORS[name] ?? null,
    })),
    messageTypeDistribution: Object.entries(typeCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value, color: null })),
    conversationTypeBreakdown: Object.entries(convCounts).map(
      ([name, value]) => ({ name, value, color: null }),
    ),
    confidenceDistribution: Object.entries(confidenceBuckets).map(
      ([name, value]) => ({ name, value, color: null }),
    ),
    dailyTrend: Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts })),
    topSenders: Object.entries(senderCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, value]) => ({ name, value, color: null })),
  });
});

export default router;
