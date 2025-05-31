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
  role: varchar("role", { enum: ["admin", "assessor", "client"] }).notNull().default("client"),
  status: varchar("status", { enum: ["active", "suspended", "pending"] }).notNull().default("pending"),
  subscriptionTier: varchar("subscription_tier", { enum: ["free", "basic", "premium", "enterprise"] }).notNull().default("free"),
  subscriptionStatus: varchar("subscription_status", { enum: ["active", "inactive", "trial", "cancelled"] }).notNull().default("inactive"),
  billingEmail: varchar("billing_email"),
  organizationName: varchar("organization_name"),
  phoneNumber: varchar("phone_number"),
  invitedBy: varchar("invited_by").references(() => users.id),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Building assessments
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id), // assessor who created it
  clientId: varchar("client_id").notNull().references(() => users.id), // client who owns the assessment
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
  assessorName: text("assessor_name"), // name of the person who conducted the assessment
  assessorRole: varchar("assessor_role"), // role of the assessor (admin/assessor)
  conductedAt: timestamp("conducted_at"), // when the assessment was actually conducted
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

// User invitations for admin-controlled user registration
export const userInvitations = pgTable("user_invitations", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull(),
  role: varchar("role", { enum: ["admin", "assessor", "client"] }).notNull().default("client"),
  subscriptionTier: varchar("subscription_tier", { enum: ["free", "basic", "premium", "enterprise"] }).notNull().default("free"),
  organizationName: varchar("organization_name"),
  invitedBy: varchar("invited_by").notNull().references(() => users.id),
  status: varchar("status", { enum: ["pending", "accepted", "expired"] }).notNull().default("pending"),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit log for admin actions
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  action: varchar("action").notNull(), // user_invited, user_suspended, subscription_changed, etc.
  targetUserId: varchar("target_user_id").references(() => users.id),
  details: jsonb("details"), // Additional action details
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  assessments: many(assessments),
  sentInvitations: many(userInvitations, { relationName: "inviter" }),
  auditLogs: many(auditLogs),
}));

export const userInvitationsRelations = relations(userInvitations, ({ one }) => ({
  inviter: one(users, {
    fields: [userInvitations.invitedBy],
    references: [users.id],
    relationName: "inviter",
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  targetUser: one(users, {
    fields: [auditLogs.targetUserId],
    references: [users.id],
  }),
}));

export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
  user: one(users, {
    fields: [assessments.userId],
    references: [users.id],
  }),
  client: one(users, {
    fields: [assessments.clientId],
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

export const insertUserInvitationSchema = createInsertSchema(userInvitations).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const updateUserSchema = createInsertSchema(users).partial().omit({
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
export type UserInvitation = typeof userInvitations.$inferSelect;
export type InsertUserInvitation = z.infer<typeof insertUserInvitationSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
