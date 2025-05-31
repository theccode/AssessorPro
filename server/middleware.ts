import type { RequestHandler } from "express";
import { storage } from "./storage";

// Middleware to ensure user is authenticated and active
export const requireAuth: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user?.claims?.sub) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const dbUser = await storage.getUser(user.claims.sub);
    if (!dbUser || dbUser.status !== "active") {
      return res.status(403).json({ message: "Account not active" });
    }

    // Attach user to request for easy access
    req.dbUser = dbUser;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
};

// Middleware to ensure user is an admin
export const requireAdmin: RequestHandler = async (req, res, next) => {
  const dbUser = (req as any).dbUser;

  if (!dbUser || dbUser.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
};

// Middleware to check feature access based on subscription
export const requireFeature = (feature: string): RequestHandler => {
  return async (req, res, next) => {
    const dbUser = (req as any).dbUser;

    if (!dbUser) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const hasAccess = await storage.hasFeatureAccess(dbUser.id, feature);
    if (!hasAccess) {
      return res.status(403).json({ 
        message: "Feature access denied",
        feature,
        currentTier: dbUser.subscriptionTier,
        status: dbUser.subscriptionStatus
      });
    }

    next();
  };
};

// Audit logging middleware
export const auditLog = (action: string): RequestHandler => {
  return async (req, res, next) => {
    const dbUser = (req as any).dbUser;
    
    if (dbUser) {
      try {
        await storage.createAuditLog({
          userId: dbUser.id,
          action,
          details: {
            method: req.method,
            path: req.path,
            body: req.body,
            query: req.query,
          },
          ipAddress: req.ip,
          userAgent: req.get("User-Agent") || "",
        });
      } catch (error) {
        console.error("Audit log error:", error);
      }
    }

    next();
  };
};