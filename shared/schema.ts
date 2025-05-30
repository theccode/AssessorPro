import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("client"), // admin, assessor, client
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Building assessments
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: varchar("status").notNull().default("draft"), // draft, completed, submitted
  buildingName: text("building_name"),
  publisherName: text("publisher_name"),
  buildingLocation: text("building_location"),
  detailedAddress: text("detailed_address"),
  phoneNumber: varchar("phone_number"),
  additionalNotes: text("additional_notes"),
  overallScore: real("overall_score").default(0),
  maxPossibleScore: real("max_possible_score").default(0),
  completedSections: integer("completed_sections").default(0),
  totalSections: integer("total_sections").default(8),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Assessment sections with scores
export const assessmentSections = pgTable("assessment_sections", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().references(() => assessments.id, { onDelete: "cascade" }),
  sectionType: varchar("section_type").notNull(), // site-transport, water-efficiency, etc.
  sectionName: varchar("section_name").notNull(),
  score: real("score").default(0),
  maxScore: real("max_score").default(0),
  isCompleted: boolean("is_completed").default(false),
  variables: jsonb("variables"), // Store all variable scores as JSON
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Media files associated with assessment fields
export const assessmentMedia = pgTable("assessment_media", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().references(() => assessments.id, { onDelete: "cascade" }),
  sectionType: varchar("section_type").notNull(),
  fieldName: varchar("field_name").notNull(),
  fileName: text("file_name").notNull(),
  fileType: varchar("file_type").notNull(), // image, video, audio, document
  fileSize: integer("file_size"),
  filePath: text("file_path").notNull(),
  mimeType: varchar("mime_type"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  assessments: many(assessments),
}));

export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
  user: one(users, {
    fields: [assessments.userId],
    references: [users.id],
  }),
  sections: many(assessmentSections),
  media: many(assessmentMedia),
}));

export const assessmentSectionsRelations = relations(assessmentSections, ({ one }) => ({
  assessment: one(assessments, {
    fields: [assessmentSections.assessmentId],
    references: [assessments.id],
  }),
}));

export const assessmentMediaRelations = relations(assessmentMedia, ({ one }) => ({
  assessment: one(assessments, {
    fields: [assessmentMedia.assessmentId],
    references: [assessments.id],
  }),
}));

// Insert schemas
export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAssessmentSectionSchema = createInsertSchema(assessmentSections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAssessmentMediaSchema = createInsertSchema(assessmentMedia).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type AssessmentSection = typeof assessmentSections.$inferSelect;
export type InsertAssessmentSection = z.infer<typeof insertAssessmentSectionSchema>;
export type AssessmentMedia = typeof assessmentMedia.$inferSelect;
export type InsertAssessmentMedia = z.infer<typeof insertAssessmentMediaSchema>;
