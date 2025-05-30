import {
  users,
  assessments,
  assessmentSections,
  assessmentMedia,
  type User,
  type UpsertUser,
  type Assessment,
  type InsertAssessment,
  type AssessmentSection,
  type InsertAssessmentSection,
  type AssessmentMedia,
  type InsertAssessmentMedia,
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Assessment operations
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  getAssessment(id: number): Promise<Assessment | undefined>;
  getAssessmentWithSections(id: number): Promise<(Assessment & { sections: AssessmentSection[]; media: AssessmentMedia[] }) | undefined>;
  getUserAssessments(userId: string): Promise<Assessment[]>;
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

  async upsertUser(userData: UpsertUser): Promise<User> {
    const { db } = await import("./db");
    const { users } = await import("@shared/schema");
    
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
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

  async updateAssessment(id: number, data: Partial<Assessment>): Promise<Assessment> {
    const { db } = await import("./db");
    const { eq } = await import("drizzle-orm");
    const { assessments } = await import("@shared/schema");
    
    const [updated] = await db
      .update(assessments)
      .set({ ...data, updatedAt: new Date() })
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
}

export const storage = new MemoryStorage();
