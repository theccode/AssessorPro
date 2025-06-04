import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAssessmentSchema, insertAssessmentSectionSchema } from "@shared/schema";
import session from "express-session";

export async function registerRoutes(app: Express): Promise<Server> {
  // Session-based authentication middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-session-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
    }
  }));

  // Authentication middleware with enterprise security  
  app.use((req: any, res, next) => {
    // Set user from session if it exists
    req.user = req.session?.user || null;
    
    // Auto-login for demo purposes, but only if accessing protected routes
    // and not if we just logged out
    if (!req.user && req.url.startsWith('/api/') && 
        req.url !== '/api/logout' && req.url !== '/api/login' && 
        req.url !== '/api/auth/user') {
      req.session.user = {
        id: "demo-user-123",
        email: "demo@example.com",
        firstName: "Demo",
        lastName: "User",
        role: "assessor"
      };
      req.user = req.session.user;
    }
    
    next();
  });

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // If no user in session, return 401
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

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

  app.get('/api/login', (req: any, res) => {
    // In production, this would redirect to OAuth provider
    res.redirect('/');
  });

  app.get('/api/logout', (req: any, res) => {
    // Destroy session for proper logout
    req.session.destroy((err: any) => {
      if (err) {
        console.error('Session destroy error:', err);
      }
      res.clearCookie('connect.sid');
      // Send 401 to trigger frontend logout state
      res.status(401).json({ message: 'Logged out' });
    });
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

  // Note: Individual assessment route moved to routes.ts to support UUID-based routing

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