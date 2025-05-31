import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

// Demo authentication middleware for testing
export const demoAuth: RequestHandler = async (req, res, next) => {
  // For demo purposes, create a test admin user
  const demoUser = await storage.upsertUser({
    id: "demo-admin-001",
    email: "admin@demo.com",
    firstName: "Demo",
    lastName: "Admin",
    role: "admin",
    status: "active",
    subscriptionTier: "enterprise",
    subscriptionStatus: "active",
  });

  // Attach user to request
  (req as any).user = {
    claims: {
      sub: demoUser.id,
      email: demoUser.email,
      first_name: demoUser.firstName,
      last_name: demoUser.lastName,
    }
  };

  next();
};

export function setupDemoAuth(app: Express) {
  // Demo login endpoint
  app.get("/api/demo-login", async (req, res) => {
    // Create demo users if they don't exist
    await storage.upsertUser({
      id: "demo-admin-001",
      email: "admin@demo.com",
      firstName: "Demo",
      lastName: "Admin",
      role: "admin",
      status: "active",
      subscriptionTier: "enterprise",
      subscriptionStatus: "active",
    });

    await storage.upsertUser({
      id: "demo-assessor-001",
      email: "assessor@demo.com",
      firstName: "Demo",
      lastName: "Assessor",
      role: "assessor",
      status: "active",
      subscriptionTier: "basic",
      subscriptionStatus: "active",
    });

    await storage.upsertUser({
      id: "demo-client-001",
      email: "client@demo.com",
      firstName: "Demo",
      lastName: "Client",
      role: "client",
      status: "active",
      subscriptionTier: "free",
      subscriptionStatus: "inactive",
    });

    // Set session to logged in as admin
    (req.session as any).demoUser = "demo-admin-001";
    res.redirect("/");
  });

  // Demo logout endpoint
  app.get("/api/demo-logout", (req, res) => {
    (req.session as any).demoUser = null;
    res.redirect("/");
  });

  // Demo user switch endpoint
  app.post("/api/demo-switch-user", async (req, res) => {
    const { userId } = req.body;
    (req.session as any).demoUser = userId;
    res.json({ success: true });
  });
}

export const isDemoAuthenticated: RequestHandler = async (req, res, next) => {
  const userId = (req.session as any)?.demoUser;
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await storage.getUser(userId);
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  // Attach user info to request
  (req as any).user = {
    claims: {
      sub: user.id,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
    }
  };

  next();
};