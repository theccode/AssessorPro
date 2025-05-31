import type { Express } from "express";
import { storage } from "./storage";
import { requireAuth, requireAdmin, auditLog } from "./middleware";
import { insertUserInvitationSchema, updateUserSchema } from "@shared/schema";
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
  app.post('/api/admin/invitations', requireAuth, requireAdmin, auditLog("user_invited"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      const invitationData = insertUserInvitationSchema.parse(req.body);
      
      // Generate unique token
      const token = crypto.randomBytes(32).toString('hex');
      
      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      const invitation = await storage.createInvitation({
        ...invitationData,
        invitedBy: dbUser.id,
        token,
        expiresAt,
      });
      
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
}