import { Router, type IRouter } from "express";
import { getStore } from "../lib/data-loader.js";

const router: IRouter = Router();

router.get("/export", async (_req, res): Promise<void> => {
  const records = getStore();

  // Build CSV content
  const header =
    "message_id,action,message_type,reason,confidence,evidence_message_ids";
  const rows = records.map((r) => {
    const p = r.prediction;
    const reason = `"${p.reason.replace(/"/g, '""')}"`;
    return `${r.message.messageId},${p.action},${p.messageType},${reason},${p.confidence},${p.evidenceMessageIds}`;
  });

  const csvContent = [header, ...rows].join("\n");

  res.json({
    downloadUrl: "/api/export/download",
    totalRows: records.length,
    csvContent,
  });
});

// Raw CSV download endpoint
router.get("/export/download", async (_req, res): Promise<void> => {
  const records = getStore();

  const header =
    "message_id,action,message_type,reason,confidence,evidence_message_ids";
  const rows = records.map((r) => {
    const p = r.prediction;
    const reason = `"${p.reason.replace(/"/g, '""')}"`;
    return `${r.message.messageId},${p.action},${p.messageType},${reason},${p.confidence},${p.evidenceMessageIds}`;
  });

  const csvContent = [header, ...rows].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="output.csv"',
  );
  res.send(csvContent);
});

export default router;
