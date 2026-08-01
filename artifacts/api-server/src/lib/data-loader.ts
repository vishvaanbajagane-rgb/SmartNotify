/**
 * Loads messages.csv at startup, runs AI predictions, and provides an in-memory store.
 */
import fs from "fs";
import path from "path";
import { predict, type MessageInput, type PredictionOutput } from "./ai-engine.js";
import { logger } from "./logger.js";

export interface MessageRecord {
  message: MessageInput;
  prediction: PredictionOutput;
}

let store: MessageRecord[] = [];

function parseCSV(raw: string): MessageInput[] {
  const lines: string[] = [];
  let current = "";
  let inQuote = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '"') {
      inQuote = !inQuote;
      current += ch;
    } else if (ch === "\n" && !inQuote) {
      lines.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(current);

  if (lines.length < 2) return [];

  const header = lines[0].split(",").map((h) => h.trim());

  const records: MessageInput[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV row handling quoted fields
    const fields: string[] = [];
    let field = "";
    let inQ = false;
    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      if (c === '"') {
        inQ = !inQ;
      } else if (c === "," && !inQ) {
        fields.push(field.replace(/^"|"$/g, "").replace(/""/g, '"'));
        field = "";
      } else {
        field += c;
      }
    }
    fields.push(field.replace(/^"|"$/g, "").replace(/""/g, '"'));

    const obj: Record<string, string> = {};
    header.forEach((h, idx) => {
      obj[h] = (fields[idx] ?? "").trim();
    });

    records.push({
      messageId: obj["message_id"] ?? `msg_${i}`,
      userId: obj["user_id"] ?? "",
      conversationType: (obj["conversation_type"] as MessageInput["conversationType"]) ?? "personal",
      groupId: obj["group_id"] || null,
      businessId: obj["business_id"] || null,
      senderUserId: obj["sender_user_id"] || null,
      createdAt: obj["created_at"] ?? "",
      messageText: obj["message_text"] || null,
      mediaType: obj["media_type"] || null,
      mediaId: obj["media_id"] || null,
      forwardedCount: parseInt(obj["forwarded_count"] ?? "0", 10) || 0,
    });
  }
  return records;
}

export function loadMessages(csvContent: string): number {
  const messages = parseCSV(csvContent);
  store = messages.map((msg) => ({
    message: msg,
    prediction: predict(msg),
  }));
  logger.info({ count: store.length }, "Messages loaded and predicted");
  return store.length;
}

export function getStore(): MessageRecord[] {
  return store;
}

export function getById(messageId: string): MessageRecord | undefined {
  return store.find((r) => r.message.messageId === messageId);
}

export function initDefaultDataset(): void {
  const candidates = [
    // Running from workspace root
    path.resolve(process.cwd(), "attached_assets", "messages_1785592641857.csv"),
    // Running from artifacts/api-server (dev)
    path.resolve(process.cwd(), "..", "..", "attached_assets", "messages_1785592641857.csv"),
    // dataset directory
    path.resolve(process.cwd(), "..", "..", "dataset", "messages.csv"),
    path.resolve(process.cwd(), "dataset", "messages.csv"),
    path.resolve(process.cwd(), "messages.csv"),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, "utf-8");
      const count = loadMessages(content);
      logger.info({ path: p, count }, "Default dataset loaded");
      return;
    }
  }

  logger.warn("No default dataset found — store is empty");
}
