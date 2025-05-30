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
        ...section,
        score: section.score || 0,
        maxScore: section.maxScore || 0,
        isCompleted: section.isCompleted || false,
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
      ...media,
      fileSize: media.fileSize || 0,
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

export const storage = new MemoryStorage();
