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
  unique,
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
  passwordHash: varchar("password_hash"), // For email/password authentication
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["admin", "assessor", "client"] }).notNull().default("client"),
  status: varchar("status", { enum: ["active", "suspended", "pending"] }).notNull().default("pending"),
  subscriptionTier: varchar("subscription_tier", { enum: ["free", "basic", "premium", "enterprise"] }).notNull().default("free"),
  subscriptionStatus: varchar("subscription_status", { enum: ["active", "inactive", "trial", "cancelled"] }).notNull().default("inactive"),
  billingEmail: varchar("billing_email"),
  organizationName: varchar("organization_name"),
  buildingName: varchar("building_name"),
  phoneNumber: varchar("phone_number"),
  invitedBy: varchar("invited_by").references(() => users.id),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Building assessments
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  publicId: varchar("public_id").$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id").notNull().references(() => users.id), // assessor who created it
  clientId: varchar("client_id").notNull().references(() => users.id), // client who owns the assessment
  status: varchar("status").notNull().default("draft"), // draft, completed, submitted
  isLocked: boolean("is_locked").default(false), // locked assessments cannot be edited
  lockedBy: varchar("locked_by").references(() => users.id), // admin who locked the assessment
  lockedAt: timestamp("locked_at"), // when the assessment was locked
  buildingName: text("building_name"),
  clientName: text("client_name"),
  buildingLocation: text("building_location"),
  digitalAddress: text("digital_address"),
  detailedAddress: text("detailed_address"), // Keep for backward compatibility
  phoneNumber: varchar("phone_number"),
  additionalNotes: text("additional_notes"),
  // Building specifications
  buildingFootprint: real("building_footprint"), // in m²
  roomHeight: real("room_height"), // in m
  numberOfBedrooms: integer("number_of_bedrooms"),
  siteArea: real("site_area"), // in m²
  numberOfWindows: integer("number_of_windows"),
  numberOfDoors: integer("number_of_doors"),
  averageWindowSize: real("average_window_size"), // in m²
  numberOfFloors: integer("number_of_floors"),
  totalGreenArea: real("total_green_area"), // in m²
  overallScore: real("overall_score").default(0),
  maxPossibleScore: real("max_possible_score").default(0),
  completedSections: integer("completed_sections").default(0),
  totalSections: integer("total_sections").default(8),
  assessorName: text("assessor_name"), // name of the person who conducted the assessment
  assessorRole: varchar("assessor_role"), // role of the assessor (admin/assessor)
  conductedAt: timestamp("conducted_at"), // when the assessment was actually conducted
  // Edit tracking
  lastEditedBy: varchar("last_edited_by").references(() => users.id), // user ID who last edited
  lastEditedByName: text("last_edited_by_name"), // name of the person who last edited
  lastEditedAt: timestamp("last_edited_at"), // when the assessment was last edited by someone other than conductor
  // Archive status
  isArchived: boolean("is_archived").default(false),
  archivedBy: varchar("archived_by").references(() => users.id),
  archivedAt: timestamp("archived_at"),
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
  locationData: jsonb("location_data"), // Store location data for variables that require it
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  assessmentSectionUnique: unique("assessment_section_unique").on(table.assessmentId, table.sectionType),
}));

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

// Activity logs for comprehensive user activity tracking
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  activityType: varchar("activity_type").notNull(), // edit_request_created, edit_request_approved, edit_request_denied, user_created, assessment_completed, etc.
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  targetUserId: varchar("target_user_id").references(() => users.id), // User who was affected by the activity
  assessmentId: integer("assessment_id").references(() => assessments.id),
  assessmentPublicId: varchar("assessment_public_id"),
  buildingName: varchar("building_name"),
  metadata: jsonb("metadata"), // Additional activity details
  priority: varchar("priority", { enum: ["low", "medium", "high"] }).default("medium"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications for assessment-related events
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type", { 
    enum: [
      "assessment_completed", 
      "assessment_submitted",
      "assessment_started",
      "edit_request_created", 
      "edit_request_approved", 
      "edit_request_denied",
      "report_ready",
      "assessment_locked",
      "assessment_unlocked",
      "assessment_editing_completed",
      "admin_note_created",
      "test_notification"
    ] 
  }).notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  assessmentId: integer("assessment_id").references(() => assessments.id),
  assessmentPublicId: varchar("assessment_public_id"),
  buildingName: varchar("building_name"),
  clientName: varchar("client_name"),
  isRead: boolean("is_read").notNull().default(false),
  priority: varchar("priority", { enum: ["low", "medium", "high"] }).notNull().default("medium"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
});

// Admin notes on assessments that can only be seen by assigned users
export const assessmentNotes = pgTable("assessment_notes", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().references(() => assessments.id, { onDelete: "cascade" }),
  adminId: varchar("admin_id").notNull().references(() => users.id), // admin who created the note
  assignedUserId: varchar("assigned_user_id").notNull().references(() => users.id), // user who can see the note
  noteContent: text("note_content").notNull(),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  assessments: many(assessments),
  sentInvitations: many(userInvitations, { relationName: "inviter" }),
  auditLogs: many(auditLogs),
  notifications: many(notifications),
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

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
  targetUser: one(users, {
    fields: [activityLogs.targetUserId],
    references: [users.id],
  }),
  assessment: one(assessments, {
    fields: [activityLogs.assessmentId],
    references: [assessments.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  assessment: one(assessments, {
    fields: [notifications.assessmentId],
    references: [assessments.id],
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
  notes: many(assessmentNotes),
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

export const assessmentNotesRelations = relations(assessmentNotes, ({ one }) => ({
  assessment: one(assessments, {
    fields: [assessmentNotes.assessmentId],
    references: [assessments.id],
  }),
  admin: one(users, {
    fields: [assessmentNotes.adminId],
    references: [users.id],
  }),
  assignedUser: one(users, {
    fields: [assessmentNotes.assignedUserId],
    references: [users.id],
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

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

export const insertAssessmentNoteSchema = createInsertSchema(assessmentNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isRead: true,
  readAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
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
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type AssessmentNote = typeof assessmentNotes.$inferSelect;
export type InsertAssessmentNote = z.infer<typeof insertAssessmentNoteSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
