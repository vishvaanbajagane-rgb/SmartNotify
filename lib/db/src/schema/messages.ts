import { pgTable, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const messagesTable = pgTable("messages", {
  messageId: text("message_id").primaryKey(),
  userId: text("user_id").notNull(),
  conversationType: text("conversation_type").notNull(),
  groupId: text("group_id"),
  businessId: text("business_id"),
  senderUserId: text("sender_user_id"),
  createdAt: text("created_at").notNull(),
  messageText: text("message_text"),
  mediaType: text("media_type"),
  mediaId: text("media_id"),
  forwardedCount: integer("forwarded_count").notNull().default(0),
});

export const predictionsTable = pgTable("predictions", {
  messageId: text("message_id").primaryKey(),
  action: text("action").notNull(),
  messageType: text("message_type").notNull(),
  reason: text("reason").notNull(),
  confidence: real("confidence").notNull(),
  evidenceMessageIds: text("evidence_message_ids").notNull().default("none"),
  scamProbability: real("scam_probability").notNull().default(0),
  spamProbability: real("spam_probability").notNull().default(0),
  urgencyScore: real("urgency_score").notNull().default(0),
  businessTrustScore: real("business_trust_score").notNull().default(0.5),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messagesTable);
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messagesTable.$inferSelect;

export const insertPredictionSchema = createInsertSchema(predictionsTable).omit({ createdAt: true });
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type Prediction = typeof predictionsTable.$inferSelect;
