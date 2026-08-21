import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const scoutSubmissionsTable = pgTable("leaders_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  fullName: text("full_name").notNull(),
  gender: text("gender").notNull().default("未提供"),
  unit: text("unit").notNull(),
  yearsExp: integer("years_exp").notNull(),
  isSenior: boolean("is_senior").notNull(),
  targetIcCount: integer("target_ic_count").notNull().default(2),
  skills: text("skills").array().notNull(),
  preferredIcEvents: text("preferred_ic_events").array().notNull(),
  helperEvents: text("helper_events").array().notNull(),
  preferredPartners: text("preferred_partners").array().notNull(),
  notes: text("notes").notNull().default(""),
});

export const insertScoutSubmissionSchema = createInsertSchema(scoutSubmissionsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertScoutSubmission = z.infer<typeof insertScoutSubmissionSchema>;
export type ScoutSubmission = typeof scoutSubmissionsTable.$inferSelect;