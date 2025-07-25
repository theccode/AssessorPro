import {
  users,
  assessments,
  assessmentSections,
  assessmentMedia,
  userInvitations,
  auditLogs,
  notifications,
  assessmentNotes,
  activityLogs,
  type User,
  type UpsertUser,
  type Assessment,
  type InsertAssessment,
  type AssessmentSection,
  type InsertAssessmentSection,
  type AssessmentMedia,
  type InsertAssessmentMedia,
  type UserInvitation,
  type InsertUserInvitation,
  type AuditLog,
  type InsertAuditLog,
  type Notification,
  type InsertNotification,
  type AssessmentNote,
  type InsertAssessmentNote,
  type ActivityLog,
  type InsertActivityLog,
  type UpdateUser,
} from "@shared/schema";
import { eq, desc, and, lt } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Enterprise user management
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, data: UpdateUser): Promise<User>;
  updateUserStatus(id: string, status: "active" | "suspended" | "pending"): Promise<User>;
  updateUserSubscription(id: string, tier: string, status: string): Promise<User>;
  getUsersByRole(role: "admin" | "assessor" | "client"): Promise<User[]>;
  
  // User invitation operations
  createInvitation(invitation: InsertUserInvitation): Promise<UserInvitation>;
  getInvitation(token: string): Promise<UserInvitation | undefined>;
  getInvitationById(id: number): Promise<UserInvitation | undefined>;
  getInvitationByEmail(email: string, status?: "pending" | "accepted" | "expired"): Promise<UserInvitation | undefined>;
  getInvitationsByInviter(inviterId: string): Promise<UserInvitation[]>;
  updateInvitationStatus(token: string, status: "accepted" | "expired"): Promise<UserInvitation>;
  deleteInvitation(id: number): Promise<void>;
  cleanupExpiredInvitations(): Promise<void>;
  
  // Audit logging
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(userId?: string, limit?: number): Promise<AuditLog[]>;
  
  // Activity logging
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getUserActivityLogs(userId: string, limit?: number): Promise<ActivityLog[]>;
  getAllActivityLogs(limit?: number): Promise<ActivityLog[]>;
  getActivityLogsByType(activityType: string, limit?: number): Promise<ActivityLog[]>;
  getAdminRelevantActivityLogs(adminUserId: string, relevantTypes: string[], limit?: number): Promise<ActivityLog[]>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string, isRead?: boolean, limit?: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  getNotification(id: number): Promise<Notification | undefined>;
  markNotificationAsRead(id: number, userId: string): Promise<void>;
  markNotificationRead(id: number): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(id: number, userId: string): Promise<void>;
  
  // Feature access control
  hasFeatureAccess(userId: string, feature: string): Promise<boolean>;

  // Assessment operations
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  getAssessment(id: number): Promise<Assessment | undefined>;
  getAllAssessments(): Promise<Assessment[]>;
  getAssessmentByPublicId(publicId: string): Promise<(Assessment & { sections: AssessmentSection[]; media: AssessmentMedia[] }) | undefined>;
  getAssessmentWithSections(id: number): Promise<(Assessment & { sections: AssessmentSection[]; media: AssessmentMedia[] }) | undefined>;
  getUserAssessments(userId: string): Promise<Assessment[]>;
  getClientAssessments(clientId: string): Promise<Assessment[]>;
  updateAssessment(id: number, data: Partial<Assessment>): Promise<Assessment>;
  deleteAssessment(id: number): Promise<void>;

  // Assessment section operations
  upsertAssessmentSection(section: InsertAssessmentSection): Promise<AssessmentSection>;
  getAssessmentSections(assessmentId: number): Promise<AssessmentSection[]>;
  getAssessmentSection(assessmentId: number, sectionType: string): Promise<AssessmentSection | undefined>;

  // Media operations
  createAssessmentMedia(media: InsertAssessmentMedia): Promise<AssessmentMedia>;
  getAssessmentMedia(assessmentId: number, sectionType?: string): Promise<AssessmentMedia[]>;
  deleteAssessmentMedia(id: number): Promise<void>;

  // Assessment notes operations
  createAssessmentNote(note: InsertAssessmentNote): Promise<AssessmentNote>;
  getAssessmentNote(id: number): Promise<AssessmentNote | undefined>;
  getAssessmentNotes(assessmentId: number): Promise<AssessmentNote[]>;
  getAssessmentNotesForUser(assessmentId: number, userId: string): Promise<AssessmentNote[]>;
  markAssessmentNoteAsRead(id: number): Promise<void>;
}

