import { Router, type IRouter } from "express";
import { loadMessages } from "../lib/data-loader.js";
import { UploadDatasetBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/upload", async (req, res): Promise<void> => {
  const parsed = UploadDatasetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { csvContent } = parsed.data;
  if (!csvContent) {
    res.status(400).json({ error: "csvContent is required" });
    return;
  }

  try {
    const count = loadMessages(csvContent);
    res.json({
      success: true,
      message: `Successfully loaded and predicted ${count} messages.`,
      messagesLoaded: count,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to parse CSV" });
  }
});

export default router;
