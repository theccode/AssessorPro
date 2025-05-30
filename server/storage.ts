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
import { db } from "./db";
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

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const now = Date.now();
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: now,
        },
      })
      .returning();
    return user;
  }

  // Assessment operations
  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const now = Date.now();
    const [created] = await db
      .insert(assessments)
      .values({
        ...assessment,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return created;
  }

  async getAssessment(id: number): Promise<Assessment | undefined> {
    const [assessment] = await db
      .select()
      .from(assessments)
      .where(eq(assessments.id, id));
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
    return await db
      .select()
      .from(assessments)
      .where(eq(assessments.userId, userId))
      .orderBy(desc(assessments.updatedAt));
  }

  async updateAssessment(id: number, data: Partial<Assessment>): Promise<Assessment> {
    const [updated] = await db
      .update(assessments)
      .set({ ...data, updatedAt: Date.now() })
      .where(eq(assessments.id, id))
      .returning();
    return updated;
  }

  async deleteAssessment(id: number): Promise<void> {
    await db.delete(assessments).where(eq(assessments.id, id));
  }

  // Assessment section operations
  async upsertAssessmentSection(section: InsertAssessmentSection): Promise<AssessmentSection> {
    const existing = await this.getAssessmentSection(section.assessmentId, section.sectionType);
    
    if (existing) {
      const [updated] = await db
        .update(assessmentSections)
        .set({ ...section, updatedAt: Date.now() })
        .where(and(
          eq(assessmentSections.assessmentId, section.assessmentId),
          eq(assessmentSections.sectionType, section.sectionType)
        ))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(assessmentSections)
        .values({
          ...section,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
        .returning();
      return created;
    }
  }

  async getAssessmentSections(assessmentId: number): Promise<AssessmentSection[]> {
    return await db
      .select()
      .from(assessmentSections)
      .where(eq(assessmentSections.assessmentId, assessmentId));
  }

  async getAssessmentSection(assessmentId: number, sectionType: string): Promise<AssessmentSection | undefined> {
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
    const [created] = await db
      .insert(assessmentMedia)
      .values({
        ...media,
        createdAt: Date.now(),
      })
      .returning();
    return created;
  }

  async getAssessmentMedia(assessmentId: number, sectionType?: string): Promise<AssessmentMedia[]> {
    if (sectionType) {
      return await db
        .select()
        .from(assessmentMedia)
        .where(and(
          eq(assessmentMedia.assessmentId, assessmentId),
          eq(assessmentMedia.sectionType, sectionType)
        ));
    }

    return await db
      .select()
      .from(assessmentMedia)
      .where(eq(assessmentMedia.assessmentId, assessmentId));
  }

  async deleteAssessmentMedia(id: number): Promise<void> {
    await db.delete(assessmentMedia).where(eq(assessmentMedia.id, id));
  }
}

export const storage = new DatabaseStorage();