// Temporary in-memory storage for development
class MemoryStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private assessments: Map<number, Assessment> = new Map();
  private sections: Map<string, AssessmentSection> = new Map();
  private media: Map<number, AssessmentMedia> = new Map();
  private nextAssessmentId = 1;
  private nextSectionId = 1;
  private nextMediaId = 1;

  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const user: User = {
      id: userData.id,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      role: userData.role || "client",
      createdAt: this.users.get(userData.id)?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(userData.id, user);
    return user;
  }

  // Assessment operations
  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const id = this.nextAssessmentId++;
    const created: Assessment = {
      id,
      userId: assessment.userId,
      status: assessment.status || "draft",
      buildingName: assessment.buildingName || null,
      publisherName: assessment.publisherName || null,
      buildingLocation: assessment.buildingLocation || null,
      detailedAddress: assessment.detailedAddress || null,
      phoneNumber: assessment.phoneNumber || null,
      additionalNotes: assessment.additionalNotes || null,
      overallScore: assessment.overallScore || 0,
      maxPossibleScore: assessment.maxPossibleScore || 0,
      completedSections: assessment.completedSections || 0,
      totalSections: assessment.totalSections || 8,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.assessments.set(id, created);
    return created;
  }

  async getAssessment(id: number): Promise<Assessment | undefined> {
    return this.assessments.get(id);
  }

  async getAssessmentWithSections(id: number): Promise<(Assessment & { sections: AssessmentSection[]; media: AssessmentMedia[] }) | undefined> {
    const assessment = this.assessments.get(id);
    if (!assessment) return undefined;

    const sections = await this.getAssessmentSections(id);
    const media = await this.getAssessmentMedia(id);

    return { ...assessment, sections, media };
  }

  async getUserAssessments(userId: string): Promise<Assessment[]> {
    return Array.from(this.assessments.values())
      .filter(a => a.userId === userId)
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
  }

  async getClientAssessments(clientId: string): Promise<Assessment[]> {
    return Array.from(this.assessments.values())
      .filter(a => a.clientId === clientId)
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
  }

  async updateAssessment(id: number, data: Partial<Assessment>): Promise<Assessment> {
    const existing = this.assessments.get(id);
    if (!existing) throw new Error('Assessment not found');
    
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.assessments.set(id, updated);
    return updated;
  }

  async deleteAssessment(id: number): Promise<void> {
    this.assessments.delete(id);
    // Delete related sections and media
    Array.from(this.sections.keys())
      .filter(key => key.startsWith(`${id}-`))
      .forEach(key => this.sections.delete(key));
    Array.from(this.media.values())
      .filter(m => m.assessmentId === id)
      .forEach(m => this.media.delete(m.id));
  }

  // Assessment section operations
  async upsertAssessmentSection(section: InsertAssessmentSection): Promise<AssessmentSection> {
    const key = `${section.assessmentId}-${section.sectionType}`;
    const existing = this.sections.get(key);
    
    if (existing) {
      const updated = { ...existing, ...section, updatedAt: new Date() };
      this.sections.set(key, updated);
      return updated;
    } else {
      const created: AssessmentSection = {
        id: this.nextSectionId++,
        assessmentId: section.assessmentId,
        sectionType: section.sectionType,
        sectionName: section.sectionName,
        score: section.score || 0,
        maxScore: section.maxScore || 0,
        isCompleted: section.isCompleted || false,
        variables: section.variables || {},
        locationData: section.locationData || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.sections.set(key, created);
      return created;
    }
  }

  async getAssessmentSections(assessmentId: number): Promise<AssessmentSection[]> {
    return Array.from(this.sections.values())
      .filter(s => s.assessmentId === assessmentId);
  }

  async getAssessmentSection(assessmentId: number, sectionType: string): Promise<AssessmentSection | undefined> {
    const key = `${assessmentId}-${sectionType}`;
    return this.sections.get(key);
  }

  // Media operations
  async createAssessmentMedia(media: InsertAssessmentMedia): Promise<AssessmentMedia> {
    const id = this.nextMediaId++;
    const created: AssessmentMedia = {
      id,
      assessmentId: media.assessmentId,
      sectionType: media.sectionType,
      fieldName: media.fieldName,
      fileName: media.fileName,
      fileType: media.fileType,
      fileSize: media.fileSize || 0,
      filePath: media.filePath,
      mimeType: media.mimeType || null,
      createdAt: new Date(),
    };
    this.media.set(id, created);
    return created;
  }

  async getAssessmentMedia(assessmentId: number, sectionType?: string): Promise<AssessmentMedia[]> {
    return Array.from(this.media.values())
      .filter(m => {
        if (m.assessmentId !== assessmentId) return false;
        if (sectionType && m.sectionType !== sectionType) return false;
        return true;
      });
  }

  async deleteAssessmentMedia(id: number): Promise<void> {
    this.media.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const { db } = await import("./db");
    const { eq } = await import("drizzle-orm");
    const { users } = await import("@shared/schema");
    
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        lastLoginAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Enterprise user management
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, data: UpdateUser): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserStatus(id: string, status: "active" | "suspended" | "pending"): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserSubscription(id: string, tier: string, status: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        subscriptionTier: tier as any,
        subscriptionStatus: status as any,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUsersByRole(role: "admin" | "assessor" | "client"): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  // User invitation operations
  async createInvitation(invitation: InsertUserInvitation): Promise<UserInvitation> {
    const [created] = await db
      .insert(userInvitations)
      .values(invitation)
      .returning();
    return created;
  }

  async getInvitation(token: string): Promise<UserInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(userInvitations)
      .where(eq(userInvitations.token, token));
    return invitation;
  }

  async getInvitationById(id: number): Promise<UserInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(userInvitations)
      .where(eq(userInvitations.id, id));
    return invitation;
  }

  async getInvitationsByInviter(inviterId: string): Promise<UserInvitation[]> {
    return await db
      .select()
      .from(userInvitations)
      .where(eq(userInvitations.invitedBy, inviterId))
      .orderBy(desc(userInvitations.createdAt));
  }

  async updateInvitationStatus(token: string, status: "accepted" | "expired"): Promise<UserInvitation> {
    const [invitation] = await db
      .update(userInvitations)
      .set({ status })
      .where(eq(userInvitations.token, token))
      .returning();
    return invitation;
  }

  async deleteInvitation(id: number): Promise<void> {
    await db
      .delete(userInvitations)
      .where(eq(userInvitations.id, id));
  }

  async getInvitationByEmail(email: string, status: "pending" | "accepted" | "expired" = "pending"): Promise<UserInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(userInvitations)
      .where(and(eq(userInvitations.email, email), eq(userInvitations.status, status)));
    return invitation;
  }

  async cleanupExpiredInvitations(): Promise<void> {
    await db
      .update(userInvitations)
      .set({ status: "expired" })
      .where(and(
        eq(userInvitations.status, "pending"),
        lt(userInvitations.expiresAt, new Date())
      ));
  }

  // Audit logging
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db
      .insert(auditLogs)
      .values(log)
      .returning();
    return created;
  }

  async getAuditLogs(userId?: string, limit: number = 100): Promise<AuditLog[]> {
    let query = db.select().from(auditLogs);
    
    if (userId) {
      query = query.where(eq(auditLogs.userId, userId));
    }
    
    return await query
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  // Activity logging operations
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [created] = await db
      .insert(activityLogs)
      .values(log)
      .returning();
    return created;
  }

  async getUserActivityLogs(userId: string, limit: number = 100): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  async getAllActivityLogs(limit: number = 100): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  async getActivityLogsByType(activityType: string, limit: number = 100): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.activityType, activityType))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  async getAdminRelevantActivityLogs(adminUserId: string, relevantTypes: string[], limit: number = 100): Promise<ActivityLog[]> {
    const { or, inArray } = await import("drizzle-orm");
    
    // Get activities that are either:
    // 1. The admin's own activities 
    // 2. System-wide activities of relevant types that require admin attention
    return await db
      .select()
      .from(activityLogs)
      .where(
        or(
          eq(activityLogs.userId, adminUserId),
          inArray(activityLogs.activityType, relevantTypes)
        )
      )
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return created;
  }

  async getUserNotifications(userId: string, isRead?: boolean, limit: number = 50): Promise<Notification[]> {
    if (isRead !== undefined) {
      return await db
        .select()
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, isRead)))
        .orderBy(desc(notifications.createdAt))
        .limit(limit);
    }
    
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    
    return result.length;
  }

  async markNotificationAsRead(id: number, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ 
        isRead: true, 
        readAt: new Date() 
      })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ 
        isRead: true, 
        readAt: new Date() 
      })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: number, userId: string): Promise<void> {
    await db
      .delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }

  // Feature access control
  async hasFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user || user.status !== "active") {
      return false;
    }

    // Admin has access to everything
    if (user.role === "admin") {
      return true;
    }

    // Assessor has access to data collection and viewing features
    if (user.role === "assessor") {
      const assessorFeatures = [
        "assessment_forms", 
        "data_collection", 
        "results_viewing", 
        "ratings", 
        "analytics", 
        "reports", 
        "certification"
      ];
      return assessorFeatures.includes(feature);
    }

    // Client access is subscription-based
    if (user.role === "client") {
      if (user.subscriptionStatus !== "active") {
        return false;
      }

      const featureAccess: Record<string, string[]> = {
        "ratings": ["basic", "premium", "enterprise"],
        "analytics": ["premium", "enterprise"],
        "reports": ["basic", "premium", "enterprise"],
        "certification": ["premium", "enterprise"],
        "bulk_assessments": ["enterprise"],
        "api_access": ["enterprise"],
        "white_label": ["enterprise"],
        "assessment_viewing": ["basic", "premium", "enterprise"]
      };

      const allowedTiers = featureAccess[feature] || [];
      return allowedTiers.includes(user.subscriptionTier);
    }

    return false;
  }

  // Assessment operations
  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const { db } = await import("./db");
    const { assessments } = await import("@shared/schema");
    
    const [created] = await db
      .insert(assessments)
      .values(assessment)
      .returning();
    return created;
  }

  async getAssessment(id: number): Promise<Assessment | undefined> {
    const { db } = await import("./db");
    const { eq } = await import("drizzle-orm");
    const { assessments } = await import("@shared/schema");
    
    const [assessment] = await db.select().from(assessments).where(eq(assessments.id, id));
    return assessment;
  }

  async getAllAssessments(): Promise<Assessment[]> {
    const { db } = await import("./db");
    const { assessments } = await import("@shared/schema");
    
    return await db.select().from(assessments);
  }

  async getAssessmentByPublicId(publicId: string): Promise<(Assessment & { sections: AssessmentSection[]; media: AssessmentMedia[] }) | undefined> {
    const { db } = await import("./db");
    const { eq } = await import("drizzle-orm");
    const { assessments } = await import("@shared/schema");
    
    const [assessment] = await db.select().from(assessments).where(eq(assessments.publicId, publicId));
    if (!assessment) return undefined;

    const sections = await this.getAssessmentSections(assessment.id);
    const media = await this.getAssessmentMedia(assessment.id);

    return { ...assessment, sections, media };
  }

  async getAssessmentWithSections(id: number): Promise<(Assessment & { sections: AssessmentSection[]; media: AssessmentMedia[] }) | undefined> {
    const assessment = await this.getAssessment(id);
    if (!assessment) return undefined;

    const sections = await this.getAssessmentSections(id);
    const media = await this.getAssessmentMedia(id);

    return { ...assessment, sections, media };
  }

  async getUserAssessments(userId: string): Promise<Assessment[]> {
    const { db } = await import("./db");
    const { eq } = await import("drizzle-orm");
    const { assessments } = await import("@shared/schema");
    
    return await db.select().from(assessments).where(eq(assessments.userId, userId));
  }

  async getClientAssessments(clientId: string): Promise<Assessment[]> {
    const { db } = await import("./db");
    const { eq } = await import("drizzle-orm");
    const { assessments } = await import("@shared/schema");
    
    return await db.select().from(assessments).where(eq(assessments.clientId, clientId));
  }

  async updateAssessment(id: number, data: Partial<Assessment>): Promise<Assessment> {
    const { db } = await import("./db");
    const { eq } = await import("drizzle-orm");
    const { assessments } = await import("@shared/schema");
    
    // If status is being changed to completed, set the conductedAt timestamp
    const updateData = { ...data, updatedAt: new Date() };
    if (data.status === 'completed' && !data.conductedAt) {
      updateData.conductedAt = new Date();
    }
    
    const [updated] = await db
      .update(assessments)
      .set(updateData)
      .where(eq(assessments.id, id))
      .returning();
    return updated;
  }

  async deleteAssessment(id: number): Promise<void> {
    const { db } = await import("./db");
    const { eq } = await import("drizzle-orm");
    const { assessments } = await import("@shared/schema");
    
    await db.delete(assessments).where(eq(assessments.id, id));
  }

  // Assessment section operations
  async upsertAssessmentSection(section: InsertAssessmentSection): Promise<AssessmentSection> {
    const { db } = await import("./db");
    const { assessmentSections } = await import("@shared/schema");
    
    const [upserted] = await db
      .insert(assessmentSections)
      .values(section)
      .onConflictDoUpdate({
        target: [assessmentSections.assessmentId, assessmentSections.sectionType],
        set: {
          ...section,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upserted;
  }

  async getAssessmentSections(assessmentId: number): Promise<AssessmentSection[]> {
    const { db } = await import("./db");
    const { eq } = await import("drizzle-orm");
    const { assessmentSections } = await import("@shared/schema");
    
    return await db.select().from(assessmentSections).where(eq(assessmentSections.assessmentId, assessmentId));
  }

  async getAssessmentSection(assessmentId: number, sectionType: string): Promise<AssessmentSection | undefined> {
    const { db } = await import("./db");
    const { eq, and } = await import("drizzle-orm");
    const { assessmentSections } = await import("@shared/schema");
    
    const [section] = await db
      .select()
      .from(assessmentSections)
      .where(and(
        eq(assessmentSections.assessmentId, assessmentId),
        eq(assessmentSections.sectionType, sectionType)
      ));
    return section;
  }

  // Media operations
  async createAssessmentMedia(media: InsertAssessmentMedia): Promise<AssessmentMedia> {
    const { db } = await import("./db");
    const { assessmentMedia } = await import("@shared/schema");
    
    const [created] = await db
      .insert(assessmentMedia)
      .values(media)
      .returning();
    return created;
  }

  async getAssessmentMedia(assessmentId: number, sectionType?: string): Promise<AssessmentMedia[]> {
    const { db } = await import("./db");
    const { eq, and } = await import("drizzle-orm");
    const { assessmentMedia } = await import("@shared/schema");
    
    if (sectionType) {
      return await db
        .select()
        .from(assessmentMedia)
        .where(and(
          eq(assessmentMedia.assessmentId, assessmentId),
          eq(assessmentMedia.sectionType, sectionType)
        ));
    }
    
    return await db.select().from(assessmentMedia).where(eq(assessmentMedia.assessmentId, assessmentId));
  }

  async deleteAssessmentMedia(id: number): Promise<void> {
    const { db } = await import("./db");
    const { eq } = await import("drizzle-orm");
    const { assessmentMedia } = await import("@shared/schema");
    
    await db.delete(assessmentMedia).where(eq(assessmentMedia.id, id));
  }

  // Assessment lock/unlock operations
  async lockAssessment(publicId: string): Promise<void> {
    const { db } = await import("./db");
    const { eq } = await import("drizzle-orm");
    const { assessments } = await import("@shared/schema");
    
    await db
      .update(assessments)
      .set({
        isLocked: true,
        lockedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(assessments.publicId, publicId));
  }

  async unlockAssessment(publicId: string): Promise<void> {
    const { db } = await import("./db");
    const { eq } = await import("drizzle-orm");
    const { assessments } = await import("@shared/schema");
    
    await db
      .update(assessments)
      .set({
        isLocked: false,
        lockedBy: null,
        lockedAt: null,
        updatedAt: new Date()
      })
      .where(eq(assessments.publicId, publicId));
  }

  // Assessment notes operations
  async createAssessmentNote(note: InsertAssessmentNote): Promise<AssessmentNote> {
    const { db } = await import("./db");
    const { assessmentNotes } = await import("@shared/schema");
    
    const [created] = await db
      .insert(assessmentNotes)
      .values(note)
      .returning();
    return created;
  }

  async getAssessmentNote(id: number): Promise<AssessmentNote | undefined> {
    const { db } = await import("./db");
    const { eq } = await import("drizzle-orm");
    const { assessmentNotes } = await import("@shared/schema");
    
    const [note] = await db.select().from(assessmentNotes).where(eq(assessmentNotes.id, id));
    return note;
  }

  async getAssessmentNotes(assessmentId: number): Promise<AssessmentNote[]> {
    const { db } = await import("./db");
    const { eq, desc } = await import("drizzle-orm");
    const { assessmentNotes } = await import("@shared/schema");
    
    return await db
      .select()
      .from(assessmentNotes)
      .where(eq(assessmentNotes.assessmentId, assessmentId))
      .orderBy(desc(assessmentNotes.createdAt));
  }

  async getAssessmentNotesForUser(assessmentId: number, userId: string): Promise<AssessmentNote[]> {
    const { db } = await import("./db");
    const { eq, and, desc } = await import("drizzle-orm");
    const { assessmentNotes } = await import("@shared/schema");
    
    return await db
      .select()
      .from(assessmentNotes)
      .where(and(
        eq(assessmentNotes.assessmentId, assessmentId),
        eq(assessmentNotes.assignedUserId, userId)
      ))
      .orderBy(desc(assessmentNotes.createdAt));
  }

  async markAssessmentNoteAsRead(id: number): Promise<void> {
    const { db } = await import("./db");
    const { eq } = await import("drizzle-orm");
    const { assessmentNotes } = await import("@shared/schema");
    
    await db
      .update(assessmentNotes)
      .set({
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(assessmentNotes.id, id));
  }

  // Additional notification methods for edit request management
  async getNotification(id: number): Promise<Notification | undefined> {
    const { db } = await import("./db");
    const { eq } = await import("drizzle-orm");
    const { notifications } = await import("@shared/schema");
    
    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));
    return notification;
  }

  async markNotificationRead(id: number): Promise<void> {
    const { db } = await import("./db");
    const { eq } = await import("drizzle-orm");
    const { notifications } = await import("@shared/schema");
    
    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date()
      })
      .where(eq(notifications.id, id));
  }
}

export const storage = new DatabaseStorage();
