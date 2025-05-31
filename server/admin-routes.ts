import type { Express } from "express";
import { storage } from "./storage";
import { requireAuth, requireAdmin, auditLog } from "./middleware";
import { insertUserInvitationSchema, updateUserSchema } from "@shared/schema";
import { emailService } from "./email-service";
import crypto from "crypto";

export function registerAdminRoutes(app: Express) {
  // Get all users (admin only)
  app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get users by role (admin only)
  app.get('/api/admin/users/role/:role', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { role } = req.params;
      if (!["admin", "assessor", "client"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const users = await storage.getUsersByRole(role as any);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users by role:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Update user (admin only)
  app.patch('/api/admin/users/:id', requireAuth, requireAdmin, auditLog("user_updated"), async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = updateUserSchema.parse(req.body);
      
      const user = await storage.updateUser(id, updateData);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Update user status (admin only)
  app.patch('/api/admin/users/:id/status', requireAuth, requireAdmin, auditLog("user_status_changed"), async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!["active", "suspended", "pending"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const user = await storage.updateUserStatus(id, status);
      res.json(user);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // Update user subscription (admin only)
  app.patch('/api/admin/users/:id/subscription', requireAuth, requireAdmin, auditLog("subscription_changed"), async (req, res) => {
    try {
      const { id } = req.params;
      const { tier, status } = req.body;
      
      const validTiers = ["free", "basic", "premium", "enterprise"];
      const validStatuses = ["active", "inactive", "trial", "cancelled"];
      
      if (!validTiers.includes(tier) || !validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid tier or status" });
      }
      
      const user = await storage.updateUserSubscription(id, tier, status);
      res.json(user);
    } catch (error) {
      console.error("Error updating user subscription:", error);
      res.status(500).json({ message: "Failed to update subscription" });
    }
  });

  // Create user invitation (admin only)
  app.post('/api/admin/invitations', requireAuth, requireAdmin, auditLog("user_invited"), async (req: any, res) => {
    try {
      const dbUser = req.dbUser;
      
      // Generate unique token
      const token = crypto.randomBytes(32).toString('hex');
      
      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      // Create invitation data with generated fields
      const invitationData = insertUserInvitationSchema.parse({
        ...req.body,
        invitedBy: dbUser.id,
        token,
        expiresAt,
      });
      
      const invitation = await storage.createInvitation(invitationData);

      // Generate invitation link
      const domain = req.get('host');
      const protocol = req.secure ? 'https' : 'http';
      const invitationLink = `${protocol}://${domain}/invitations/${token}/accept`;

      // Send invitation email
      try {
        const inviterName = `${dbUser.firstName || ''} ${dbUser.lastName || ''}`.trim() || dbUser.email || 'Admin';
        
        await emailService.sendInvitationEmail(
          invitationData.email,
          inviterName,
          invitationData.role,
          invitationData.organizationName,
          token,
          invitationLink
        );
        
        console.log(`Invitation email sent to ${invitationData.email}`);
      } catch (emailError) {
        console.error("Failed to send invitation email:", emailError);
        // Continue anyway - invitation is created even if email fails
      }
      
      res.json(invitation);
    } catch (error) {
      console.error("Error creating invitation:", error);
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });

  // Get invitations by current admin
  app.get('/api/admin/invitations', requireAuth, requireAdmin, async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      const invitations = await storage.getInvitationsByInviter(dbUser.id);
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  // Get invitation details (public route with token)
  app.get('/api/invitations/:token', async (req, res) => {
    try {
      const { token } = req.params;
      
      const invitation = await storage.getInvitation(token);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      // Return invitation details without sensitive information
      res.json({
        email: invitation.email,
        role: invitation.role,
        organizationName: invitation.organizationName,
        status: invitation.status,
        expiresAt: invitation.expiresAt
      });
    } catch (error) {
      console.error("Error fetching invitation:", error);
      res.status(500).json({ message: "Failed to fetch invitation" });
    }
  });

  // Accept invitation (public route with token)
  app.post('/api/invitations/:token/accept', async (req, res) => {
    try {
      const { token } = req.params;
      
      const invitation = await storage.getInvitation(token);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      if (invitation.status !== "pending") {
        return res.status(400).json({ message: "Invitation already processed" });
      }
      
      if (new Date() > invitation.expiresAt) {
        await storage.updateInvitationStatus(token, "expired");
        return res.status(400).json({ message: "Invitation expired" });
      }
      
      // Mark invitation as accepted
      await storage.updateInvitationStatus(token, "accepted");
      
      res.json({ 
        message: "Invitation accepted",
        email: invitation.email,
        role: invitation.role,
        redirectTo: "/api/login"
      });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      res.status(500).json({ message: "Failed to accept invitation" });
    }
  });

  // Get audit logs (admin only)
  app.get('/api/admin/audit-logs', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userId, limit = 100 } = req.query;
      const logs = await storage.getAuditLogs(
        userId as string | undefined, 
        parseInt(limit as string, 10)
      );
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Get feature access for user (admin only)
  app.get('/api/admin/users/:id/features/:feature', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id, feature } = req.params;
      const hasAccess = await storage.hasFeatureAccess(id, feature);
      res.json({ userId: id, feature, hasAccess });
    } catch (error) {
      console.error("Error checking feature access:", error);
      res.status(500).json({ message: "Failed to check feature access" });
    }
  });

  // Cleanup expired invitations (admin only)
  app.post('/api/admin/invitations/cleanup', requireAuth, requireAdmin, auditLog("invitations_cleaned"), async (req, res) => {
    try {
      await storage.cleanupExpiredInvitations();
      res.json({ message: "Expired invitations cleaned up" });
    } catch (error) {
      console.error("Error cleaning up invitations:", error);
      res.status(500).json({ message: "Failed to cleanup invitations" });
    }
  });

  // Cancel invitation
  app.delete('/api/admin/invitations/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const dbUser = (req as any).dbUser;
      
      // Get invitation to verify ownership
      const invitation = await storage.getInvitation(id);
      if (!invitation || invitation.inviterId !== dbUser.id) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      // Update invitation status to expired (soft delete)
      await storage.updateInvitationStatus(id, "expired");
      
      res.json({ message: "Invitation canceled successfully" });
    } catch (error) {
      console.error("Error canceling invitation:", error);
      res.status(500).json({ message: "Failed to cancel invitation" });
    }
  });

  // Resend invitation
  app.post('/api/admin/invitations/:id/resend', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const dbUser = (req as any).dbUser;
      
      // Get existing invitation to verify ownership
      const existingInvitation = await storage.getInvitation(id);
      if (!existingInvitation || existingInvitation.inviterId !== dbUser.id) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      // Cancel the old invitation
      await storage.updateInvitationStatus(id, "expired");
      
      // Create a new invitation with fresh token and expiry
      const newToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
      
      const newInvitation = await storage.createInvitation({
        email: existingInvitation.email,
        role: existingInvitation.role,
        subscriptionTier: existingInvitation.subscriptionTier,
        organizationName: existingInvitation.organizationName,
        inviterId: dbUser.id,
        token: newToken,
        expiresAt,
        status: "pending"
      });
      
      // Send invitation email
      await emailService.sendInvitationEmail(
        existingInvitation.email,
        existingInvitation.role,
        newToken,
        `${dbUser.firstName} ${dbUser.lastName}` || dbUser.email || "Admin"
      );
      
      res.json({ message: "Invitation resent successfully", invitation: newInvitation });
    } catch (error) {
      console.error("Error resending invitation:", error);
      res.status(500).json({ message: "Failed to resend invitation" });
    }
  });
}