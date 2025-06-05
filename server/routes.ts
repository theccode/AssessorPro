import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupCustomAuth, isCustomAuthenticated } from "./custom-auth";
import { domainRoleMiddleware, validateDomainAccess, getDomainConfig } from "./domain-routing";
import { requireAuth, requireAdminOrAssessor, requireAssessmentAccess, requireFeature } from "./middleware";
import { registerAdminRoutes } from "./admin-routes";
import { insertAssessmentSchema, insertAssessmentSectionSchema, insertNotificationSchema, assessmentMedia, assessments, users, assessmentSections } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import { notificationService } from "./notification-service";
import { activityService } from "./activity-service";

// WebSocket connection manager
interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  role?: string;
}

class WebSocketManager {
  private connections = new Map<string, Set<AuthenticatedWebSocket>>();

  addConnection(userId: string, ws: AuthenticatedWebSocket) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId)!.add(ws);
    console.log(`[WebSocket] User ${userId} connected. Total connections: ${this.getTotalConnections()}`);
  }

  removeConnection(userId: string, ws: AuthenticatedWebSocket) {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      userConnections.delete(ws);
      if (userConnections.size === 0) {
        this.connections.delete(userId);
      }
    }
    console.log(`[WebSocket] User ${userId} disconnected. Total connections: ${this.getTotalConnections()}`);
  }

  sendToUser(userId: string, message: any) {
    console.log(`[WebSocket] Attempting to send message to user ${userId}`);
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      console.log(`[WebSocket] Found ${userConnections.size} connections for user ${userId}`);
      const messageStr = JSON.stringify(message);
      let sentCount = 0;
      userConnections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
          sentCount++;
        }
      });
      console.log(`[WebSocket] Sent message to ${sentCount} connections for user ${userId}`);
      return true;
    } else {
      console.log(`[WebSocket] No connections found for user ${userId}`);
      return false;
    }
  }

  broadcastToRole(role: string, message: any) {
    const messageStr = JSON.stringify(message);
    let sentCount = 0;
    
    this.connections.forEach((userConnections, userId) => {
      userConnections.forEach(ws => {
        if (ws.role === role && ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
          sentCount++;
        }
      });
    });
    
    return sentCount;
  }

  getTotalConnections(): number {
    let total = 0;
    this.connections.forEach(userConnections => {
      total += userConnections.size;
    });
    return total;
  }
}

