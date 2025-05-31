import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupDemoAuth, isDemoAuthenticated } from "./demo-auth";
import { requireAuth, requireAdminOrAssessor, requireAssessmentAccess, requireFeature } from "./middleware";
import { registerAdminRoutes } from "./admin-routes";
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
  try {
    await setupAuth(app);
    console.log("Authentication setup completed successfully");
  } catch (error) {
    console.error("Authentication setup failed:", error);
    // Continue without auth for now
  }

  // Register admin routes
  registerAdminRoutes(app);

  // Auth routes with enterprise authentication
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const dbUser = await storage.getUser(userId);
      res.json(dbUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Test endpoint to demonstrate role-based access
  app.get('/api/test/auth-demo', async (req, res) => {
    try {
      // Simulate different user types for testing
      const testUsers = [
        { role: 'admin', name: 'Admin User', access: 'Full system access' },
        { role: 'assessor', name: 'Assessor User', access: 'Assessment forms and data collection' },
        { role: 'client', name: 'Client User', access: 'View reports based on subscription' }
      ];
      
      const authStatus = {
        message: 'Enterprise Authentication System Active',
        availableRoles: testUsers,
        protectedEndpoints: [
          'GET /api/admin/users (Admin only)',
          'POST /api/assessments (Admin/Assessor only)', 
          'GET /api/assessments (Subscription-based for clients)'
        ]
      };
      
      res.json(authStatus);
    } catch (error) {
      res.status(500).json({ message: "Test endpoint error" });
    }
  });

  // Get available clients for assessment creation (Admin/Assessor only)
  app.get('/api/clients', isAuthenticated, requireAuth, requireAdminOrAssessor, async (req: any, res) => {
    try {
      const clients = await storage.getUsersByRole("client");
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  // Assessment routes
  app.post('/api/assessments', isAuthenticated, requireAuth, requireAdminOrAssessor, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const assessorName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
      const assessorRole = user.role;
      const conductedAt = new Date();

      const data = insertAssessmentSchema.parse({ 
        ...req.body, 
        userId,
        clientId: req.body.clientId || userId, // Default to current user if no client specified
        assessorName,
        assessorRole,
        conductedAt
      });
      
      const assessment = await storage.createAssessment(data);
      res.json(assessment);
    } catch (error) {
      console.error("Error creating assessment:", error);
      res.status(400).json({ message: "Failed to create assessment" });
    }
  });

  app.get('/api/assessments', isAuthenticated, requireAuth, async (req: any, res) => {
    try {
      const dbUser = (req as any).dbUser;
      
      let assessments;
      
      if (dbUser.role === 'admin') {
        // Admin can see all assessments
        assessments = await storage.getAllAssessments();
      } else if (dbUser.role === 'assessor') {
        // Assessor can see their own assessments
        assessments = await storage.getUserAssessments(dbUser.id);
      } else if (dbUser.role === 'client') {
        // Client can only see assessments where they are the client
        assessments = await storage.getClientAssessments(dbUser.id);
      } else {
        return res.status(403).json({ message: "Access denied" });
      }
      
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

  app.delete('/api/assessments/:id', isDemoAuthenticated, async (req: any, res) => {
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
  app.post('/api/assessments/:id/sections', isDemoAuthenticated, async (req: any, res) => {
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

  app.get('/api/assessments/:id/sections', isDemoAuthenticated, async (req: any, res) => {
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
  app.post('/api/assessments/:id/media',  upload.array('files'), async (req: any, res) => {
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

  app.get('/api/assessments/:id/media',  async (req: any, res) => {
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

  // Report generation and download routes for clients
  app.get('/api/assessments/:id/report', isAuthenticated, requireAuth, requireAssessmentAccess, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const dbUser = (req as any).dbUser;
      const assessment = await storage.getAssessmentWithSections(id);
      
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      // Check access permissions
      if (dbUser.role === 'client' && assessment.clientId !== dbUser.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (dbUser.role === 'assessor' && assessment.userId !== dbUser.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Generate report data
      const reportData = {
        assessment,
        generatedAt: new Date(),
        generatedBy: dbUser.id,
        reportType: "comprehensive"
      };

      res.json(reportData);
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  // Download assessment data (CSV/PDF export)
  app.get('/api/assessments/:id/export', isAuthenticated, requireAuth, requireAssessmentAccess, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const format = req.query.format as string || 'json';
      const dbUser = (req as any).dbUser;
      const assessment = await storage.getAssessmentWithSections(id);
      
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      // Check access permissions
      if (dbUser.role === 'client' && assessment.clientId !== dbUser.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="assessment-${id}.csv"`);
        
        // Generate CSV data
        const csvData = `Assessment ID,Building Name,Status,Score,Max Score,Completion Date\n${assessment.id},"${assessment.buildingName}","${assessment.status}",${assessment.overallScore},${assessment.maxPossibleScore},"${assessment.createdAt}"`;
        res.send(csvData);
      } else {
        res.json(assessment);
      }
    } catch (error) {
      console.error("Error exporting assessment:", error);
      res.status(500).json({ message: "Failed to export assessment" });
    }
  });

  // Get user dashboard data based on role
  app.get('/api/dashboard', isAuthenticated, requireAuth, async (req: any, res) => {
    try {
      const dbUser = (req as any).dbUser;
      let dashboardData: any = {
        user: {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          role: dbUser.role
        }
      };

      if (dbUser.role === 'admin') {
        // Admin sees system-wide statistics
        const users = await storage.getAllUsers();
        const assessments = await storage.getAllAssessments();
        dashboardData.stats = {
          totalUsers: users.length,
          totalAssessments: assessments.length,
          activeUsers: users.filter(u => u.status === 'active').length,
          completedAssessments: assessments.filter(a => a.status === 'completed').length
        };
      } else if (dbUser.role === 'assessor') {
        // Assessor sees their assessment statistics
        const userAssessments = await storage.getUserAssessments(dbUser.id);
        dashboardData.stats = {
          totalAssessments: userAssessments.length,
          completedAssessments: userAssessments.filter(a => a.status === 'completed').length,
          inProgressAssessments: userAssessments.filter(a => a.status === 'draft').length
        };
      } else if (dbUser.role === 'client') {
        // Client sees their building assessments
        const clientAssessments = await storage.getClientAssessments(dbUser.id);
        dashboardData.stats = {
          totalAssessments: clientAssessments.length,
          completedAssessments: clientAssessments.filter(a => a.status === 'completed').length,
          avgScore: clientAssessments.length > 0 ? 
            clientAssessments.reduce((sum, a) => sum + (a.overallScore || 0), 0) / clientAssessments.length : 0
        };
      }

      res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Serve uploaded files
  app.get('/api/media/:id', isAuthenticated, requireAuth, async (req: any, res) => {
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
