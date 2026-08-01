import { Router, type IRouter } from "express";
import { predict } from "../lib/ai-engine.js";
import { getStore, getById } from "../lib/data-loader.js";
import {
  ListMessagesQueryParams,
  GetMessageParams,
  PredictMessageBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/messages", async (req, res): Promise<void> => {
  const qp = ListMessagesQueryParams.safeParse(req.query);
  let records = getStore();

  if (qp.success) {
    const { action, messageType, conversationType, search } = qp.data;
    if (action) records = records.filter((r) => r.prediction.action === action);
    if (messageType)
      records = records.filter(
        (r) => r.prediction.messageType === messageType,
      );
    if (conversationType)
      records = records.filter(
        (r) => r.message.conversationType === conversationType,
      );
    if (search) {
      const q = search.toLowerCase();
      records = records.filter((r) =>
        r.message.messageText?.toLowerCase().includes(q),
      );
    }
  }

  res.json(records);
});

router.get("/messages/predict", async (req, res): Promise<void> => {
  // Prevent conflict with /messages/:messageId by placing predict routes first
  res.status(405).json({ error: "Use POST /messages/predict" });
});

router.post("/messages/predict", async (req, res): Promise<void> => {
  const parsed = PredictMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const d = parsed.data;
  const prediction = predict({
    messageId: `live_${Date.now()}`,
    userId: "live_user",
    conversationType: d.conversationType,
    groupId: d.groupId ?? null,
    businessId: d.businessId ?? null,
    senderUserId: d.senderUserId ?? null,
    createdAt: new Date().toISOString(),
    messageText: d.messageText,
    mediaType: d.mediaType ?? null,
    mediaId: null,
    forwardedCount: d.forwardedCount,
  });
  res.json(prediction);
});

router.post("/messages/predict-all", async (_req, res): Promise<void> => {
  const records = getStore();
  const counts = { notify: 0, digest: 0, mute: 0 };
  for (const r of records) {
    counts[r.prediction.action]++;
  }
  res.json({
    processed: records.length,
    notifyCount: counts.notify,
    digestCount: counts.digest,
    muteCount: counts.mute,
  });
});

router.get("/messages/:messageId", async (req, res): Promise<void> => {
  const params = GetMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const record = getById(params.data.messageId);
  if (!record) {
    res.status(404).json({ error: "Message not found" });
    return;
  }
  res.json(record);
});

export default router;
