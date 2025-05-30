import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertAssessmentSchema, insertAssessmentSectionSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mp3|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Assessment routes
  app.post('/api/assessments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertAssessmentSchema.parse({ ...req.body, userId });
      
      const assessment = await storage.createAssessment(data);
      res.json(assessment);
    } catch (error) {
      console.error("Error creating assessment:", error);
      res.status(400).json({ message: "Failed to create assessment" });
    }
  });

  app.get('/api/assessments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const assessments = await storage.getUserAssessments(userId);
      res.json(assessments);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      res.status(500).json({ message: "Failed to fetch assessments" });
    }
  });

  app.get('/api/assessments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const assessment = await storage.getAssessmentWithSections(id);
      
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      // Check if user has access to this assessment
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (assessment.userId !== userId && user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(assessment);
    } catch (error) {
      console.error("Error fetching assessment:", error);
      res.status(500).json({ message: "Failed to fetch assessment" });
    }
  });

  app.patch('/api/assessments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Verify ownership
      const existing = await storage.getAssessment(id);
      if (!existing || existing.userId !== userId) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      const updated = await storage.updateAssessment(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating assessment:", error);
      res.status(500).json({ message: "Failed to update assessment" });
    }
  });

  app.delete('/api/assessments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Verify ownership
      const existing = await storage.getAssessment(id);
      if (!existing || existing.userId !== userId) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      await storage.deleteAssessment(id);
      res.json({ message: "Assessment deleted" });
    } catch (error) {
      console.error("Error deleting assessment:", error);
      res.status(500).json({ message: "Failed to delete assessment" });
    }
  });

  // Assessment section routes
  app.post('/api/assessments/:id/sections', isAuthenticated, async (req: any, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Verify ownership
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment || assessment.userId !== userId) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      const data = insertAssessmentSectionSchema.parse({ ...req.body, assessmentId });
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

  app.get('/api/assessments/:id/sections', isAuthenticated, async (req: any, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const sections = await storage.getAssessmentSections(assessmentId);
      res.json(sections);
    } catch (error) {
      console.error("Error fetching sections:", error);
      res.status(500).json({ message: "Failed to fetch sections" });
    }
  });

  // Media upload routes
  app.post('/api/assessments/:id/media', isAuthenticated, upload.array('files'), async (req: any, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const { sectionType, fieldName } = req.body;
      
      // Verify ownership
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment || assessment.userId !== userId) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      const files = req.files as Express.Multer.File[];
      const uploadedMedia = [];

      for (const file of files) {
        // Move file to permanent location
        const uploadDir = path.join('uploads', 'assessments', assessmentId.toString(), sectionType);
        await fs.promises.mkdir(uploadDir, { recursive: true });
        
        const fileName = `${Date.now()}-${file.originalname}`;
        const filePath = path.join(uploadDir, fileName);
        
        await fs.promises.rename(file.path, filePath);

        // Determine file type
        let fileType = 'document';
        if (file.mimetype.startsWith('image/')) fileType = 'image';
        else if (file.mimetype.startsWith('video/')) fileType = 'video';
        else if (file.mimetype.startsWith('audio/')) fileType = 'audio';

        const media = await storage.createAssessmentMedia({
          assessmentId,
          sectionType,
          fieldName,
          fileName: file.originalname,
          fileType,
          fileSize: file.size,
          filePath,
          mimeType: file.mimetype,
        });

        uploadedMedia.push(media);
      }

      res.json(uploadedMedia);
    } catch (error) {
      console.error("Error uploading media:", error);
      res.status(500).json({ message: "Failed to upload media" });
    }
  });

  app.get('/api/assessments/:id/media', isAuthenticated, async (req: any, res) => {
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

  // Serve uploaded files
  app.get('/api/media/:id', isAuthenticated, async (req: any, res) => {
    try {
      const mediaId = parseInt(req.params.id);
      const media = await storage.getAssessmentMedia(0); // This would need adjustment
      
      // Find the specific media file and serve it
      // Implementation would depend on your file storage strategy
      res.status(501).json({ message: "File serving not implemented" });
    } catch (error) {
      console.error("Error serving media:", error);
      res.status(500).json({ message: "Failed to serve media" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
