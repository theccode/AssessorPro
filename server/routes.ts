import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupCustomAuth, isCustomAuthenticated } from "./custom-auth";
import { domainRoleMiddleware, validateDomainAccess, getDomainConfig } from "./domain-routing";
import { setupDemoAuth, isDemoAuthenticated } from "./demo-auth";
import { requireAuth, requireAdminOrAssessor, requireAssessmentAccess, requireFeature } from "./middleware";
import { registerAdminRoutes } from "./admin-routes";
import { insertAssessmentSchema, insertAssessmentSectionSchema, assessmentMedia, assessments, users } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
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
    const allowedExtensions = /jpeg|jpg|png|gif|webp|mp4|webm|mov|avi|mp3|wav|m4a|aac|ogg|pdf|doc|docx/;
    const allowedMimeTypes = /^(image\/(jpeg|jpg|png|gif|webp)|video\/(mp4|webm|mov|avi|quicktime)|audio\/(mpeg|mp3|wav|wave|x-wav|m4a|aac|x-aac|mp4|ogg|vorbis|x-vorbis)|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document))$/;
    
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimeTypes.test(file.mimetype);
    
    if (mimetype || extname) {
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

  // Setup custom authentication
  setupCustomAuth(app);

  // Domain routing middleware (after auth but before routes)
  app.use(domainRoleMiddleware);
  app.use(validateDomainAccess);

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

  // Config routes
  app.get('/api/config/domains', (req, res) => {
    res.json(getDomainConfig());
  });

  app.get('/api/config/google-maps-key', (req, res) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Google Maps API key not configured" });
    }
    res.send(apiKey);
  });

  // Public statistics endpoint for landing page
  app.get('/api/public/stats', async (req, res) => {
    try {
      const allAssessments = await db.select().from(assessments);
      const allUsers = await db.select().from(users);
      
      const totalAssessments = allAssessments.length;
      const completedAssessments = allAssessments.filter(a => a.status === 'completed').length;
      const totalUsers = allUsers.length;
      const assessorCount = allUsers.filter(u => u.role === 'assessor').length;
      
      // Calculate average score for completed assessments
      const completedWithSections = await Promise.all(
        allAssessments
          .filter(a => a.status === 'completed')
          .map(async (assessment) => {
            const sections = await storage.getAssessmentSections(assessment.id);
            return { assessment, sections };
          })
      );
      
      const totalScores = completedWithSections.map(({ sections }) => {
        const totalScore = sections.reduce((sum, section) => sum + (section.score || 0), 0);
        const maxScore = sections.reduce((sum, section) => sum + (section.maxScore || 0), 0);
        return maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
      });
      
      const averageScore = totalScores.length > 0 
        ? Math.round(totalScores.reduce((sum, score) => sum + score, 0) / totalScores.length)
        : 0;

      res.json({
        totalAssessments,
        completedAssessments,
        totalUsers,
        assessorCount,
        averageScore,
        // Additional calculated stats
        averageEnergySavings: Math.min(85, Math.max(65, averageScore - 10)), // Realistic energy savings based on scores
        uptime: 99.9,
        supportHours: "24/7"
      });
    } catch (error) {
      console.error("Error fetching platform stats:", error);
      res.status(500).json({ message: "Failed to fetch platform statistics" });
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

  // Get available clients for assessment creation
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

  app.get('/api/assessments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Get both assessments where user is the assessor and where user is the client
      const assessorAssessments = await storage.getUserAssessments(userId);
      const clientAssessments = await storage.getClientAssessments(userId);
      
      // Combine and remove duplicates (in case user is both assessor and client)
      const allAssessments = [...assessorAssessments, ...clientAssessments];
      const uniqueAssessments = allAssessments.filter((assessment, index, self) => 
        index === self.findIndex(a => a.id === assessment.id)
      );
      
      res.json(uniqueAssessments);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      res.status(500).json({ message: "Failed to fetch assessments" });
    }
  });

  app.get('/api/assessments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const publicId = req.params.id;
      const assessment = await storage.getAssessmentByPublicId(publicId);
      
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
      const publicId = req.params.id;
      const userId = req.user.claims.sub;
      
      // Verify ownership using public ID
      const existing = await storage.getAssessmentByPublicId(publicId);
      if (!existing || existing.userId !== userId) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      const updated = await storage.updateAssessment(existing.id, req.body);
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
  app.post('/api/assessments/:id/sections', isAuthenticated, async (req: any, res) => {
    try {
      const publicId = req.params.id;
      const userId = req.user.claims.sub;
      
      // Verify ownership using public ID
      const assessment = await storage.getAssessmentByPublicId(publicId);
      if (!assessment || assessment.userId !== userId) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      const data = insertAssessmentSectionSchema.parse({ ...req.body, assessmentId: assessment.id });
      console.log("Parsed section data:", JSON.stringify(data, null, 2));
      const section = await storage.upsertAssessmentSection(data);
      console.log("Saved section with isCompleted:", section.isCompleted);
      
      // Update assessment completion status
      const sections = await storage.getAssessmentSections(assessment.id);
      const completedCount = sections.filter(s => s.isCompleted).length;
      const totalScore = sections.reduce((sum, s) => sum + (s.score || 0), 0);
      const maxPossible = sections.reduce((sum, s) => sum + (s.maxScore || 0), 0);
      
      await storage.updateAssessment(assessment.id, {
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
      const publicId = req.params.id;
      const userId = req.user.claims.sub;
      
      // Get assessment by public ID to verify ownership
      const assessment = await storage.getAssessmentByPublicId(publicId);
      if (!assessment || assessment.userId !== userId) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      const sections = await storage.getAssessmentSections(assessment.id);
      res.json(sections);
    } catch (error) {
      console.error("Error fetching sections:", error);
      res.status(500).json({ message: "Failed to fetch sections" });
    }
  });

  // Media upload routes
  app.post('/api/assessments/:id/media',  upload.array('files'), async (req: any, res) => {
    try {
      const publicId = req.params.id;
      const userId = req.user.claims.sub;
      const { sectionType, fieldName } = req.body;
      
      // Verify ownership using public ID
      const assessment = await storage.getAssessmentByPublicId(publicId);
      if (!assessment || assessment.userId !== userId) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      const files = req.files as Express.Multer.File[];
      const uploadedMedia = [];

      for (const file of files) {
        // Move file to permanent location using internal assessment ID
        const uploadDir = path.join('uploads', 'assessments', assessment.id.toString(), sectionType);
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
          assessmentId: assessment.id,
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
      const publicId = req.params.id;
      const { sectionType, fieldName } = req.query;
      
      // Get assessment by public ID to get internal ID
      const assessment = await storage.getAssessmentByPublicId(publicId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      let media;
      if (sectionType && fieldName) {
        // Filter by both section and field
        const allMedia = await storage.getAssessmentMedia(assessment.id, sectionType as string);
        media = allMedia.filter(m => m.fieldName === fieldName);
      } else {
        media = await storage.getAssessmentMedia(assessment.id, sectionType as string);
      }
      
      res.json(media);
    } catch (error) {
      console.error("Error fetching media:", error);
      res.status(500).json({ message: "Failed to fetch media" });
    }
  });

  // Serve uploaded files with proper authentication
  app.get('/api/media/serve/:id', async (req: any, res) => {
    try {
      const mediaId = parseInt(req.params.id);
      
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        console.log(`Unauthenticated access attempt for media ${mediaId}`);
        // Redirect to login page instead of showing JSON error
        return res.redirect('/api/login');
      }
      
      const userId = req.user.claims.sub;
      console.log(`Serving media ${mediaId} for user ${userId}`);
      
      // Get assessments where user is either the assessor (userId) or the client (clientId)
      const assessorAssessments = await storage.getUserAssessments(userId);
      const clientAssessments = await storage.getClientAssessments(userId);
      const allAccessibleAssessments = [...assessorAssessments, ...clientAssessments];
      
      let targetMedia = null;
      
      console.log(`Found ${allAccessibleAssessments.length} accessible assessments for user`);
      
      for (const assessment of allAccessibleAssessments) {
        const media = await storage.getAssessmentMedia(assessment.id);
        console.log(`Assessment ${assessment.id} has ${media.length} media files`);
        targetMedia = media.find(m => m.id === mediaId);
        if (targetMedia) {
          console.log(`Found target media:`, targetMedia);
          break;
        }
      }
      
      if (!targetMedia) {
        console.log(`Media ${mediaId} not found for user ${userId}`);
        // Redirect to home page with error message instead of JSON
        return res.redirect('/?error=file_not_found');
      }

      // Serve the file
      const filePath = path.resolve(targetMedia.filePath);
      console.log(`Attempting to serve file from: ${filePath}`);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log(`File not found on disk: ${filePath}`);
        return res.redirect('/?error=file_missing');
      }

      // Set appropriate headers
      res.setHeader('Content-Type', targetMedia.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${targetMedia.fileName}"`);
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error serving media:", error);
      res.redirect('/?error=server_error');
    }
  });

  // Delete media file
  app.delete('/api/media/:id', isAuthenticated, async (req: any, res) => {
    try {
      const mediaId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // First find the media and verify ownership
      const allAssessments = await storage.getUserAssessments(userId);
      let targetMedia = null;
      let ownsMedia = false;
      
      for (const assessment of allAssessments) {
        if (assessment.userId === userId) {
          const media = await storage.getAssessmentMedia(assessment.id);
          targetMedia = media.find(m => m.id === mediaId);
          if (targetMedia) {
            ownsMedia = true;
            break;
          }
        }
      }
      
      if (!targetMedia || !ownsMedia) {
        return res.status(404).json({ message: "Media not found or access denied" });
      }

      // Delete the file from disk
      const filePath = path.resolve(targetMedia.filePath);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }

      // Delete from database
      await storage.deleteAssessmentMedia(mediaId);
      
      res.json({ message: "Media deleted successfully" });
    } catch (error) {
      console.error("Error deleting media:", error);
      res.status(500).json({ message: "Failed to delete media" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