const wsManager = new WebSocketManager();

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
  // Setup custom authentication only
  setupCustomAuth(app);

  // Domain routing middleware (after auth but before routes)
  app.use(domainRoleMiddleware);
  app.use(validateDomainAccess);

  // Register admin routes
  registerAdminRoutes(app);

  // Auth routes with custom authentication
  app.get('/api/auth/user', isCustomAuthenticated, async (req: any, res) => {
    try {
      // req.user is already populated by the middleware
      res.json(req.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Profile management routes
  app.put('/api/auth/profile', isCustomAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { firstName, lastName, email, organizationName } = req.body;

      const updatedUser = await storage.updateUser(userId, {
        firstName,
        lastName,
        email,
        organizationName,
        updatedAt: new Date()
      });

      const { passwordHash, ...userResponse } = updatedUser;
      res.json(userResponse);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.post('/api/auth/reset-password', isCustomAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Import bcrypt functions
      const { verifyPassword, hashPassword } = await import("./custom-auth");

      // Verify current password
      const isValidPassword = await verifyPassword(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);
      
      // Update password
      await storage.updateUser(userId, {
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      });

      // Send email notification
      if (user.email) {
        try {
          const { emailService } = await import("./email-service");
          await emailService.sendEmail({
            to: user.email,
            subject: "Password Reset Confirmation - GREDA Assessment Platform",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #059669;">Password Reset Confirmation</h2>
                <p>Hello ${user.firstName || user.email},</p>
                <p>This email confirms that your password has been successfully reset for your GREDA Assessment Platform account.</p>
                <div style="background-color: #f0fdf4; border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin: 20px 0;">
                  <p style="margin: 0; color: #065f46;"><strong>Account Details:</strong></p>
                  <p style="margin: 8px 0 0 0; color: #065f46;">Email: ${user.email}</p>
                  <p style="margin: 4px 0 0 0; color: #065f46;">Role: ${user.role}</p>
                  <p style="margin: 4px 0 0 0; color: #065f46;">Reset Time: ${new Date().toLocaleString()}</p>
                </div>
                <p>If you did not initiate this password reset, please contact our support team immediately.</p>
                <p>For security reasons, we recommend:</p>
                <ul>
                  <li>Using a strong, unique password</li>
                  <li>Not sharing your credentials with anyone</li>
                  <li>Logging out of shared devices</li>
                </ul>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #6b7280; font-size: 14px;">
                  This email was sent from the GREDA Assessment Platform. If you have questions, please contact our support team.
                </p>
              </div>
            `,
            text: `
Password Reset Confirmation

Hello ${user.firstName || user.email},

This email confirms that your password has been successfully reset for your GREDA Assessment Platform account.

Account Details:
- Email: ${user.email}
- Role: ${user.role}
- Reset Time: ${new Date().toLocaleString()}

If you did not initiate this password reset, please contact our support team immediately.

For security reasons, we recommend using a strong, unique password and not sharing your credentials with anyone.
            `
          });
        } catch (emailError) {
          console.error("Failed to send password reset email:", emailError);
          // Don't fail the password reset if email fails
        }
      }

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Audit logging endpoint
  app.post('/api/audit/log', isCustomAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { action, details } = req.body;

      await storage.createAuditLog({
        userId,
        action,
        details,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent") || "",
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Audit log error:", error);
      res.status(500).json({ message: "Failed to create audit log" });
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

  // Public gallery endpoint - shows completed assessments for showcase
  app.get('/api/public/gallery', async (req, res) => {
    try {
      const allAssessments = await db.select().from(assessments);
      const completedAssessments = allAssessments.filter(assessment => assessment.status === 'completed');
      
      // Get assessment sections and media to provide comprehensive data
      const galleryItems = await Promise.all(
        completedAssessments.slice(0, 6).map(async (assessment) => {
          const sections = await storage.getAssessmentSections(assessment.id);
          const media = await storage.getAssessmentMedia(assessment.id);
          
          const totalScore = sections.reduce((sum, section) => sum + (section.score || 0), 0);
          const maxScore = sections.reduce((sum, section) => sum + (section.maxScore || 0), 0);
          const scorePercentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
          
          // Get the first image for display
          const imageFiles = media.filter(m => m.mimeType && m.mimeType.startsWith('image/'));
          const featuredImage = imageFiles.length > 0 ? `/api/media/${imageFiles[0].id}` : null;
          
          // Calculate star rating based on actual score (adjusted for better accuracy)
          const starRating = Math.max(1, Math.min(5, Math.ceil(scorePercentage / 20)));
          
          return {
            id: assessment.id,
            buildingName: assessment.buildingName || 'Unnamed Building',
            location: assessment.buildingLocation || 'Location Not Specified',
            score: totalScore,
            maxScore: maxScore || 100,
            scorePercentage: Math.round(scorePercentage),
            starRating,
            certificationLevel: `${starRating}-Star Certified`,
            energySavings: Math.round(scorePercentage * 0.85), // Energy savings based on actual performance
            completedAt: assessment.updatedAt,
            featuredImage,
            sectionCount: sections.length,
            mediaCount: media.length
          };
        })
      );

      res.json(galleryItems);
    } catch (error) {
      console.error("Error fetching gallery assessments:", error);
      res.status(500).json({ message: "Failed to fetch gallery data" });
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
  app.get('/api/clients', isCustomAuthenticated, requireAuth, requireAdminOrAssessor, async (req: any, res) => {
    try {
      const clients = await storage.getUsersByRole("client");
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  // Get all users for admin notes assignment
  app.get('/api/users', isCustomAuthenticated, requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      
      // Only admins can access user list
      if (currentUser?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const allUsers = await storage.getAllUsers();
      
      // Return users with basic info needed for assignment
      const usersForAssignment = allUsers.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        email: user.email
      }));
      
      res.json(usersForAssignment);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Assessment routes
  app.post('/api/assessments', isCustomAuthenticated, requireAuth, requireAdminOrAssessor, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

      // Get client information and send notification
      try {
        const client = await storage.getUser(assessment.clientId);
        if (client) {
          await notificationService.notifyAssessmentStarted(assessment, user, client);
        }
      } catch (notificationError) {
        console.error("Failed to send assessment started notification:", notificationError);
        // Don't fail the assessment creation if notification fails
      }

      res.json(assessment);
    } catch (error) {
      console.error("Error creating assessment:", error);
      res.status(400).json({ message: "Failed to create assessment" });
    }
  });

  app.get('/api/assessments', isCustomAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get current user to check role
      const currentUser = await storage.getUser(userId);
      
      if (currentUser?.role === 'admin') {
        // Admin users see all assessments
        console.log('Admin user detected, fetching all assessments...');
        const allAssessments = await storage.getAllAssessments();
        console.log(`Found ${allAssessments.length} assessments for admin:`, allAssessments.map(a => ({ id: a.id, buildingName: a.buildingName, userId: a.userId })));
        console.log('About to send response with assessments:', JSON.stringify(allAssessments.map(a => ({ id: a.id, buildingName: a.buildingName, publicId: a.publicId }))));
        
        // Disable caching for admin users to ensure fresh data
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        
        res.json(allAssessments);
      } else {
        // Regular users see only their own assessments
        const assessorAssessments = await storage.getUserAssessments(userId);
        const clientAssessments = await storage.getClientAssessments(userId);
        
        // Combine and remove duplicates (in case user is both assessor and client)
        const allAssessments = [...assessorAssessments, ...clientAssessments];
        const uniqueAssessments = allAssessments.filter((assessment, index, self) => 
          index === self.findIndex(a => a.id === assessment.id)
        );
        
        res.json(uniqueAssessments);
      }
    } catch (error) {
      console.error("Error fetching assessments:", error);
      res.status(500).json({ message: "Failed to fetch assessments" });
    }
  });

  app.get('/api/assessments/:id', isCustomAuthenticated, async (req: any, res) => {
    try {
      const publicId = req.params.id;
      
      const assessment = await storage.getAssessmentByPublicId(publicId);
      
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      // Check if user has access to this assessment
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      // Allow access if:
      // 1. User is the assessment owner
      // 2. User is the client
      // 3. User is an admin
      // 4. User is an assessor and assessment is unlocked (edit request approved)
      const hasAccess = (
        assessment.userId === userId ||
        assessment.clientId === userId ||
        user?.role === 'admin' ||
        (user?.role === 'assessor' && !assessment.isLocked)
      );
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(assessment);
    } catch (error) {
      console.error("Error fetching assessment:", error);
      res.status(500).json({ message: "Failed to fetch assessment" });
    }
  });

  // Assessment sections by ID
  app.get('/api/assessments/:id/sections', isCustomAuthenticated, async (req: any, res) => {
    try {
      const publicId = req.params.id;
      // Get assessment by public ID to get internal ID
      const assessment = await storage.getAssessmentByPublicId(publicId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      const sections = await storage.getAssessmentSections(assessment.id);
      
      res.json(sections);
    } catch (error) {
      console.error("Error fetching assessment sections:", error);
      res.status(500).json({ message: "Failed to fetch sections" });
    }
  });

  // Assessment media by ID
  app.get('/api/assessments/:id/media', isCustomAuthenticated, async (req: any, res) => {
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
      console.error("Error fetching assessment media:", error);
      res.status(500).json({ message: "Failed to fetch media" });
    }
  });

  // PDF Generation for Assessment
  app.get('/api/assessments/:id/pdf', isCustomAuthenticated, async (req: any, res) => {
    try {
      const publicId = req.params.id;
      const assessment = await storage.getAssessmentByPublicId(publicId);
      
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      // Check if user has access to this assessment
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (assessment.userId !== userId && assessment.clientId !== userId && user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      // Generate PDF content
      const jsPDF = (await import('jspdf')).default;
      const pdf = new jsPDF();
      
      // Add title and header
      pdf.setFontSize(20);
      pdf.text('GREDA Green Building Assessment Report', 20, 30);
      
      pdf.setFontSize(12);
      pdf.text(`Building: ${assessment.buildingName || 'Unnamed Building'}`, 20, 50);
      pdf.text(`Location: ${assessment.buildingLocation || 'Not specified'}`, 20, 60);
      pdf.text(`Assessment Date: ${new Date(assessment.createdAt || '').toLocaleDateString()}`, 20, 70);
      pdf.text(`Status: ${assessment.status}`, 20, 80);
      
      // Add overall score
      pdf.setFontSize(16);
      pdf.text('Overall Performance', 20, 100);
      pdf.setFontSize(12);
      pdf.text(`Score: ${Math.round(assessment.overallScore || 0)}/130 credits`, 20, 110);
      pdf.text(`Performance: ${Math.round(((assessment.overallScore || 0) / 130) * 100)}%`, 20, 120);
      
      // Add sections
      let yPosition = 140;
      pdf.setFontSize(14);
      pdf.text('Section Details', 20, yPosition);
      yPosition += 15;
      
      assessment.sections.forEach((section: any) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 30;
        }
        
        pdf.setFontSize(12);
        pdf.text(`${section.sectionType}: ${section.score || 0}/20 credits`, 20, yPosition);
        yPosition += 10;
      });
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${assessment.buildingName || 'assessment'}-report.pdf"`);
      
      // Send PDF
      const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
      res.send(pdfBuffer);
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  app.patch('/api/assessments/:id', isCustomAuthenticated, async (req: any, res) => {
    try {
      const publicId = req.params.id;
      const userId = req.user.id;
      
      // Verify ownership using public ID
      const existing = await storage.getAssessmentByPublicId(publicId);
      if (!existing || existing.userId !== userId) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      // Get current user data to check role
      const currentUser = await storage.getUser(userId);
      
      // Check if assessment is locked and user is not admin
      if (existing.isLocked && currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Assessment is locked and cannot be edited. Contact an administrator to unlock it." });
      }

      // Auto-lock when status changes to submitted
      const updateData = { ...req.body };
      if (updateData.status === 'submitted' && existing.status !== 'submitted') {
        updateData.isLocked = true;
        updateData.lockedBy = userId;
        updateData.lockedAt = new Date();
      }

      // Track edit history if someone other than the original conductor is making actual changes
      if (existing.userId !== userId) {
        // Check if any actual data changes are being made
        const fieldsToCheck = [
          'buildingName', 'clientName', 'buildingLocation', 'digitalAddress', 
          'detailedAddress', 'phoneNumber', 'additionalNotes', 'buildingFootprint',
          'roomHeight', 'numberOfBedrooms', 'siteArea', 'numberOfWindows', 
          'numberOfDoors', 'averageWindowSize', 'numberOfFloors', 'totalGreenArea',
          'overallScore', 'status'
        ];
        
        let hasActualChanges = false;
        for (const field of fieldsToCheck) {
          if (req.body.hasOwnProperty(field) && req.body[field] !== existing[field]) {
            hasActualChanges = true;
            break;
          }
        }
        
        // Only track edit if there are actual data changes
        if (hasActualChanges) {
          updateData.lastEditedBy = userId;
          updateData.lastEditedByName = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || currentUser?.email;
          updateData.lastEditedAt = new Date();
        }
      }

      // Convert empty strings to null for numeric fields to prevent database errors
      const numericFields = [
        'buildingFootprint', 'roomHeight', 'numberOfBedrooms', 'siteArea',
        'numberOfWindows', 'numberOfDoors', 'averageWindowSize', 'numberOfFloors', 
        'totalGreenArea'
      ];
      
      numericFields.forEach(field => {
        if (updateData[field] === '') {
          updateData[field] = null;
        }
      });

      const updated = await storage.updateAssessment(existing.id, updateData);

      // Send notifications for status changes
      try {
        const assessor = await storage.getUser(existing.userId);
        const client = existing.clientId ? await storage.getUser(existing.clientId) : null;

        console.log(`Notification check: assessor=${assessor?.id}, client=${client?.id}, status change: ${existing.status} -> ${updateData.status}`);

        // Assessment started notification
        if (updateData.status === 'in_progress' && existing.status === 'draft' && assessor) {
          if (client) {
            console.log('Sending assessment started notification to client and admin');
            await notificationService.notifyAssessmentStarted(updated, assessor, client);
          } else {
            console.log('No client found for assessment started notification');
          }
        }

        // Assessment submitted notification and auto-lock
        if (updateData.status === 'submitted' && existing.status !== 'submitted') {
          // Auto-lock assessment when submitted to prevent further editing
          await storage.updateAssessment(existing.id, { 
            isLocked: true, 
            lockedBy: assessor?.id,
            lockedAt: new Date()
          });
          
          if (assessor && client) {
            console.log('Sending assessment submitted notification to client and admin');
            await notificationService.notifyAssessmentSubmitted(updated, assessor, client);
          } else {
            console.log('No client found for assessment submitted notification');
          }
        }

        // Assessment completed notification and auto-lock
        if (updateData.status === 'completed' && existing.status !== 'completed') {
          // Auto-lock assessment when completed to prevent further editing
          await storage.updateAssessment(existing.id, { 
            isLocked: true, 
            lockedBy: assessor?.id,
            lockedAt: new Date()
          });
          
          if (assessor && client) {
            console.log('Sending assessment completed notification to client and admin');
            await notificationService.notifyAssessmentCompleted(updated, assessor, client);
            // Also send report ready notification
            await notificationService.notifyReportReady(updated, client);
          } else {
            console.log('No client found for assessment completed notification');
          }
        }
        
        // Auto-lock completed assessments after editing
        if (existing.status === 'completed' && !existing.isLocked && existing.userId !== userId) {
          console.log('Auto-locking completed assessment after editing');
          await storage.updateAssessment(existing.id, { 
            isLocked: true, 
            lockedBy: assessor?.id || userId,
            lockedAt: new Date()
          });
          
          // Log the auto-lock activity
          const { activityService } = await import('./activity-service');
          const lockingUser = assessor || currentUser;
          if (lockingUser) {
            await activityService.logAssessmentLocked(lockingUser, updated, 'Auto-locked after editing completed assessment');
          }
          
          // Send notification that editing is complete and assessment is locked
          console.log('Sending assessment editing completed notification');
          await notificationService.notifyEditingCompleted(updated, lockingUser || currentUser);
        }
      } catch (notificationError) {
        console.error("Error sending notifications:", notificationError);
        // Don't fail the request if notifications fail
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating assessment:", error);
      res.status(500).json({ message: "Failed to update assessment" });
    }
  });

  app.delete('/api/assessments/:id', isCustomAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      
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

  // Lock assessment (admin only)
  app.post('/api/assessments/:id/lock', isCustomAuthenticated, async (req: any, res) => {
    try {
      const publicId = req.params.id;
      const userId = req.user.id;
      
      // Get current user to check admin role
      const currentUser = await storage.getUser(userId);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Only administrators can lock assessments" });
      }
      
      // Get assessment by public ID to get internal ID
      const assessment = await storage.getAssessmentByPublicId(publicId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      // Update assessment with lock
      const updated = await storage.updateAssessment(assessment.id, {
        isLocked: true,
        lockedBy: userId,
        lockedAt: new Date()
      });

      // Send lock notification
      try {
        const assessor = await storage.getUser(assessment.userId);
        if (assessor) {
          await notificationService.notifyAssessmentLocked(updated, currentUser);
        }
      } catch (notificationError) {
        console.error("Error sending lock notification:", notificationError);
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error locking assessment:", error);
      res.status(500).json({ message: "Failed to lock assessment" });
    }
  });

  // Lock/unlock assessment toggle (admin only)
  app.patch('/api/assessments/:id/lock', isCustomAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isLocked } = req.body;
      const userId = req.user.id;
      
      // Get current user to check admin role
      const currentUser = await storage.getUser(userId);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Only administrators can lock/unlock assessments" });
      }
      
      // Update assessment lock status
      const updated = await storage.updateAssessment(id, {
        isLocked: isLocked,
        lockedBy: isLocked ? userId : null,
        lockedAt: isLocked ? new Date() : null
      });

      // Send lock/unlock notifications
      try {
        const assessment = await storage.getAssessment(id);
        if (assessment) {
          const assessor = await storage.getUser(assessment.userId);
          if (assessor) {
            if (isLocked) {
              await notificationService.notifyAssessmentLocked(updated, currentUser);
            } else {
              await notificationService.notifyAssessmentUnlocked(updated, currentUser);
            }
          }
        }
      } catch (notificationError) {
        console.error("Error sending lock/unlock notification:", notificationError);
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating assessment lock status:", error);
      res.status(500).json({ message: "Failed to update assessment lock status" });
    }
  });

  // Unlock assessment (admin only)
  app.post('/api/assessments/:id/unlock', isCustomAuthenticated, async (req: any, res) => {
    try {
      const publicId = req.params.id;
      const userId = req.user.id;
      
      // Get current user to check admin role
      const currentUser = await storage.getUser(userId);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Only administrators can unlock assessments" });
      }
      
      // Get assessment by public ID to get internal ID
      const assessment = await storage.getAssessmentByPublicId(publicId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      // Update assessment to remove lock
      const updated = await storage.updateAssessment(assessment.id, {
        isLocked: false,
        lockedBy: null,
        lockedAt: null
      });

      // Send unlock notification
      try {
        const assessor = await storage.getUser(assessment.userId);
        if (assessor) {
          await notificationService.notifyAssessmentUnlocked(updated, currentUser);
        }
      } catch (notificationError) {
        console.error("Error sending unlock notification:", notificationError);
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error unlocking assessment:", error);
      res.status(500).json({ message: "Failed to unlock assessment" });
    }
  });

  // Assessment section routes
  app.post('/api/assessments/:id/sections', isCustomAuthenticated, async (req: any, res) => {
    try {
      const publicId = req.params.id;
      const userId = req.user.id;
      
      // Get assessment and verify access
      const assessment = await storage.getAssessmentByPublicId(publicId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      // Get current user info
      const user = await storage.getUser(userId);
      
      // Allow access if:
      // 1. User is the assessment owner
      // 2. User is the client
      // 3. User is an admin
      // 4. User is an assessor and assessment is unlocked (edit request approved)
      const hasAccess = (
        assessment.userId === userId ||
        assessment.clientId === userId ||
        user?.role === 'admin' ||
        (user?.role === 'assessor' && !assessment.isLocked)
      );
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if assessment is locked and user is not admin/owner
      if (assessment.isLocked && user?.role !== 'admin' && assessment.userId !== userId) {
        return res.status(403).json({ message: "Assessment is locked and cannot be edited. Contact an administrator to unlock it." });
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

  app.get('/api/assessments/:id/sections', isCustomAuthenticated, async (req: any, res) => {
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
  app.post('/api/assessments/:id/media', isCustomAuthenticated, upload.array('files'), async (req: any, res) => {
    try {
      const publicId = req.params.id;
      const userId = req.user.id;
      const { sectionType, fieldName } = req.body;
      
      console.log(`Media upload started - Assessment: ${publicId}, Section: ${sectionType}, Field: ${fieldName}, User: ${userId}`);
      
      // Verify ownership using public ID
      const assessment = await storage.getAssessmentByPublicId(publicId);
      if (!assessment || assessment.userId !== userId) {
        console.error(`Assessment access denied - ID: ${publicId}, User: ${userId}, Assessment Owner: ${assessment?.userId}`);
        return res.status(404).json({ message: "Assessment not found" });
      }

      const files = req.files as Express.Multer.File[];
      console.log(`Processing ${files.length} files for upload`);
      
      if (!files || files.length === 0) {
        console.error("No files received in upload request");
        return res.status(400).json({ message: "No files provided" });
      }

      const uploadedMedia = [];
      const failedUploads = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`Processing file ${i + 1}/${files.length}: ${file.originalname} (${file.size} bytes)`);
        
        try {
          // Move file to permanent location using internal assessment ID
          const uploadDir = path.join('uploads', 'assessments', assessment.id.toString(), sectionType);
          await fs.promises.mkdir(uploadDir, { recursive: true });
          
          const fileName = `${Date.now()}-${i}-${file.originalname}`;
          const filePath = path.join(uploadDir, fileName);
          
          // Save file with enhanced error handling
          try {
            await fs.promises.rename(file.path, filePath);
            console.log(`File saved successfully: ${filePath}`);
          } catch (error) {
            console.error(`Error saving file ${fileName}:`, error);
            // Try copying instead of renaming if rename fails
            try {
              await fs.promises.copyFile(file.path, filePath);
              await fs.promises.unlink(file.path);
              console.log(`File copied successfully: ${filePath}`);
            } catch (copyError) {
              console.error(`Failed to copy file ${fileName}:`, copyError);
              throw new Error(`File upload failed: ${copyError instanceof Error ? copyError.message : 'Unknown error'}`);
            }
          }

          // Verify file was actually saved
          try {
            await fs.promises.access(filePath);
            const stats = await fs.promises.stat(filePath);
            console.log(`File verification successful: ${filePath} (${stats.size} bytes)`);
          } catch (verifyError) {
            console.error(`File verification failed for ${fileName}:`, verifyError);
            throw new Error(`File upload verification failed`);
          }

          // Determine file type
          let fileType = 'document';
          if (file.mimetype.startsWith('image/')) fileType = 'image';
          else if (file.mimetype.startsWith('video/') || file.mimetype === 'video/quicktime') fileType = 'video';
          else if (file.mimetype.startsWith('audio/')) fileType = 'audio';

          console.log(`Creating database record for: ${file.originalname}`);
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

          console.log(`Database record created successfully with ID: ${media.id}`);
          uploadedMedia.push(media);
          
        } catch (fileError) {
          console.error(`Failed to process file ${file.originalname}:`, fileError);
          failedUploads.push({
            fileName: file.originalname,
            error: fileError instanceof Error ? fileError.message : 'Unknown error'
          });
        }
      }

      console.log(`Upload completed - Success: ${uploadedMedia.length}, Failed: ${failedUploads.length}`);
      
      if (uploadedMedia.length === 0) {
        return res.status(500).json({ 
          message: "All file uploads failed", 
          failures: failedUploads 
        });
      }

      // Return success response with any failures noted
      const response = {
        uploadedMedia,
        successCount: uploadedMedia.length,
        totalCount: files.length
      };
      
      if (failedUploads.length > 0) {
        response.failures = failedUploads;
        response.message = `${uploadedMedia.length} files uploaded successfully, ${failedUploads.length} failed`;
      }

      res.json(response);
    } catch (error) {
      console.error("Critical error in media upload:", error);
      res.status(500).json({ message: "Failed to upload media" });
    }
  });



  // Direct media access endpoint - Allow public access for media files
  app.get('/api/media/:id', async (req: any, res) => {
    try {
      const mediaId = parseInt(req.params.id);
      
      console.log('Media access request for ID:', mediaId);
      
      // Get all media files to find the requested one
      // For assessment media, we'll allow access without strict user validation
      const [media] = await db.select().from(assessmentMedia).where(eq(assessmentMedia.id, mediaId));
      
      if (!media) {
        console.log(`Media ${mediaId} not found in database`);
        return res.status(404).json({ message: "Media not found" });
      }

      console.log(`Found media: ${media.fileName}, type: ${media.mimeType}, path: ${media.filePath}`);

      // Check if file exists
      const filePath = path.resolve(media.filePath);
      if (!fs.existsSync(filePath)) {
        console.log(`File not found on disk: ${filePath}`);
        return res.status(404).json({ 
          message: "File not found on disk",
          fileName: media.fileName,
          mediaId: media.id 
        });
      }

      // Set appropriate headers with CORS support
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Content-Type', media.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${media.fileName}"`);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.on('error', (error) => {
        console.error(`Error reading file ${filePath}:`, error);
        if (!res.headersSent) {
          res.status(500).json({ message: "Error reading file" });
        }
      });
      
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error serving media:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to serve media" });
      }
    }
  });

  // Serve uploaded files with proper authentication
  app.get('/api/media/serve/:id', isCustomAuthenticated, async (req: any, res) => {
    try {
      const mediaId = parseInt(req.params.id);
      
      console.log(`Serving media ${mediaId} for authenticated user`);
      
      const userId = req.user.id;
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
  app.delete('/api/media/:id', isCustomAuthenticated, async (req: any, res) => {
    try {
      const mediaId = parseInt(req.params.id);
      const userId = req.user.id;
      
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

  // Assessment lock/unlock routes (admin only)
  app.post('/api/assessments/:id/lock', isCustomAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only administrators can lock assessments" });
      }
      
      const assessment = await storage.getAssessment(id);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      if (assessment.isLocked) {
        return res.status(400).json({ message: "Assessment is already locked" });
      }
      
      const updated = await storage.updateAssessment(id, {
        isLocked: true,
        lockedBy: userId,
        lockedAt: new Date(),
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Error locking assessment:", error);
      res.status(500).json({ message: "Failed to lock assessment" });
    }
  });

  app.post('/api/assessments/:id/unlock', isCustomAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only administrators can unlock assessments" });
      }
      
      const assessment = await storage.getAssessment(id);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      if (!assessment.isLocked) {
        return res.status(400).json({ message: "Assessment is not locked" });
      }
      
      const updated = await storage.updateAssessment(id, {
        isLocked: false,
        lockedBy: null,
        lockedAt: null,
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Error unlocking assessment:", error);
      res.status(500).json({ message: "Failed to unlock assessment" });
    }
  });

  // Request edit endpoint for assessors on completed assessments
  app.post('/api/assessments/:publicId/request-edit', isCustomAuthenticated, async (req: any, res) => {
    try {
      const publicId = req.params.publicId;
      const userId = req.user.id;
      const { reason } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Get user role
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'assessor') {
        return res.status(403).json({ message: "Only assessors can request edit access" });
      }

      // Get assessment
      const assessment = await storage.getAssessmentByPublicId(publicId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      if (assessment.status !== 'completed') {
        return res.status(400).json({ message: "Only completed assessments can be requested for editing" });
      }

      // Create notifications for admins
      const { notificationService } = await import('./notification-service');
      await notificationService.notifyEditRequestCreated(assessment, user, reason || "No reason provided");

      res.json({ 
        message: "Edit request submitted successfully. Administrators will be notified.",
        success: true 
      });
    } catch (error) {
      console.error("Error requesting edit access:", error);
      res.status(500).json({ message: "Failed to submit edit request" });
    }
  });

  // Admin endpoints for managing edit requests
  app.post('/api/edit-requests/:notificationId/approve', isCustomAuthenticated, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.notificationId);
      const userId = req.user.id;
      
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only administrators can approve edit requests" });
      }

      // Get the notification
      const notification = await storage.getNotification(notificationId);
      if (!notification || notification.type !== 'edit_request_created') {
        return res.status(404).json({ message: "Edit request not found" });
      }

      // Get the assessment
      const assessment = await storage.getAssessment(notification.assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      // Get requesting user from metadata
      const requestingUserId = notification.metadata?.requestingUserId;
      if (!requestingUserId) {
        return res.status(400).json({ message: "Invalid edit request data" });
      }

      const requestingUser = await storage.getUser(requestingUserId);
      const admin = await storage.getUser(userId);

      // Unlock the assessment
      await storage.updateAssessment(assessment.id, {
        isLocked: false,
        lockedBy: null,
        lockedAt: null,
      });

      // Mark notification as read
      await storage.markNotificationRead(notificationId);

      // Send approval notification and log activity
      const { notificationService } = await import('./notification-service');
      await notificationService.notifyEditRequestApproved(assessment, requestingUser, admin);
      
      // Log the edit request approval activity
      await activityService.logEditRequestApproved(admin, requestingUser, assessment);

      res.json({ 
        message: "Edit request approved successfully. Assessment has been unlocked.",
        success: true 
      });
    } catch (error) {
      console.error("Error approving edit request:", error);
      res.status(500).json({ message: "Failed to approve edit request" });
    }
  });

  app.post('/api/edit-requests/:notificationId/deny', isCustomAuthenticated, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.notificationId);
      const userId = req.user.id;
      const { reason } = req.body;
      
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only administrators can deny edit requests" });
      }

      // Get the notification
      const notification = await storage.getNotification(notificationId);
      if (!notification || notification.type !== 'edit_request_created') {
        return res.status(404).json({ message: "Edit request not found" });
      }

      // Get the assessment
      const assessment = await storage.getAssessment(notification.assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      // Get requesting user from metadata
      const requestingUserId = notification.metadata?.requestingUserId;
      if (!requestingUserId) {
        return res.status(400).json({ message: "Invalid edit request data" });
      }

      const requestingUser = await storage.getUser(requestingUserId);
      const admin = await storage.getUser(userId);

      // Mark notification as read
      await storage.markNotificationRead(notificationId);

      // Send denial notification and log activity
      const { notificationService } = await import('./notification-service');
      await notificationService.notifyEditRequestDenied(assessment, requestingUser, admin, reason);
      
      // Log the edit request denial activity
      await activityService.logEditRequestDenied(admin, requestingUser, assessment, reason);

      res.json({ 
        message: "Edit request denied successfully.",
        success: true 
      });
    } catch (error) {
      console.error("Error denying edit request:", error);
      res.status(500).json({ message: "Failed to deny edit request" });
    }
  });

  // Media transfer endpoint for fixing misplaced files
  app.post('/api/assessments/:id/transfer-media', isCustomAuthenticated, async (req: any, res) => {
    try {
      const { transferUserMediaFiles } = await import('./media-transfer');
      const toPublicId = req.params.id;
      const { fromPublicId } = req.body;
      const userId = req.user.id;

      if (!fromPublicId) {
        return res.status(400).json({ message: "Source assessment ID required" });
      }

      const result = await transferUserMediaFiles(userId, fromPublicId, toPublicId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error in media transfer:", error);
      res.status(500).json({ 
        success: false, 
        transferredCount: 0, 
        message: "Failed to transfer media files" 
      });
    }
  });

  // Notification routes
  app.get('/api/notifications', isCustomAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const isRead = req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const notifications = await storage.getUserNotifications(userId, isRead, limit);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get('/api/notifications/count', isCustomAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching notification count:", error);
      res.status(500).json({ message: "Failed to fetch notification count" });
    }
  });

  app.patch('/api/notifications/:id/read', isCustomAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notificationId = parseInt(req.params.id);
      
      await storage.markNotificationAsRead(notificationId, userId);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch('/api/notifications/read-all', isCustomAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.delete('/api/notifications/:id', isCustomAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notificationId = parseInt(req.params.id);
      
      await storage.deleteNotification(notificationId, userId);
      res.json({ message: "Notification deleted" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Test WebSocket notification endpoint (for development/testing)
  app.post('/api/test-notification', isCustomAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create a test notification
      const notification = await storage.createNotification({
        userId: user.id,
        type: "test_notification",
        title: "Test Notification",
        message: "This is a test notification to verify real-time updates are working.",
        priority: "low"
      });

      // Send real-time notification via WebSocket
      const wsManager = (global as any).wsManager;
      if (wsManager) {
        const sent = wsManager.sendToUser(user.id, {
          type: 'new_notification',
          notification: {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            priority: notification.priority,
            isRead: false,
            createdAt: notification.createdAt
          },
          count: await storage.getUnreadNotificationCount(user.id)
        });
        
        console.log(`[WebSocket] Test notification sent to user ${user.id}: ${sent}`);
      }

      res.json({ 
        message: "Test notification created and sent",
        notification: notification,
        websocketSent: !!wsManager
      });
    } catch (error) {
      console.error("Error creating test notification:", error);
      res.status(500).json({ message: "Failed to create test notification" });
    }
  });

  // Create test users for role verification (admin only)
  app.post('/api/create-test-users', isCustomAuthenticated, requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can create test users" });
      }

      const { hashPassword } = await import('./custom-auth');

      // Create test assessor
      const testAssessor = await storage.upsertUser({
        id: 'test-assessor-' + Date.now(),
        email: 'test.assessor@greda.com',
        firstName: 'Test',
        lastName: 'Assessor',
        role: 'assessor',
        passwordHash: await hashPassword('password123'),
        status: 'active',
        subscriptionTier: 'basic',
        subscriptionStatus: 'active'
      });

      // Create test client  
      const testClient = await storage.upsertUser({
        id: 'test-client-' + Date.now(),
        email: 'test.client@greda.com',
        firstName: 'Test',
        lastName: 'Client',
        role: 'client',
        passwordHash: await hashPassword('password123'),
        status: 'active',
        subscriptionTier: 'basic',
        subscriptionStatus: 'active'
      });

      res.json({ 
        message: "Test users created successfully",
        assessor: { email: testAssessor.email, password: 'password123' },
        client: { email: testClient.email, password: 'password123' }
      });
    } catch (error) {
      console.error("Error creating test users:", error);
      res.status(500).json({ message: "Failed to create test users" });
    }
  });

  // Test email notification endpoint
  app.post("/api/test-email-notification", isCustomAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can test email notifications" });
      }

      // Get a completed assessment for testing
      const assessments = await storage.getAllAssessments();
      const completedAssessment = assessments.find((a: any) => a.status === 'completed');
      
      if (!completedAssessment) {
        return res.status(404).json({ message: "No completed assessment found for testing" });
      }

      // Get assessor and client users
      const assessor = await storage.getUser(completedAssessment.userId);
      const client = await storage.getUser(completedAssessment.clientId);
      
      if (!assessor || !client) {
        return res.status(404).json({ message: "Assessor or client user not found" });
      }

      // Test different notification types based on request
      const { notificationType } = req.body;
      
      let emailSent = false;
      let message = "";
      
      switch (notificationType) {
        case 'assessment_completed':
          await notificationService.notifyAssessmentCompleted(completedAssessment, assessor, client);
          message = "Assessment completion notifications sent to client and admins";
          emailSent = true;
          break;
          
        case 'assessment_started':
          await notificationService.notifyAssessmentStarted(completedAssessment, assessor, client);
          message = "Assessment started notification sent to client";
          emailSent = true;
          break;
          
        case 'admin_note':
          const testNoteContent = "This is a test admin note to verify email notifications are working correctly.";
          await notificationService.notifyAdminNoteCreated(completedAssessment, user, client, testNoteContent);
          message = "Admin note notification sent to assigned user";
          emailSent = true;
          break;
          
        default:
          return res.status(400).json({ 
            message: "Invalid notification type. Use: assessment_completed, assessment_started, or admin_note" 
          });
      }

      res.json({
        message,
        emailSent,
        testData: {
          assessment: completedAssessment.buildingName,
          assessor: `${assessor.firstName} ${assessor.lastName}`,
          client: `${client.firstName} ${client.lastName}`,
          notificationType
        }
      });
    } catch (error) {
      console.error("Error testing email notification:", error);
      res.status(500).json({ 
        message: "Failed to test email notification", 
        error: error.message 
      });
    }
  });

  // Assessment Notes routes
  app.post('/api/assessments/:id/notes', isCustomAuthenticated, async (req: any, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can create assessment notes" });
      }

      const { content, assignedUserId } = req.body;
      
      if (!content || !assignedUserId) {
        return res.status(400).json({ message: "Content and assigned user ID are required" });
      }

      // Verify assessment exists and is completed
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      if (assessment.status !== 'completed') {
        return res.status(400).json({ message: "Notes can only be added to completed assessments" });
      }

      // Verify assigned user exists
      const assignedUser = await storage.getUser(assignedUserId);
      if (!assignedUser) {
        return res.status(404).json({ message: "Assigned user not found" });
      }

      // Create the note
      const note = await storage.createAssessmentNote({
        assessmentId,
        adminId: userId,
        assignedUserId,
        content,
        priority: req.body.priority || 'medium'
      });

      // Send notification to assigned user
      await notificationService.notifyAdminNoteCreated(assessment, user, assignedUser, content);

      res.json({ message: "Assessment note created successfully", note });
    } catch (error) {
      console.error("Error creating assessment note:", error);
      res.status(500).json({ message: "Failed to create assessment note" });
    }
  });

  app.get('/api/assessments/:id/notes', isCustomAuthenticated, async (req: any, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Verify assessment exists
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      // Get notes based on user role
      let notes;
      if (user.role === 'admin') {
        // Admins can see all notes for the assessment
        notes = await storage.getAssessmentNotes(assessmentId);
      } else {
        // Non-admins can only see notes assigned to them
        notes = await storage.getAssessmentNotesForUser(assessmentId, userId);
      }

      res.json(notes);
    } catch (error) {
      console.error("Error fetching assessment notes:", error);
      res.status(500).json({ message: "Failed to fetch assessment notes" });
    }
  });

  app.patch('/api/assessment-notes/:id/read', isCustomAuthenticated, async (req: any, res) => {
    try {
      const noteId = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Verify user can mark this note as read (must be assigned to them)
      const note = await storage.getAssessmentNote(noteId);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }

      if (note.assignedUserId !== userId) {
        return res.status(403).json({ message: "You can only mark notes assigned to you as read" });
      }

      await storage.markAssessmentNoteAsRead(noteId);
      res.json({ message: "Note marked as read" });
    } catch (error) {
      console.error("Error marking note as read:", error);
      res.status(500).json({ message: "Failed to mark note as read" });
    }
  });

  // Activity logging routes
  app.get('/api/activities', isCustomAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const { type, limit = 50 } = req.query;
      let activities;

      if (user.role === 'admin') {
        // Admins see only their own activities and system-wide administrative activities
        // They should NOT see personal activities of other users
        if (type) {
          activities = await storage.getActivityLogsByType(type, parseInt(limit));
        } else {
          // Get only admin's own activities - no cross-user activity visibility
          activities = await storage.getUserActivityLogs(userId, parseInt(limit));
        }
      } else {
        // Non-admins can only see their own activities
        activities = await storage.getUserActivityLogs(userId, parseInt(limit));
      }

      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.get('/api/activities/user/:userId', isCustomAuthenticated, async (req: any, res) => {
    try {
      const requestingUserId = req.user.id;
      const targetUserId = req.params.userId;
      const user = await storage.getUser(requestingUserId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Only admins can view other users' activities
      if (user.role !== 'admin' && requestingUserId !== targetUserId) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { limit = 50 } = req.query;
      const activities = await storage.getUserActivityLogs(targetUserId, parseInt(limit));

      res.json(activities);
    } catch (error) {
      console.error("Error fetching user activities:", error);
      res.status(500).json({ message: "Failed to fetch user activities" });
    }
  });

  app.get('/api/activities/stats', isCustomAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get activity statistics
      const allActivities = await storage.getAllActivityLogs(1000);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayActivities = allActivities.filter(activity => 
        new Date(activity.createdAt || '') >= today
      );

      const activityTypes = allActivities.reduce((acc, activity) => {
        acc[activity.activityType] = (acc[activity.activityType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const priorityBreakdown = allActivities.reduce((acc, activity) => {
        const priority = activity.priority || 'medium';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      res.json({
        totalActivities: allActivities.length,
        todayActivities: todayActivities.length,
        activityTypes,
        priorityBreakdown,
        recentActivities: allActivities.slice(0, 10)
      });
    } catch (error) {
      console.error("Error fetching activity stats:", error);
      res.status(500).json({ message: "Failed to fetch activity statistics" });
    }
  });

  // Admin endpoint to archive assessments
  app.post('/api/assessments/:id/archive', isCustomAuthenticated, async (req: any, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only administrators can archive assessments" });
      }

      // Get the assessment
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      // Check if already archived
      if (assessment.isArchived) {
        return res.status(400).json({ message: "Assessment is already archived" });
      }

      // Get the admin user
      const admin = await storage.getUser(userId);
      if (!admin) {
        return res.status(404).json({ message: "Admin user not found" });
      }

      // Archive the assessment
      await storage.updateAssessment(assessmentId, {
        isArchived: true,
        archivedBy: userId,
        archivedAt: new Date(),
      });

      // Get updated assessment for notifications
      const updatedAssessment = await storage.getAssessment(assessmentId);

      // Send notifications and emails to assessor and client
      await notificationService.notifyAssessmentArchived(updatedAssessment!, admin);

      // Log the activity
      await activityService.logAssessmentArchived(admin, updatedAssessment!);

      res.json({ 
        message: "Assessment archived successfully",
        success: true 
      });
    } catch (error) {
      console.error("Error archiving assessment:", error);
      res.status(500).json({ message: "Failed to archive assessment" });
    }
  });

  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', async (ws: AuthenticatedWebSocket, req) => {
    console.log('[WebSocket] New connection attempt');
    
    // Extract session from cookie
    const cookies = req.headers.cookie;
    if (!cookies) {
      console.log('[WebSocket] No cookies found, closing connection');
      ws.close(1008, 'Authentication required');
      return;
    }
    
    // Parse session ID from cookie
    const sessionMatch = cookies.match(/connect\.sid=([^;]+)/);
    if (!sessionMatch) {
      console.log('[WebSocket] No session cookie found, closing connection');
      ws.close(1008, 'Authentication required');
      return;
    }
    
    try {
      // For now, we'll use a simplified auth check
      // In a real implementation, you'd verify the session properly
      const sessionId = decodeURIComponent(sessionMatch[1]);
      
      // For demo purposes, we'll accept the connection and let the client send auth info
      console.log('[WebSocket] Connection established, waiting for auth');
      
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          
          if (data.type === 'auth') {
            // Client sends auth info
            const { userId, role } = data;
            
            if (userId && role) {
              ws.userId = userId;
              ws.role = role;
              wsManager.addConnection(userId, ws);
              
              ws.send(JSON.stringify({
                type: 'auth_success',
                message: 'WebSocket authentication successful'
              }));
              
              console.log(`[WebSocket] User ${userId} (${role}) authenticated`);
            }
          } else if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      });
      
      ws.on('close', () => {
        if (ws.userId) {
          wsManager.removeConnection(ws.userId, ws);
        }
      });
      
      ws.on('error', (error) => {
        console.error('[WebSocket] Connection error:', error);
        if (ws.userId) {
          wsManager.removeConnection(ws.userId, ws);
        }
      });
      
    } catch (error) {
      console.error('[WebSocket] Authentication error:', error);
      ws.close(1008, 'Authentication failed');
    }
  });
  
  // Export wsManager for use in other modules
  (global as any).wsManager = wsManager;
  
  return httpServer;
}
