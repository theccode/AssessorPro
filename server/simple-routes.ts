import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAssessmentSchema, insertAssessmentSectionSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Simple demo user middleware
  app.use((req: any, res, next) => {
    req.user = {
      id: "demo-user-123",
      email: "demo@example.com",
      firstName: "Demo",
      lastName: "User",
      role: "assessor"
    };
    next();
  });

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      let user = await storage.getUser(req.user.id);
      if (!user) {
        user = await storage.upsertUser(req.user);
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get('/api/login', (req, res) => {
    // In a real app, this would redirect to authentication provider
    res.redirect('/');
  });

  app.get('/api/logout', (req: any, res) => {
    // Clear the session and redirect
    req.user = null;
    res.redirect('/');
  });

  // Assessment routes
  app.post('/api/assessments', async (req: any, res) => {
    try {
      const data = { ...req.body, userId: req.user.id };
      const assessment = await storage.createAssessment(data);
      res.json(assessment);
    } catch (error) {
      console.error("Error creating assessment:", error);
      res.status(400).json({ message: "Failed to create assessment" });
    }
  });

  app.get('/api/assessments', async (req: any, res) => {
    try {
      const assessments = await storage.getUserAssessments(req.user.id);
      res.json(assessments);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      res.status(500).json({ message: "Failed to fetch assessments" });
    }
  });

  app.get('/api/assessments/:id', async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const assessment = await storage.getAssessmentWithSections(id);
      
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      res.json(assessment);
    } catch (error) {
      console.error("Error fetching assessment:", error);
      res.status(500).json({ message: "Failed to fetch assessment" });
    }
  });

  app.patch('/api/assessments/:id', async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateAssessment(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating assessment:", error);
      res.status(500).json({ message: "Failed to update assessment" });
    }
  });

  app.delete('/api/assessments/:id', async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAssessment(id);
      res.json({ message: "Assessment deleted" });
    } catch (error) {
      console.error("Error deleting assessment:", error);
      res.status(500).json({ message: "Failed to delete assessment" });
    }
  });

  // Assessment section routes
  app.post('/api/assessments/:id/sections', async (req: any, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const data = { ...req.body, assessmentId };
      const section = await storage.upsertAssessmentSection(data);
      
      // Update assessment completion status
      const sections = await storage.getAssessmentSections(assessmentId);
      const completedCount = sections.filter(s => s.isCompleted).length;
      const totalScore = sections.reduce((sum, s) => sum + (s.score || 0), 0);
      const maxPossible = sections.reduce((sum, s) => sum + (s.maxScore || 0), 0);
      
      await storage.updateAssessment(assessmentId, {
        completedSections: completedCount,
        overallScore: totalScore,
        maxPossibleScore: maxPossible,
      });

      res.json(section);
    } catch (error) {
      console.error("Error saving assessment section:", error);
      res.status(400).json({ message: "Failed to save section" });
    }
  });

  app.get('/api/assessments/:id/sections', async (req: any, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const sections = await storage.getAssessmentSections(assessmentId);
      res.json(sections);
    } catch (error) {
      console.error("Error fetching sections:", error);
      res.status(500).json({ message: "Failed to fetch sections" });
    }
  });

  // Simple media route (just store basic info)
  app.post('/api/assessments/:id/media', async (req: any, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const { sectionType, fieldName, fileName, fileType } = req.body;
      
      const media = await storage.createAssessmentMedia({
        assessmentId,
        sectionType,
        fieldName,
        fileName,
        fileType,
        fileSize: 0,
        filePath: `/uploads/${fileName}`,
        mimeType: null,
      });

      res.json([media]);
    } catch (error) {
      console.error("Error uploading media:", error);
      res.status(500).json({ message: "Failed to upload media" });
    }
  });

  app.get('/api/assessments/:id/media', async (req: any, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const { sectionType } = req.query;
      
      const media = await storage.getAssessmentMedia(assessmentId, sectionType as string);
      res.json(media);
    } catch (error) {
      console.error("Error fetching media:", error);
      res.status(500).json({ message: "Failed to fetch media" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}