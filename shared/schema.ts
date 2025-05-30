import {
  sqliteTable,
  text,
  integer,
  real,
  index,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(),
    expire: integer("expire").notNull(),
  },
  (table) => ({
    expireIdx: index("IDX_session_expire").on(table.expire),
  }),
);

// User storage table (mandatory for Replit Auth)
export const users = sqliteTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  role: text("role").notNull().default("client"), // admin, assessor, client
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

// Building assessments
export const assessments = sqliteTable("assessments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("draft"), // draft, completed, submitted
  buildingName: text("building_name"),
  publisherName: text("publisher_name"),
  buildingLocation: text("building_location"),
  detailedAddress: text("detailed_address"),
  phoneNumber: text("phone_number"),
  additionalNotes: text("additional_notes"),
  overallScore: real("overall_score").default(0),
  maxPossibleScore: real("max_possible_score").default(0),
  completedSections: integer("completed_sections").default(0),
  totalSections: integer("total_sections").default(8),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

// Assessment sections with scores
export const assessmentSections = sqliteTable("assessment_sections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  assessmentId: integer("assessment_id").notNull().references(() => assessments.id),
  sectionType: text("section_type").notNull(), // site-transport, water-efficiency, etc.
  sectionName: text("section_name").notNull(),
  score: real("score").default(0),
  maxScore: real("max_score").default(0),
  isCompleted: integer("is_completed", { mode: 'boolean' }).default(false),
  variables: text("variables"), // Store all variable scores as JSON string
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

// Media files associated with assessment fields
export const assessmentMedia = sqliteTable("assessment_media", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  assessmentId: integer("assessment_id").notNull().references(() => assessments.id),
  sectionType: text("section_type").notNull(),
  fieldName: text("field_name").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // image, video, audio, document
  fileSize: integer("file_size"),
  filePath: text("file_path").notNull(),
  mimeType: text("mime_type"),
  createdAt: integer("created_at"),
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
